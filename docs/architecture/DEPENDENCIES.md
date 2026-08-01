# PEAAI Module Dependencies

> Module dependency graph and build order

---

## Dependency Graph

```
M01 (Product Foundation)
├── No external dependencies
├── Used by: M02, M03, M04, M05, M06, M07
└── Layer: Foundation

M02 (Companion Engine)
├── Depends on: M01, M03
├── Uses: M03 (Canvas), M04 (Animation)
├── Used by: M06, M08
└── Layer: Graphics

M03 (Pixel Graphics Engine)
├── Depends on: M01
├── Uses: M11 (Performance hints)
├── Used by: M02, M04, M05, M06
└── Layer: Graphics

M04 (Animation Engine)
├── Depends on: M01, M03
├── Uses: M03 (Pixel operations)
├── Used by: M02, M05, M06, M07
└── Layer: Graphics

M05 (Story Visualization Engine)
├── Depends on: M01, M03, M04
├── Uses: M03 (Scene pixels), M04 (Scene animations)
├── Used by: M06, M08
└── Layer: Graphics

M06 (Transition Engine)
├── Depends on: M01, M02, M03, M04, M05
├── Uses: M02 (Face), M05 (Story), M03 (Pixels), M04 (Animations)
├── Used by: M08
└── Layer: Graphics

M07 (Conversation Engine)
├── Depends on: M01, M04
├── Uses: M01 (UI), M04 (Typing animation)
├── Used by: M08
└── Layer: Application

M08 (AI Engine)
├── Depends on: M02, M05, M06, M07, M09, M10, M11
├── Uses: All modules for coordination
├── Used by: None (Terminal)
└── Layer: Application

M09 (Backend Infrastructure)
├── Depends on: M11
├── Uses: M11 (Performance monitoring)
├── Used by: M08, M10
└── Layer: Infrastructure

M10 (Memory Engine)
├── Depends on: M09
├── Uses: M09 (Database/Storage)
├── Used by: M08
└── Layer: Infrastructure

M11 (Performance Engine)
├── Depends on: None
├── Used by: M03, M04, M09, M10
└── Layer: Infrastructure
```

---

## Build Order (Topological Sort)

| Order | Module | Reason |
|-------|--------|--------|
| 1 | M01 | Foundation - no dependencies |
| 2 | M11 | Infrastructure - no dependencies |
| 3 | M03 | Graphics base - depends on M01 |
| 4 | M04 | Animation - depends on M01, M03 |
| 5 | M02 | Companion - depends on M01, M03 |
| 6 | M05 | Story Viz - depends on M01, M03, M04 |
| 7 | M06 | Transition - depends on M02, M03, M04, M05 |
| 8 | M07 | Conversation - depends on M01, M04 |
| 9 | M09 | Backend - depends on M11 |
| 10 | M10 | Memory - depends on M09 |
| 11 | M08 | AI Engine - depends on all |

---

## Module Communication

### Event Bus Dependencies

```
M08 (AI Engine) ←→ All Modules
     ↑
     ├── M02 (Companion) → Expression requests
     ├── M05 (Story Viz) → Scene data
     ├── M06 (Transition) → Mode switches
     ├── M07 (Conversation) → User input
     ├── M10 (Memory) → Context data
     └── M09 (Backend) → API responses
```

---

## Cross-Module Interfaces

| From | To | Interface | Purpose |
|------|-----|-----------|---------|
| M02 | M03 | ICanvas | Rendering face pixels |
| M04 | M03 | IPixelBuffer | Animation frame output |
| M05 | M03 | IPixelBuffer | Scene pixel buffer |
| M06 | M02 | IFaceState | Face state to transition |
| M06 | M05 | ISceneState | Scene state to transition |
| M08 | M02 | IExpression | Expression commands |
| M08 | M05 | IStory | Story control |
| M08 | M06 | ITransition | Transition control |
| M08 | M10 | IMemory | Memory queries |

---

## Dependency Violations

### NOT Allowed

```
❌ M08 imports M09 implementation details
❌ M02 directly modifies M03 pixel buffer
❌ M07 imports M05 scene renderer
❌ Circular: M04 → M02 → M04
❌ Circular: M09 → M10 → M09
```

### Always Allowed

```
✅ M08 dispatches events via IEventBus
✅ M02 renders to M03 canvas via ICanvas
✅ M04 generates animations via IAnimation
✅ M05 renders scenes via ISceneRenderer
```

---

## Implementation Priority

| Priority | Modules | Reason |
|----------|---------|--------|
| P0 | M01, M11 | Everything depends on these |
| P1 | M03, M04 | Graphics foundation |
| P2 | M02 | Core companion face |
| P3 | M05, M06, M07 | Features |
| P4 | M09, M10 | Backend |
| P5 | M08 | Integration |

---

## Last Updated

2024-01-01 - V2 Dependencies defined
