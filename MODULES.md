# PEAAI Modules

> Frozen module definitions for PEAAI

---

## Module Definitions

### M01: Pixel Canvas

| Property | Value |
|----------|-------|
| Purpose | Render everything shown on the screen |
| Language | TypeScript/JavaScript |
| Framework | HTML5 Canvas API |
| Dependencies | None |
| Boundary | Pure rendering engine, no business logic |
| Output | Canvas DOM element with rendering context |

### M02: Companion Face Engine

| Property | Value |
|----------|-------|
| Purpose | Generate the AI face |
| Language | TypeScript/JavaScript |
| Dependencies | M01 (Pixel Canvas) |
| Boundary | Face geometry and expressions only |
| Output | Face sprite data and animation states |

### M03: Expression Engine

| Property | Value |
|----------|-------|
| Purpose | Control facial expressions |
| Language | TypeScript/JavaScript |
| Dependencies | M01, M02 |
| Boundary | Expression state machine and transitions |
| Output | Expression state commands |

### M04: Story Engine

| Property | Value |
|----------|-------|
| Purpose | Generate scene-by-scene storytelling |
| Language | TypeScript/JavaScript |
| Dependencies | M08 (AI Orchestrator) |
| Boundary | Story planning and scene decomposition |
| Output | Scene队列 of story segments |

### M05: Story Renderer

| Property | Value |
|----------|-------|
| Purpose | Render cinematic pixel scenes |
| Language | TypeScript/JavaScript |
| Dependencies | M01 (Pixel Canvas) |
| Boundary | Visual scene rendering only |
| Output | Scene sprite data |

### M06: Transition Engine

| Property | Value |
|----------|-------|
| Purpose | Transition between Companion Mode and Story Mode |
| Language | TypeScript/JavaScript |
| Dependencies | M01, M02, M05 |
| Boundary | Pixel dissolve and particle effects |
| Output | Transition animation state |

### M07: Chat System

| Property | Value |
|----------|-------|
| Purpose | User interaction |
| Language | TypeScript/JavaScript |
| Dependencies | None |
| Boundary | UI only, no business logic |
| Output | Chat message DOM |

### M08: AI Orchestrator

| Property | Value |
|----------|-------|
| Purpose | Coordinate every AI subsystem |
| Language | TypeScript/JavaScript |
| Dependencies | All modules |
| Boundary | Event routing and coordination only |
| Output | Event bus and routing logic |

### M09: Memory Engine

| Property | Value |
|----------|-------|
| Purpose | Long-term memory |
| Language | TypeScript/JavaScript |
| Dependencies | None (browser storage) |
| Boundary | Storage and retrieval only |
| Output | Memory API |

### M10: Backend

| Property | Value |
|----------|-------|
| Purpose | Server infrastructure |
| Language | Python/TypeScript |
| Dependencies | None |
| Boundary | API, auth, database |
| Output | REST/WebSocket API |

---

## Module Dependency Graph

```
M01 (Pixel Canvas)
  ├── M02 (Companion Face Engine)
  ├── M05 (Story Renderer)
  └── M07 (Chat System)
       │
       ▼
M02 + M05 + M06 (Transition Engine)
  │
  ▼
M03 (Expression Engine)
  │
  ▼
M08 (AI Orchestrator)
  │
  ├──► M04 (Story Engine)
  │
  └──► M09 (Memory Engine)
           │
           ▼
      M10 (Backend)
```

---

## Module Status

| ID | Module | Status | Sprint |
|----|--------|--------|--------|
| M01 | Pixel Canvas | 🔴 Not Started | Sprint 1 |
| M02 | Companion Face Engine | 🔴 Not Started | Sprint 1 |
| M03 | Expression Engine | 🔴 Not Started | Sprint 1 |
| M04 | Story Engine | 🔴 Not Started | Sprint 2 |
| M05 | Story Renderer | 🔴 Not Started | Sprint 2 |
| M06 | Transition Engine | 🔴 Not Started | Sprint 2 |
| M07 | Chat System | 🔴 Not Started | Sprint 3 |
| M08 | AI Orchestrator | 🔴 Not Started | Sprint 3 |
| M09 | Memory Engine | 🔴 Not Started | Sprint 3 |
| M10 | Backend | 🔴 Not Started | Sprint 4 |

---

## Module Boundaries

Each module MUST:
- Have a single, well-defined purpose
- Expose a clean public API
- Have no knowledge of other module internals
- Be independently testable
- Have no circular dependencies

Each module MUST NOT:
- Access another module's private state
- Directly modify another module's data
- Import implementation details from other modules
- Create cross-module coupling

---

## Interface Contracts

All module interfaces are defined in `INTERFACES.md`.

No module may change its public interface without approval from the Chief Architect.
