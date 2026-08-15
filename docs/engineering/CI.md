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
- Runs `pytest backend/ --cov=backend --cov-report=term-missing --cov-report=xml`.
- Uploads `coverage-backend.xml` as an artifact (14-day retention).
- **Result on main: 177 passed, 46% coverage.**

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

### 3. `frontend-root-tests` — root unit tests, jest (DIAGNOSTIC in V0.1)

- Node 20, `npm ci`, then `npm test -- --ci --reporters=default` (jest).
- The root jest config matches `**/__tests__/**/*.test.ts` only (not `.tsx`).
- This is the **only** runner for modules that have tests but **no module-local `package.json`**: `animation`, `graphics`, `performance`, `story-viz`, `companion`, `layouts/home`, `transition`, `pages/landing`.
- **Diagnostic / `continue-on-error`** because some suites `import from 'vitest'` and cannot run under jest — a known V0.1 jest/vitest mismatch (the repo is mid-migration to module-local vitest).
- **Result on main: 25 suites pass / 15 fail (vitest imports), 737 tests pass.**

### 4. `frontend-module-tests` — module-local vitest (DIAGNOSTIC in V0.1, per-module)

A matrix over the modules that have **both** a `package.json` and test files on V0.1 main:

| Module | Result on main |
|--------|----------------|
| `src/foundation` | 52 passed — green |
| `src/components/landing` | 22 passed — green |
| `src/conversation` | 8 failed + worker crash — pre-existing (PR #22 merged with failing tests) |
| `src/app` | 1 suite transform error, 24 tests pass — pre-existing |

- Each module is a separate matrix leg → separate check on the PR for granular visibility.
- `npm install` (not `npm ci`): only `src/foundation` ships a lockfile; the others declare deps but no lockfile yet.
- `npx vitest run --coverage`.
- **Diagnostic / `continue-on-error`** for V0.1: surfacing the broken modules is the point, but blocking every PR on a broken sibling module is not. Foundation and landing are green.

## Integration tests

Not present in V0.1. No integration test suite exists yet. When one is added, a new job should be inserted between module tests and the PASS/FAIL gate.

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
