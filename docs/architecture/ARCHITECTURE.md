# PEAAI Architecture

> Frozen architecture documentation

---

## Overview

PEAAI is an AI companion application built with a modular architecture designed for pixel-based entertainment.

### Core Principle
The AI is represented by a **living pixel canvas** with two modes:
1. **Companion Mode**: Displays the AI's pixel face with expressions
2. **Story Mode**: Transforms into cinematic pixel scenes

---

## System Architecture

### Technology Stack
- **Frontend**: TypeScript/JavaScript with HTML5 Canvas
- **Backend**: Python/Node.js (to be determined)
- **AI**: LLM integration (provider to be selected)

### Architecture Style
- Modular architecture with clear boundaries
- Event-driven communication between modules
- No cross-module direct imports

---

## Module Architecture

### M01: Pixel Canvas
```
Purpose: Render everything shown on the screen
Dependencies: None
Provides: Canvas rendering infrastructure
```

### M02: Companion Face Engine
```
Purpose: Generate the AI face
Dependencies: M01 (Pixel Canvas)
Provides: Face geometry and rendering
```

### M03: Expression Engine
```
Purpose: Control facial expressions
Dependencies: M01, M02
Provides: Expression state machine
```

### M04: Story Engine
```
Purpose: Generate scene-by-scene storytelling
Dependencies: M08 (AI Orchestrator)
Provides: Story planning and scene decomposition
```

### M05: Story Renderer
```
Purpose: Render cinematic pixel scenes
Dependencies: M01 (Pixel Canvas)
Provides: Scene visual rendering
```

### M06: Transition Engine
```
Purpose: Transition between Companion Mode and Story Mode
Dependencies: M01, M02, M05
Provides: Pixel dissolve and transitions
```

### M07: Chat System
```
Purpose: User interaction
Dependencies: None
Provides: Chat UI and message handling
```

### M08: AI Orchestrator
```
Purpose: Coordinate every AI subsystem
Dependencies: All modules
Provides: Event routing and coordination
```

### M09: Memory Engine
```
Purpose: Long-term memory
Dependencies: None
Provides: Storage and retrieval API
```

### M10: Backend
```
Purpose: Server infrastructure
Dependencies: None
Provides: REST/WebSocket API
```

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

## Design Principles

1. **Modular**: Each module has a single responsibility
2. **Independent**: Modules can be developed in parallel
3. **Loosely Coupled**: Communication via events/interfaces
4. **High Cohesion**: Related functionality grouped together
5. **Scalable**: Architecture supports growth
6. **Maintainable**: Clear boundaries and documentation

---

## Performance Considerations

- Pixel-perfect rendering at 32x32 base resolution
- 60 FPS target for animations
- Efficient pixel buffer management
- Double buffering for smooth rendering

---

## Security Considerations

- Never store secrets in code
- Use secure communication protocols
- Validate all inputs
- Apply principle of least privilege

---

## Status

✅ Architecture frozen as of 2024-01-01

---

## Changes

No changes allowed without Chief Architect approval.
