# PEAAI Modules

> Module definitions and boundaries (M01-M11)

---

## Module Registry

### M01: Product Foundation

| Property | Value |
|----------|-------|
| Module ID | M01 |
| Purpose | Foundation layer for all UI and product features |
| Team | UI/UX Engineering |
| Dependencies | None |
| Boundary | Design system, theme, components, routing |
| Status | 🔴 Not Started |

**Responsibilities:**
- Design System: Colors, typography, spacing, shadows
- Theme: Light/dark mode, CSS variables
- Components: Reusable UI components
- Routing: SPA navigation
- Responsive Framework: Grid system, breakpoints

**Owned Files:**
- `src/foundation/theme/`
- `src/foundation/components/`
- `src/foundation/routing/`
- `src/foundation/styles/`

---

### M02: Companion Engine

| Property | Value |
|----------|-------|
| Module ID | M02 |
| Purpose | Generate and animate the AI companion face |
| Team | Graphics Engine Engineering |
| Dependencies | M01, M03 |
| Boundary | Face geometry, expressions, emotions |
| Status | 🔴 Not Started |

**Responsibilities:**
- Face Geometry Engine: 32x32 pixel face grid definition
- Eye Engine: Eye rendering, pupil movement, eye states
- Mouth Engine: Mouth rendering, shape variations
- Idle Behaviour: Breathing, subtle movements when idle
- Emotion Controller: Emotion-to-expression mapping
- Blink Engine: Random blink timing, eyelid animation
- Face State Machine: Face state transitions

**Owned Files:**
- `src/companion/geometry/`
- `src/companion/eye/`
- `src/companion/mouth/`
- `src/companion/idle/`
- `src/companion/emotion/`
- `src/companion/blink/`
- `src/companion/state-machine/`

---

### M03: Pixel Graphics Engine

| Property | Value |
|----------|-------|
| Module ID | M03 |
| Purpose | Core pixel rendering infrastructure |
| Team | Graphics Engine Engineering |
| Dependencies | M01 |
| Boundary | Canvas, pixels, buffers |
| Status | 🔴 Not Started |

**Responsibilities:**
- Canvas Engine: HTML5 canvas setup, context management
- Pixel Grid Manager: Grid size, coordinate system
- Pixel Assignment Engine: Assign pixels to sprites/faces
- Pixel Buffer: ImageData manipulation, batch operations
- Pixel Lighting: Light/dark adjustments per pixel
- Pixel Color Engine: Color palette, color operations
- Pixel Optimizer: Memory efficient operations

**Owned Files:**
- `src/graphics/canvas/`
- `src/graphics/grid/`
- `src/graphics/pixel-assignment/`
- `src/graphics/buffer/`
- `src/graphics/lighting/`
- `src/graphics/color/`
- `src/graphics/optimizer/`

---

### M04: Animation Engine

| Property | Value |
|----------|-------|
| Module ID | M04 |
| Purpose | Generate and play animations |
| Team | Graphics Engine Engineering |
| Dependencies | M01, M03 |
| Boundary | Timelines, keyframes, interpolation |
| Status | 🔴 Not Started |

**Responsibilities:**
- Timeline Engine: Animation timeline management
- Keyframe Engine: Keyframe definition, storage
- Interpolation Engine: Easing functions, value interpolation
- Animation Queue: Queue and prioritize animations
- Particle System: Particle effects, physics
- Animation Generator: Procedural animation creation

**Owned Files:**
- `src/animation/timeline/`
- `src/animation/keyframe/`
- `src/animation/interpolation/`
- `src/animation/queue/`
- `src/animation/particle/`
- `src/animation/generator/`

---

### M05: Story Visualization Engine

| Property | Value |
|----------|-------|
| Module ID | M05 |
| Purpose | Render story scenes and environments |
| Team | Graphics Engine Engineering |
| Dependencies | M01, M03, M04 |
| Boundary | Story parsing, scene generation, rendering |
| Status | 🔴 Not Started |

**Responsibilities:**
- Story Parser: Parse story text into scene descriptions
- Scene Generator: Generate scene content from descriptions
- Camera Controller: Camera movements, zoom, pan
- Character Placement: Position characters in scene
- Environment Generator: Background, weather, lighting
- Scene Renderer: Combine all elements into pixel scene

**Owned Files:**
- `src/story-viz/parser/`
- `src/story-viz/scene-generator/`
- `src/story-viz/camera/`
- `src/story-viz/character-placement/`
- `src/story-viz/environment/`
- `src/story-viz/renderer/`

---

### M06: Transition Engine

| Property | Value |
|----------|-------|
| Module ID | M06 |
| Purpose | Animate transitions between modes |
| Team | Graphics Engine Engineering |
| Dependencies | M01, M02, M03, M04, M05 |
| Boundary | Face↔Story transitions |
| Status | 🔴 Not Started |

**Responsibilities:**
- Face → Story Transition: Dissolve face into story
- Story → Face Transition: Merge story into face
- Pixel Morphing: Smooth pixel transformations
- Dissolve Effects: Particle dissolve, grid dissolve
- Transition Timeline: Coordinate transition timing

**Owned Files:**
- `src/transition/face-to-story/`
- `src/transition/story-to-face/`
- `src/transition/morphing/`
- `src/transition/dissolve/`
- `src/transition/timeline/`

---

### M07: Conversation Engine

| Property | Value |
|----------|-------|
| Module ID | M07 |
| Purpose | User conversation interface |
| Team | UI/UX Engineering |
| Dependencies | M01, M04 |
| Boundary | Chat UI, streaming, notifications |
| Status | 🔴 Not Started |

**Responsibilities:**
- Chat UI: Message display, input field
- Streaming: Stream AI responses token by token
- Typing Animation: Show AI typing indicator
- Markdown: Render markdown in messages
- Notifications: Toast notifications, alerts

**Owned Files:**
- `src/conversation/chat/`
- `src/conversation/streaming/`
- `src/conversation/typing/`
- `src/conversation/markdown/`
- `src/conversation/notifications/`

---

### M08: AI Engine

| Property | Value |
|----------|-------|
| Module ID | M08 |
| Purpose | Coordinate AI subsystems |
| Team | Backend & AI Engineering |
| Dependencies | M02, M05, M06, M07, M09, M10, M11 |
| Boundary | LLM, routing, event dispatching |
| Status | 🔴 Not Started |

**Responsibilities:**
- Main LLM: Language model integration
- Memory Routing: Route queries to memory
- Story Routing: Route to story generation
- Expression Routing: Route to expression engine
- Event Dispatcher: Event bus management

**Owned Files:**
- `src/ai/llm/`
- `src/ai/routing/memory/`
- `src/ai/routing/story/`
- `src/ai/routing/expression/`
- `src/ai/event_dispatcher/`

---

### M09: Backend Infrastructure

| Property | Value |
|----------|-------|
| Module ID | M09 |
| Purpose | Server-side infrastructure |
| Team | Backend & AI Engineering |
| Dependencies | M11 |
| Boundary | API, auth, database, websocket |
| Status | 🔴 Not Started |

**Responsibilities:**
- API: REST endpoints
- Authentication: JWT, OAuth
- Database: PostgreSQL schema, migrations
- WebSocket: Real-time connections
- Session Manager: Session handling
- Storage: File uploads, CDN

**Owned Files:**
- `backend/api/`
- `backend/auth/`
- `backend/database/`
- `backend/websocket/`
- `backend/session/`
- `backend/storage/`

---

### M10: Memory Engine

| Property | Value |
|----------|-------|
| Module ID | M10 |
| Purpose | Long-term memory management |
| Team | Backend & AI Engineering |
| Dependencies | M09 |
| Boundary | User/story/relationship memory |
| Status | 🔴 Not Started |

**Responsibilities:**
- User Memory: User preferences, history
- Story Memory: Past stories, summaries
- Relationship Memory: User-companion relationship
- Retrieval: Context retrieval
- Search: Semantic search

**Owned Files:**
- `src/memory/user/`
- `src/memory/story/`
- `src/memory/relationship/`
- `src/memory/retrieval/`
- `src/memory/search/`

---

### M11: Performance Engine

| Property | Value |
|----------|-------|
| Module ID | M11 |
| Purpose | Performance monitoring and optimization |
| Team | Backend & AI Engineering |
| Dependencies | None |
| Boundary | FPS, memory, rendering optimization |
| Status | 🔴 Not Started |

**Responsibilities:**
- FPS Monitor: Frame rate tracking
- Render Optimization: Optimize rendering pipeline
- Lazy Loading: Defer non-critical loading
- GPU Optimization: WebGL acceleration hints
- Memory Management: Memory leak detection, cleanup

**Owned Files:**
- `src/performance/fps/`
- `src/performance/render/`
- `src/performance/lazy/`
- `src/performance/gpu/`
- `src/performance/memory/`

---

## Module Boundaries

Each module MUST:
- Have a single, well-defined purpose
- Expose a clean public API via interfaces
- Have no knowledge of other module internals
- Be independently testable
- Have no circular dependencies

Each module MUST NOT:
- Access another module's private state
- Directly modify another module's data
- Import implementation details from other modules
- Create cross-module coupling except via interfaces

---

## Team Assignment

| Team | Modules |
|------|---------|
| UI/UX Engineering | M01, M07 |
| Graphics Engine | M02, M03, M04, M05, M06 |
| Backend & AI | M08, M09, M10, M11 |

---

## Last Updated

2024-01-01 - V2 Modules defined
