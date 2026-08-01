# PEAAI Architecture

> System architecture documentation

---

## Overview

PEAAI is an AI companion application built with a modular architecture designed for pixel-based entertainment.

### Core Principle
The AI is represented by a **living pixel canvas** with two modes:
1. **Companion Mode**: Displays the AI's pixel face with expressions
2. **Story Mode**: Transforms into cinematic pixel scenes

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | TypeScript | Type-safe UI and graphics |
| Rendering | HTML5 Canvas | Pixel-perfect 2D rendering |
| State | Event-driven | Loose coupling between modules |
| Backend | Python/Node.js | API and AI processing |
| AI | LLM Integration | Conversation and story generation |
| Storage | PostgreSQL + Redis | Persistent data and caching |

---

## Architecture Style

- **Modular**: Each module has a single responsibility
- **Independent**: Modules can be developed in parallel
- **Loosely Coupled**: Communication via events/interfaces
- **Event-Driven**: Pub/sub pattern for module communication
- **Scalable**: Architecture supports horizontal scaling

---

## Module Architecture (M01-M11)

### Foundation Layer

```
M01: Product Foundation
├── Design System
├── Theme
├── Components
├── Routing
└── Responsive Framework
```

### Graphics Layer

```
M02: Companion Engine
├── Face Geometry Engine
├── Eye Engine
├── Mouth Engine
├── Idle Behaviour
├── Emotion Controller
├── Blink Engine
└── Face State Machine

M03: Pixel Graphics Engine
├── Canvas Engine
├── Pixel Grid Manager
├── Pixel Assignment Engine
├── Pixel Buffer
├── Pixel Lighting
├── Pixel Color Engine
└── Pixel Optimizer

M04: Animation Engine
├── Timeline Engine
├── Keyframe Engine
├── Interpolation Engine
├── Animation Queue
├── Particle System
└── Animation Generator

M05: Story Visualization Engine
├── Story Parser
├── Scene Generator
├── Camera Controller
├── Character Placement
├── Environment Generator
└── Scene Renderer

M06: Transition Engine
├── Face → Story Transition
├── Story → Face Transition
├── Pixel Morphing
├── Dissolve Effects
└── Transition Timeline
```

### Application Layer

```
M07: Conversation Engine
├── Chat UI
├── Streaming
├── Typing Animation
├── Markdown
└── Notifications

M08: AI Engine
├── Main LLM
├── Memory Routing
├── Story Routing
├── Expression Routing
└── Event Dispatcher
```

### Infrastructure Layer

```
M09: Backend Infrastructure
├── API
├── Authentication
├── Database
├── WebSocket
├── Session Manager
└── Storage

M10: Memory Engine
├── User Memory
├── Story Memory
├── Relationship Memory
├── Retrieval
└── Search

M11: Performance Engine
├── FPS Monitor
├── Render Optimization
├── Lazy Loading
├── GPU Optimization
└── Memory Management
```

---

## Engineering Teams

### Management (2)
| ID | Role | Responsibilities |
|----|------|------------------|
| CA | Chief Architect | Architecture, task assignment, code review |
| DOC-001 | Documentation Engineer | Docs maintenance, guidelines |

### UI/UX Engineering (9)
| ID | Role | Module |
|----|------|--------|
| UI-001 | Design System | M01 |
| UI-002 | Landing Page | M01 |
| UI-003 | Authentication UI | M01 |
| UI-004 | Home Layout | M01/M07 |
| UI-005 | Chat UI | M07 |
| UI-006 | Settings/Profile | M07 |
| UI-007 | Responsive Design | M01 |
| UI-008 | Accessibility | M01 |
| UI-009 | UI Integration | M01/M07 |

### Graphics Engine Engineering (7)
| ID | Role | Module |
|----|------|--------|
| GE-001 | Canvas Engine | M03 |
| GE-002 | Pixel Assignment Engine | M03 |
| GE-003 | Pixel Rendering Engine | M03 |
| GE-004 | Animation Generator | M04 |
| GE-005 | Expression Engine | M02 |
| GE-006 | Transition Engine | M06 |
| GE-007 | Story Scene Renderer | M05 |

### Backend & AI Engineering (7)
| ID | Role | Module |
|----|------|--------|
| BA-001 | AI Orchestrator | M08 |
| BA-002 | Memory Engine | M10 |
| BA-003 | Backend API | M09 |
| BA-004 | Database | M09 |
| BA-005 | Realtime Synchronization | M09 |
| BA-006 | Story Generation Pipeline | M08 |
| BA-007 | Performance & Optimization | M11 |

---

## Design Principles

1. **Modular**: Each module has a single responsibility
2. **Independent**: Modules can be developed in parallel
3. **Loosely Coupled**: Communication via events/interfaces
4. **High Cohesion**: Related functionality grouped together
5. **Scalable**: Architecture supports growth
6. **Maintainable**: Clear boundaries and documentation

---

## Performance Requirements

| Metric | Target |
|--------|--------|
| Frame Rate | 60 FPS sustained |
| Pixel Resolution | 32x32 base (scalable) |
| Memory Usage | < 512MB baseline |
| API Latency | < 200ms p95 |
| Time to Interactive | < 3 seconds |

---

## Security Requirements

- Never store secrets in code
- Use HTTPS for all connections
- JWT-based authentication
- Validate and sanitize all inputs
- Apply principle of least privilege
- Rate limiting on all endpoints

---

## Status

✅ Architecture frozen as of 2024-01-01

---

## Changes

No changes allowed without Chief Architect approval.
