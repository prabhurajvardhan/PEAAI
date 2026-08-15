# CI — GitHub Actions Workflow

This documents the continuous-integration workflow at `.github/workflows/ci.yml` and what it checks for the PEAAI V0.1 codebase.

## When it runs

- On every **push** to `main`.
- On every **pull request** targeting `main`.
- Superseded runs on the same ref are cancelled (`concurrency`), to save CI minutes on the free/public plan.

## AEF workflow placement

```
Employee -> Pull Request -> GitHub Actions -> Build -> Lint
        -> Frontend Tests -> Backend Tests -> PASS/FAIL -> CA Review -> Merge
```

The Chief Architect (CA) reviews a PR **after** CI completes. CI is a truth-teller: it runs the repository's real commands and reports pass/fail per job. The CA decides whether to merge.

## Jobs

### 1. `backend` — tests + coverage (GATING)

The reliable gating signal in V0.1. `backend/ai` is the only fully-implemented backend module and its suite is green.

- Python 3.11 (matches `backend/setup.py` `python_requires>=3.10`).
- Installs `backend/requirements.txt` plus test-only deps (`httpx`, `pytest`, `pytest-asyncio`, `pytest-cov`) that the runtime-only requirements file omits.
- Runs `python -m pytest backend/ --cov=backend --cov-report=term-missing --cov-report=xml`. Uses `python -m pytest` (not the bare `pytest` script) so the repo root is on `sys.path` and `from backend.ai...` imports resolve — the test files' own `sys.path` manipulation assumes the repo root is importable.
- Uploads `coverage-backend.xml` as an artifact (14-day retention).
- **Result on main: 177 passed, 46% coverage.**

> **Manifest fix applied in this PR:** `backend/requirements.txt` listed `magic>=0.4.27`, but the PyPI package `magic` tops out at 0.1.1 (`No matching distribution found`), which blocked `pip install` entirely. Corrected to `python-magic>=0.4.27` (the package that provides the `magic` module; 0.4.27 exists as a pure-Python wheel). This is a dependency-name correction, not a functionality change — no backend code imports `magic` yet (the storage module is unimplemented), and the `import magic` API is unchanged.

### 2. `frontend-build-lint` — build + lint (DIAGNOSTIC in V0.1)

- Node 20 LTS (vitest requires `^18 || >=20`; Node 20 is the safe LTS on GitHub-hosted runners).
- `npm ci` using the tracked root `package-lock.json` (lockfile v3).
- `npm run build` (`tsc`) — **diagnostic / `continue-on-error`**.
- `npm run lint` (`eslint src --ext .ts`) — **diagnostic / `continue-on-error`**.

**Why non-gating:** these are V0.1-known repository misconfigurations, surfaced (not hidden) by CI:

| Command | V0.1 status | Root cause |
|---------|-------------|------------|
| `npm run build` | fails | Root `tsconfig.json` has no `jsx`, and several barrel `.ts` files re-export `.tsx`; the `transition` module has pre-existing type errors (null checks, `import type` used as value, missing `../event-bus`). Per the AD-010 module-local-config convention the root config is intentionally minimal — frontend builds are module-local, not root-level. |
| `npm run lint` | fails | `eslint` is referenced by the `lint` script but is **not** a dependency in root `package.json`, and no eslint config file exists. |

Each step runs and its real pass/fail is shown as a warning on the PR. Flip to gating once a root build config and eslint are added.

### 3. `frontend-root-tests` — root unit tests under JEST (GATING)

The repo is mid-migration from jest to vitest (V0.1). The root jest config globs `**/__tests__/**/*.test.ts`, which mixes two populations:

- **jest-authored suites** (animation, graphics, performance, story-viz): use `describe/it/expect` globals and `jest.fn`/`jest.useFakeTimers`. 25 suites / 737 tests.
- **vitest-authored suites** (`import { ... } from 'vitest'`) in app, conversation, companion, transition: cannot run under jest (`Vitest cannot be imported in a CommonJS module using require()`).

**CI fix (test-configuration — not a hidden failure):** this job runs jest with `--testPathIgnorePatterns="src/(app|conversation|companion|transition)/"` so jest runs ONLY the 25 jest-compatible suites. The vitest suites are run by their proper runner:

- app, conversation → `frontend-module-tests` vitest matrix.
- companion, transition → `frontend-root-vitest` job (those modules have no module-local package.json).

**Result on main: 25 suites / 737 tests pass.** This job is gating.

### 4. `frontend-root-vitest` — root vitest for module-less modules (GATING)

`companion` and `transition` author tests with `import { ... } from 'vitest'` but have NO module-local package.json/vitest config (they predate the AD-010 module-local convention). They cannot run under jest. The root `devDependencies` include vitest, so this job runs them under the root vitest:

```
npx vitest run src/companion src/transition
```

Default (node) environment — these tests do not use the DOM.

**Result on main: 12 suites / 221 tests pass.** This job is gating.

### 5. `frontend-module-tests` — module-local vitest (per-leg gating)

Per the AD-010 module-local config convention, each UI module owns its own `package.json` + `vitest.config.ts`. This matrix runs vitest for every module that has BOTH a `package.json` and test files. Each module is a separate check. Gating policy is per-leg via `allow_failure`:

| Module | Result on main | Gating |
|--------|----------------|--------|
| `src/foundation` | 52 passed — green | gating (`allow_failure: false`) |
| `src/components/landing` | 22 passed — green | gating (`allow_failure: false`) |
| `src/conversation` | StreamManager worker OOM — pre-existing | diagnostic (`allow_failure: true`) |
| `src/app` | ModuleIntegration react-resolution failure — pre-existing | diagnostic (`allow_failure: true`) |

- `npm install` (not `npm ci`): only `src/foundation` ships a lockfile; the others declare deps but no lockfile yet.
- `npx vitest run` (no `--coverage` — the module `package.json` files do not declare `@vitest/coverage-v8`; coverage is reported for the backend job where `pytest-cov` is available).
- The two diagnostic legs keep their failures **visible** (red on the leg with full logs). `continue-on-error` only prevents a pre-existing sibling defect from blocking unrelated PRs — this is the documented-pre-existing case, not a hidden/fixable failure.

## Integration tests

Not present in V0.1. No integration test suite exists yet. When one is added, a new job should be inserted between module tests and the PASS/FAIL gate.

## Failed-check diagnosis (CI debugging pass)

Every failed check from the CI runs on PR #27 was inspected from the GitHub Actions logs, root-caused, and classified. Fixable CI/dependency/test-configuration problems were fixed; genuine pre-existing V0.1 code problems were documented (not artificially made to pass).

### Backend tests + coverage (gating) — fixed, now GREEN

| | |
|---|---|
| Root cause | Two issues: (1) `pip install -r backend/requirements.txt` failed — `magic>=0.4.27` has no matching PyPI distribution (PyPI `magic` tops out at 0.1.1; intended package is `python-magic`). (2) `pytest backend/` (bare console script) failed at collection with `ModuleNotFoundError: No module named 'backend'` — the test files do `sys.path.insert(0, Path(__file__).parent.parent.parent)` which from `backend/ai/__tests__/` resolves to `backend/` (off-by-one, not the repo root); masked only when pytest runs as `python -m pytest` (cwd on sys.path). |
| Classification | (1) dependency problem; (2) test-configuration / invocation problem. Both pre-existing in V0.1, surfaced by CI. |
| Fix | (1) `magic>=0.4.27` → `python-magic>=0.4.27` in `backend/requirements.txt` (dependency-name correction; no backend code imports `magic` yet). (2) workflow invokes `python -m pytest backend/` so the repo root is on `sys.path`. |
| Test result | 177 passed, 46% coverage, exit 0. Gating, green. |

### Frontend root unit tests (jest) — fixed, now GATING + GREEN

| | |
|---|---|
| Root cause | The root jest config globs `**/__tests__/**/*.test.ts`, matching both jest-authored and vitest-authored suites. The 15 vitest suites (`import { ... } from 'vitest'` in app, conversation, companion, transition) fail under jest with `Vitest cannot be imported in a CommonJS module using require()`. |
| Classification | test-configuration problem (wrong runner for vitest suites), pre-existing V0.1. |
| Fix | Run jest with `--testPathIgnorePatterns="src/(app|conversation|companion|transition)/"` so jest runs only the 25 jest-compatible suites. The excluded vitest suites are run by their proper runner (module vitest matrix + new root-vitest job) — they are not hidden, they run elsewhere. |
| Test result | 25 suites / 737 tests pass, exit 0. Gating, green. |

### Frontend root vitest (companion + transition) — NEW job, GATING + GREEN

| | |
|---|---|
| Root cause | `companion` and `transition` tests are authored with `import { ... } from 'vitest'` but those modules have NO module-local `package.json`/vitest config (they predate AD-010). They were being picked up by the root jest job, which cannot run them. |
| Classification | test-configuration / coverage gap, pre-existing V0.1. |
| Fix | Added a `frontend-root-vitest` job that runs `npx vitest run src/companion src/transition` using the root-installed vitest (default node env — these tests do not use the DOM). This honestly covers suites that were previously failing under jest. |
| Test result | 12 suites / 221 tests pass, exit 0. Gating, green. |

### Frontend conversation tests (vitest) — diagnostic; real failure now visible

| | |
|---|---|
| Root cause | (1) Surface error: `MISSING DEPENDENCY: Cannot find dependency 'jsdom'` — the module `vitest.config.ts` sets `environment: 'jsdom'` but `jsdom` was not in `devDependencies`. (2) Beneath that (after jsdom is provided): `StreamManager.test.ts` crashes the vitest worker with `Worker terminated due to reaching memory limit: JS heap out of memory` (`ERR_WORKER_OUT_OF_MEMORY`), caused by the `StreamManager` streaming loop / test. Reproduced locally with jsdom installed. |
| Classification | (1) dependency problem (missing devDependency) — fixed. (2) existing V0.1 code/test problem — documented, NOT fixed (would require modifying application code, which is out of CI scope). |
| Fix | (1) Added `jsdom` to `src/conversation/package.json` devDependencies (the vitest config requires it). This makes the REAL failure surface instead of the jsdom red herring. (2) No code fix — documented. The leg remains `allow_failure: true` so the OOM stays visible (red, with full logs) without blocking unrelated PRs. |
| Test result | 5 suites / 85 tests pass; `StreamManager.test.ts` worker OOM (1 file failed). Diagnostic, visible. |

### Frontend app tests (vitest) — diagnostic; real failure now visible

| | |
|---|---|
| Root cause | (1) Surface error: `MISSING DEPENDENCY: Cannot find dependency 'jsdom'` (same as conversation). (2) Beneath that: `ModuleIntegration.test.ts` imports `../../integration/ModuleIntegration.tsx` (i.e. `src/integration/ModuleIntegration.tsx`, a file OUTSIDE the `src/app` module). That file imports `react`, but `src/integration` has no `package.json`/`node_modules` and `react` is not at the repo root, so vite cannot resolve `react` from a file outside `src/app`. This breaks AD-010 module-local isolation (an app test reaches across module boundaries into a module that has no declared `react` dependency). |
| Classification | (1) dependency problem — fixed. (2) existing V0.1 code/test problem (cross-module dependency breaking module-local isolation) — documented, NOT fixed (would require moving the test or adding a package.json to `src/integration`, both application changes out of CI scope). |
| Fix | (1) Added `jsdom` to `src/app/package.json` devDependencies. (2) No code fix — documented. The leg remains `allow_failure: true` so the failure stays visible. |
| Test result | 4 suites / 24 tests pass; `ModuleIntegration.test.ts` fails (react resolution). Diagnostic, visible. |

### Frontend build + lint (diagnostic) — unchanged, documented V0.1 misconfig

`npm run build` (tsc) and `npm run lint` (eslint) remain diagnostic: root `tsconfig.json` has no `jsx`, eslint is not installed/configured. These are pre-existing V0.1 misconfigurations surfaced (not hidden) by CI. No fix applied — they require root build/lint setup, which is a separate task.

## What the CI does NOT do

- Does **not** set or change branch protection / required status checks (per instruction; see "Branch protection" below).
- Does **not** install the frontend's `react`/`@testing-library` deps at the root — that would violate AD-010 (root `package.json` stays minimal). Frontend deps are installed module-local.
- Does **not** introduce new application dependencies. The only added packages are CI/test tooling (`pytest`, `pytest-cov`, `httpx`, `pytest-asyncio`) installed inside the workflow, not added to the repo's manifests.

## Branch protection (inspected, not changed)

As of this writing, `main` has **no branch protection** (confirmed via `GET /branches/main/protection` → 404). Required status checks are therefore not enforced. This is safe to leave as-is for V0.1: because several frontend jobs are diagnostic (V0.1-known-broken), enforcing them as required checks would block every PR. Recommended path:

1. First stabilize the diagnostic frontend jobs (fix root `tsconfig`/`jsx`, add eslint, fix `conversation`/`app` tests).
2. Flip the corresponding `continue-on-error: true` flags to `false` (remove them).
3. Then enable branch protection on `main` with required status checks: `backend`, `frontend-module-tests (foundation)`, `frontend-module-tests (components/landing)`, etc.

Branch-protection configuration changes repository settings and must be explicitly authorized by the repo owner before the CA applies it.

## Promoting diagnostic jobs to gating

Each diagnostic job/step has a `continue-on-error: true` and an inline comment explaining why. To gate it:

1. Resolve the documented V0.1 issue for that job.
2. Remove `continue-on-error: true` from the job (and any step-level ones in `frontend-build-lint`).
3. Verify on a PR that the job is green.
4. (Optional, with owner authorization) add it as a required status check under `main` branch protection.

## Local reproduction

```bash
# Backend (gating) — 177 passed
pip install -r backend/requirements.txt httpx pytest pytest-asyncio pytest-cov
pytest backend/ --cov=backend --cov-report=term-missing -q

# Frontend root (jest, diagnostic)
npm ci
npm test -- --ci --reporters=default

# Frontend module (vitest, per module)
cd src/foundation && npm install && npx vitest run
```
