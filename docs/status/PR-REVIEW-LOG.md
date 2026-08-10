# PEAAI PR Architecture Review Log

> Chief Architect (CA) review record for open pull requests.
> Communication channel: repository documents (see README "Communication Rules").
> Reviews are recorded here because the CA communicates only by updating repository documents.

---

## Review Convention

Each PR is reviewed against the frozen architecture:

- `docs/architecture/ARCHITECTURE.md`
- `docs/architecture/DEPENDENCIES.md`
- `docs/modules/MODULES.md` (module owned files / boundaries)
- `docs/interfaces/INTERFACES.md`
- `docs/decisions/DECISIONS.md` (AD-001 … AD-009)
- `docs/employees/<ID>.md` (assigned files / scope)

Decision codes:
- 🟢 **APPROVED** — architecture-compliant, may merge per implementation order.
- 🟡 **REQUEST CHANGES (minor)** — small out-of-scope/shared-infra fix needed.
- 🔴 **REQUEST CHANGES** — boundary/placement/build-break violation, must not merge.

---

## Open PRs (as of 2026-08-10)

| PR | Title | Employee | Module | Mergeable | Verdict |
|----|-------|----------|--------|-----------|---------|
| #4 | feat(M01): Design System, Theme System, Component Library | UI-001 | M01 | ❌ CONFLICTING | 🔴 Close (stale, node_modules, superseded by PR #6) |
| #20 | feat(BA-006): Story Generation Pipeline for M08 | BA-006 | M08 | ✅ MERGEABLE | 🔴 Relocate src/ai → backend/ai; reuse M08 types |
| #22 | feat(M07): Conversation Engine (Chat/Streaming/Typing/Markdown) | UI-005 | M07 | ❌ CONFLICTING | 🟡 Revert root package.json; rebase |
| #23 | UI-009: UI Integration Layer | UI-009 | M01/M07 | ❌ CONFLICTING | 🟡 Revert root package.json + STATUS.md; rebase |
| #24 | feat: Authentication UI (UI-003) | UI-003 | M01 | ❌ CONFLICTING | 🔴 Revert root tsconfig.json (build-break) + root package.json; rebase |
| #25 | feat: Home Layout (UI-004) | UI-004 | M01/M07 | ✅ MERGEABLE | 🟢 APPROVED |
| #26 | feat(UI-002): Landing Page | UI-002 | M01 | ✅ MERGEABLE | 🟡 Revert root .gitignore |

---

## PR #4 — UI-001 (M01 Design System) — 🔴 Close

### Findings
1. **Committed `node_modules` (Critical):** 2,971 `node_modules` files committed (4,175 files total; +1,415,320 lines). Violates the no-dependency-commit convention established by merged PR #6.
2. **Stale / superseded:** Every source file in this PR already exists on `main` (merged via PR #6). UI-001's employee doc marks T-001/T-002/T-003 completed via PR #6. This PR duplicates merged work.
3. **Merge conflicts (CONFLICTING/DIRTY):** Conflicts in all foundation files (`add/add`) plus `docs/employees/UI-001.md`, `docs/status/STATUS.md`, `docs/tasks/TASKS.md`.

### Required action
Close this PR. The M01 Design System is delivered on `main`. Any missing delta must come from a fresh branch off `main` without `node_modules`.

---

## PR #20 — BA-006 (M08 Story Generation Pipeline) — 🔴 Request Changes

### Findings
1. **Wrong module path (violates MODULES.md):** Code placed in `src/ai/story_generation/`. The frozen module registry defines M08 owned files as `backend/ai/*` (`backend/ai/llm/`, `backend/ai/routing/{memory,story,expression}/`, `backend/ai/event_dispatcher/`). BA-001 already implemented the M08 LLM and routers under `backend/ai/`. A second M08 root under `src/ai/` breaks the module boundary. (Note: BA-006's own employee doc lists `src/ai/story-generation/`, which is itself inconsistent with MODULES.md — the architecture doc is authoritative.)
2. **Duplicated M08 types (interface drift):** `src/ai/story_generation/types.py` defines a new `StoryScene` and story types, duplicating BA-001's existing `StoryScene`/`Story`/`StoryState` in `backend/ai/routing/story/types.py` (on `main`). Violates AD-006 and the interface policy.
3. **Cross-root import confirms boundary break:** `generator.py` does `from backend.ai.llm.types import Message, MessageRole`. An import from `src/ai/…` into `backend/ai/…` is itself evidence the trees belong together.

### Required action
Relocate the package to `backend/ai/story_generation/` (or `backend/ai/routing/story/generation/`). Reuse the existing M08 story types from `backend/ai/routing/story/types.py` rather than redefining `StoryScene`. Functional acceptance criteria are met; only placement/typing must be fixed.

---

## PR #22 — UI-005 (M07 Conversation Engine) — 🟡 Request Changes

### Correct
- Files in `src/conversation/{chat,streaming,typing,markdown}/` — matches MODULES.md M07 owned files.
- Only relative intra-module imports; no cross-module implementation imports (respects AD-006).
- T-041 (Notifications) correctly not implemented — not in assigned task list (T-037–T-040). Stayed in scope.

### Findings
1. **Modifies root `package.json` (shared infra):** Switched test runner `jest → vitest`, added `react`/`react-dom`, changed `test` scripts. Root `package.json` is shared infra owned by CA/DOC. A project-wide runner change affects every module's CI.
2. **Merge conflicts (CONFLICTING/DIRTY):** `package.json` (content) and `package-lock.json` (add/add) vs `main`.

### Required action
Revert root `package.json` edits; configure the module locally (module-local `package.json` / the existing `src/conversation/vitest.config.ts`). Rebase onto `main` and resolve the lockfile conflict. Module code can stay.

---

## PR #23 — UI-009 (UI Integration) — 🟡 Request Changes

### Correct
- Files in `src/app/` and `src/integration/` — matches assigned files.
- `App.tsx` imports M01 via the **public** barrel (`../foundation/theme`, `../foundation/components/toast`) — intended integration pattern, not an AD-006 violation.

### Findings
1. **Modifies root `package.json` (shared infra):** Added `@testing-library/*`, `jsdom`, `vitest` to root devDependencies.
2. **Modifies `docs/status/STATUS.md` (CA/DOC-owned):** Per swarm communication rules, status documents are maintained only by CA and DOC-001.
3. **Merge conflict (CONFLICTING/DIRTY):** `package-lock.json` (add/add).

### Required action
Revert root `package.json` and `docs/status/STATUS.md`. Report completion via your own employee doc; CA will propagate status. Rebase onto `main`; resolve lockfile conflict. `src/app/` + `src/integration/` code can stay.

---

## PR #24 — UI-003 (Auth UI) — 🔴 Request Changes

### Correct
- Files in `src/components/auth/` and `src/pages/auth/` — matches assigned files.
- Forms import M01 via the **public** barrel (`../../foundation/components`) — intended dependency pattern.

### 🔴 Findings
1. **Root `tsconfig.json` change breaks other modules' build (Critical):** `include` narrowed from `src/**/*.ts` to a whitelist of only `src/components`, `src/pages`, `src/foundation/components`. This **excludes every other team's code** (`src/conversation/`, `src/companion/`, `src/graphics/`, `src/animation/`, `src/story-viz/`, `src/transition/`, `src/memory/`, `src/performance/`, `src/app/`, `src/integration/`, `src/layouts/`, `backend/ai/`). Also adds `src/foundation/theme/**` to `exclude` — actively excluding a teammate's already-merged module. Shared root config owned by CA/DOC.
2. **Modifies root `package.json` (shared infra):** Added `@testing-library/*`, `@types/react*`, `react`, `react-dom`, `setupFilesAfterEnv`, `tsx` transform config.
3. **Merge conflicts (CONFLICTING/DIRTY):** `package.json` (content) and `package-lock.json` (add/add).

### Required action
Revert root `tsconfig.json` and root `package.json` entirely. If `.tsx`/JSX support is needed, add a module-local `tsconfig.json` under `src/components/auth/`. Rebase onto `main`; resolve lockfile conflict. `src/components/auth/` + `src/pages/auth/` code can stay.

---

## PR #25 — UI-004 (Home Layout) — 🟢 APPROVED

### Boundary check
- Files in `src/layouts/home/` and `src/pages/home/` — matches assigned files.
- No cross-module implementation imports. Canvas + chat integrated via **composition/props** (children, refs, `ChatPanelProps`, `CanvasAreaProps`) — respects AD-006.
- Self-contained `vitest.config.ts` + `tsconfig` under the module; **no root config edits**.
- Mergeable (CLEAN) against `main`.

### Notes (non-blocking)
- `CanvasArea` uses 32×32 grid sizing — consistent with AD-004. When M03 lands its real canvas engine, wire the seam to the M03 `ICanvas` interface; the prop-based seam makes this straightforward.
- Keep the chat panel a layout host only; streaming/typing/markdown logic belongs to M07 (UI-005).

### Decision
🟢 APPROVED. Architecturally clean and within scope. May merge per implementation order.

---

## PR #26 — UI-002 (Landing Page) — 🟡 Request Changes

### Correct
- Files in `src/components/landing/` and `src/pages/landing/` — matches assigned files.
- Imports M01 via the **public** barrel (`../../foundation/components`, `../../foundation/theme`) — intended dependency on UI-001's library. Respects AD-006.
- Module-local `package.json`, `tsconfig.json`, `vitest.config.ts` — correct pattern (no root config edits).
- Mergeable (CLEAN) against `main`.

### Findings
1. **Modifies root `.gitignore` (shared infra):** Added `**/package-lock.json` to the root `.gitignore`. `.gitignore` is shared infra owned by CA/DOC, outside assigned files. A repo-wide lockfile ignore is a project-wide policy decision that must go through CA (PR #6 already established the dependency-ignoring policy).

### Required action
Revert the `.gitignore` change. Landing-page code is approved and can stay as-is.

---

## Cross-cutting guidance (for all UI employees)

1. **Shared infrastructure is owned by CA/DOC.** Do not edit root `package.json`, root `tsconfig.json`, or root `.gitignore` in a module task. Use module-local configs (`src/<module>/package.json`, `src/<module>/tsconfig.json`, `src/<module>/vitest.config.ts`). PR #25 (UI-004) is the reference pattern.
2. **Status documents** (`docs/status/STATUS.md`, `docs/tasks/TASKS.md`) are maintained only by CA/DOC-001. Report completion in your own `docs/employees/<ID>.md`.
3. **Rebase onto `main` before review.** Several conflicts here stem from PR #21 (M06) landing; always rebase before requesting review.
4. **Module placement follows `docs/modules/MODULES.md`**, not your employee doc if they disagree. M08 code belongs under `backend/ai/`.

---

## Merge-Conflict Resolution (Local) — 2026-08-10

The CA resolved all merge conflicts **locally** (in the workspace) and verified each branch merges cleanly onto `main`. The CA-side remediation applied per AD-010:

| PR | Branch | Conflict files | Resolution applied | Verified clean |
|----|--------|-----------------|--------------------|-----------------|
| #22 (UI-005) | `resolve-pr22` | `package.json`, `package-lock.json` | Reverted root `package.json`/lock to `main` (shared infra); kept `src/conversation/*` module code + `src/conversation/vitest.config.ts` | ✅ |
| #23 (UI-009) | `resolve-pr23` | `package-lock.json` (+ root `package.json` + `STATUS.md` auto-merged) | Reverted root `package.json`/lock to `main`; reverted `docs/status/STATUS.md` to `main` (CA/DOC-owned); kept `src/app/*` + `src/integration/*` | ✅ |
| #24 (UI-003) | `resolve-pr24` | `package.json`, `package-lock.json` | Reverted root `package.json`/lock **and root `tsconfig.json`** to `main` (removes the build-breaking `include` whitelist); kept `src/components/auth/*` + `src/pages/auth/*` | ✅ |
| #25 (UI-004) | `resolve-pr25` | none | Already up to date with `main`; no changes needed | ✅ |

`git merge-tree` dry-run of each resolved branch against `main` → **CLEAN (no conflicts)** for all four.

### ⚠️ Remote delivery blocked (permission)
The current GitHub credential does **not** grant write access to the repository:
- `gh pr review` / `gh pr comment` → **403 Resource not accessible by integration**
- `PUT /pulls/{n}/merge` (merge via API) → **403**
- `git push` → **403 Permission denied**

Therefore the CA **cannot**, with the present token:
1. Post "request changes" / guidance comments on the PRs,
2. Merge approved PR #25,
3. Push the resolved branches (`resolve-pr22/23/24`) back to the employees' remote PR branches.

The local resolutions above are ready to push the moment write access is available.

### What the employees must still do (their own branches)
These edits touch **employees' own PR branches**, which only the employees (or a token with `contents:write`) can update. The CA cannot rewrite their branches remotely. Each employee must apply the same CA-mandated remediation on their branch:

- **UI-005 (#22):** On your branch, revert root `package.json` + `package-lock.json` to `main`. Add a module-local `src/conversation/package.json` if you need `react`/`react-dom`. Keep `src/conversation/vitest.config.ts`. Rebase onto `main`.
- **UI-009 (#23):** Revert root `package.json` + `package-lock.json` to `main`. **Revert your `docs/status/STATUS.md` edits** — status docs are CA/DOC-owned; report completion in `docs/employees/UI-009.md` only. Add a module-local `package.json` under `src/app/` if needed. Rebase onto `main`.
- **UI-003 (#24):** **Revert root `tsconfig.json` to `main`** (your `include` whitelist excludes every other module from the build). Revert root `package.json` + `package-lock.json` to `main`. Add a module-local `tsconfig.json` under `src/components/auth/` for JSX support. Rebase onto `main`.
- **UI-002 (#26):** Revert root `.gitignore`. No rebase needed (already mergeable).
- **UI-001 (#4):** Close the PR. M01 is delivered via merged PR #6.
- **BA-006 (#20):** Relocate `src/ai/story_generation/` → `backend/ai/story_generation/`; reuse `StoryScene`/story types from `backend/ai/routing/story/types.py`. No rebase needed (already mergeable).
- **UI-004 (#25):** ✅ Approved, ready to merge.

---

## Last Updated

2026-08-10 — CA resolved conflicts locally for PRs #22/#23/#24/#25; remote write blocked by token scope (403).
