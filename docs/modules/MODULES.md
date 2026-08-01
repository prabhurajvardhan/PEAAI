# PEAAI Modules

> Module definitions and boundaries

---

## Module Registry

### M01: Pixel Canvas

| Property | Value |
|----------|-------|
| Module ID | M01 |
| Purpose | Render everything shown on the screen |
| Language | TypeScript/JavaScript |
| Framework | HTML5 Canvas API |
| Dependencies | None |
| Boundary | Pure rendering engine, no business logic |
| Output | Canvas DOM element with rendering context |

**Responsibilities:**
- Canvas initialization and configuration
- Pixel buffer management
- Rendering loop with frame timing
- Resize handling with aspect ratio preservation
- Performance optimization (double buffering, batching)

**Owned Files:**
- `src/renderer/canvas.ts`
- `src/renderer/pixel-buffer.ts`
- `src/renderer/render-loop.ts`
- `src/renderer/resize-engine.ts`
- `src/renderer/performance.ts`

**Current Status:** 🔴 Not Started

---

### M02: Companion Face Engine

| Property | Value |
|----------|-------|
| Module ID | M02 |
| Purpose | Generate the AI face |
| Language | TypeScript/JavaScript |
| Dependencies | M01 (Pixel Canvas) |
| Boundary | Face geometry and expressions only |
| Output | Face sprite data and animation states |

**Responsibilities:**
- Face geometry definition
- Eye rendering with animation
- Mouth rendering with expressions
- Blink animation system
- Idle behaviour when not active
- Emotion integration

**Owned Files:**
- `src/face/geometry.ts`
- `src/face/eye-renderer.ts`
- `src/face/mouth-renderer.ts`
- `src/face/blink-animation.ts`
- `src/face/idle-behaviour.ts`
- `src/face/emotion-integration.ts`

**Current Status:** 🔴 Not Started

---

### M03: Expression Engine

| Property | Value |
|----------|-------|
| Module ID | M03 |
| Purpose | Control facial expressions |
| Language | TypeScript/JavaScript |
| Dependencies | M01, M02 |
| Boundary | Expression state machine and transitions |
| Output | Expression state commands |

**Responsibilities:**
- Expression state machine
- Smooth expression transitions
- Animation timing system
- Expression API

**Owned Files:**
- `src/expression/state-machine.ts`
- `src/expression/transitions.ts`
- `src/expression/animation-timing.ts`
- `src/expression/api.ts`

**Current Status:** 🔴 Not Started

---

### M04: Story Engine

| Property | Value |
|----------|-------|
| Module ID | M04 |
| Purpose | Generate scene-by-scene storytelling |
| Language | TypeScript/JavaScript |
| Dependencies | M08 (AI Orchestrator) |
| Boundary | Story planning and scene decomposition |
| Output | Scene queue of story segments |

**Responsibilities:**
- Story planning
- Story streaming
- Scene splitting
- Scene queue management
- Story controller

**Owned Files:**
- `src/story/planner.ts`
- `src/story/streaming.ts`
- `src/story/scene-splitter.ts`
- `src/story/scene-queue.ts`
- `src/story/controller.ts`

**Current Status:** 🔴 Not Started

---

### M05: Story Renderer

| Property | Value |
|----------|-------|
| Module ID | M05 |
| Purpose | Render cinematic pixel scenes |
| Language | TypeScript/JavaScript |
| Dependencies | M01 (Pixel Canvas) |
| Boundary | Visual scene rendering only |
| Output | Scene sprite data |

**Responsibilities:**
- Background rendering
- Character rendering
- Weather effects
- Camera movement
- Scene animation

**Owned Files:**
- `src/story-renderer/background.ts`
- `src/story-renderer/character.ts`
- `src/story-renderer/weather.ts`
- `src/story-renderer/camera.ts`
- `src/story-renderer/scene-animation.ts`

**Current Status:** 🔴 Not Started

---

### M06: Transition Engine

| Property | Value |
|----------|-------|
| Module ID | M06 |
| Purpose | Transition between Companion Mode and Story Mode |
| Language | TypeScript/JavaScript |
| Dependencies | M01, M02, M05 |
| Boundary | Pixel dissolve and particle effects |
| Output | Transition animation state |

**Responsibilities:**
- Face to Story transition
- Story to Face transition
- Pixel dissolve effect
- Particle system
- Animation timing

**Owned Files:**
- `src/transition/face-to-story.ts`
- `src/transition/story-to-face.ts`
- `src/transition/pixel-dissolve.ts`
- `src/transition/particle-system.ts`

**Current Status:** 🔴 Not Started

---

### M07: Chat System

| Property | Value |
|----------|-------|
| Module ID | M07 |
| Purpose | User interaction |
| Language | TypeScript/JavaScript |
| Dependencies | None |
| Boundary | UI only, no business logic |
| Output | Chat message DOM |

**Responsibilities:**
- Chat UI
- Streaming messages
- Typing animation
- Notifications
- Markdown support

**Owned Files:**
- `src/chat/ui.ts`
- `src/chat/streaming.ts`
- `src/chat/typing-animation.ts`
- `src/chat/notifications.ts`
- `src/chat/markdown.ts`

**Current Status:** 🔴 Not Started

---

### M08: AI Orchestrator

| Property | Value |
|----------|-------|
| Module ID | M08 |
| Purpose | Coordinate every AI subsystem |
| Language | TypeScript/JavaScript |
| Dependencies | All modules |
| Boundary | Event routing and coordination only |
| Output | Event bus and routing logic |

**Responsibilities:**
- LLM integration
- Story routing
- Expression routing
- Memory routing
- Event bus

**Owned Files:**
- `src/orchestrator/llm.ts`
- `src/orchestrator/story-routing.ts`
- `src/orchestrator/expression-routing.ts`
- `src/orchestrator/memory-routing.ts`
- `src/orchestrator/event-bus.ts`

**Current Status:** 🔴 Not Started

---

### M09: Memory Engine

| Property | Value |
|----------|-------|
| Module ID | M09 |
| Purpose | Long-term memory |
| Language | TypeScript/JavaScript |
| Dependencies | None (browser storage) |
| Boundary | Storage and retrieval only |
| Output | Memory API |

**Responsibilities:**
- Conversation storage
- User profile
- Semantic search
- Story memory
- Memory API

**Owned Files:**
- `src/memory/conversation.ts`
- `src/memory/user-profile.ts`
- `src/memory/semantic-search.ts`
- `src/memory/story-memory.ts`
- `src/memory/api.ts`

**Current Status:** 🔴 Not Started

---

### M10: Backend

| Property | Value |
|----------|-------|
| Module ID | M10 |
| Purpose | Server infrastructure |
| Language | Python/TypeScript |
| Dependencies | None |
| Boundary | API, auth, database |
| Output | REST/WebSocket API |

**Responsibilities:**
- Authentication
- REST API
- WebSocket
- Database
- Deployment

**Owned Files:**
- `backend/auth/`
- `backend/api/`
- `backend/websocket/`
- `backend/database/`

**Current Status:** 🔴 Not Started

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

## Sprint Assignment

| Sprint | Modules |
|--------|---------|
| Sprint 1 | M01, M02, M03 |
| Sprint 2 | M04, M05, M06 |
| Sprint 3 | M07, M08, M09 |
| Sprint 4 | M10 |

---

## Last Updated

2024-01-01 - Modules defined
