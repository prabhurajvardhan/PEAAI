# PEAAI (Pixel Entertainment AI)

> An AI Companion for Entertainment

PEAAI is **not** another chatbot.

The goal is to build an AI companion that people become emotionally attached to. The conversation itself is the entertainment.

---

## Project Vision

The AI is represented by a **living pixel canvas**.

The canvas has two modes.

### Companion Mode

Default mode.

The canvas only displays the AI's pixel face.

Capabilities:
- Blink
- Smile
- Think
- Look around
- Idle animation
- Emotional reactions
- Typing animation

The face should always feel alive.

### Story Mode

When storytelling begins, the face transforms into a cinematic pixel movie.

Flow:
```
AI Face
    ↓
Pixel Dissolve
    ↓
Story Scene 1
    ↓
Story Scene 2
    ↓
...
Story End
    ↓
Pixels merge
    ↓
AI Face
```

Every paragraph of the story becomes one visual scene.

---

## Product Goal

Create an AI that users enjoy talking to for hours because of:
- personality
- visual expressions
- storytelling
- humor
- emotional connection

---

## Development Methodology

This project follows the **AEF Swarm Development Process**.

Development is frozen stage by stage:

```
Requirements → Architecture → System Design → Modules → Tasks → Implementation
```

No implementation begins until the previous stage is frozen.

---

## Project Organization

### Engineering Teams (25 Employees)

| Team | Employees | Count |
|------|-----------|-------|
| Management | Chief Architect, Documentation Engineer | 2 |
| UI/UX Engineering | Design System, Landing Page, Auth UI, Home Layout, Chat UI, Settings, Responsive, Accessibility, Integration | 9 |
| Graphics Engine | Canvas, Pixel Assignment, Pixel Rendering, Animation Generator, Expression, Transition, Story Scene Renderer | 7 |
| Backend & AI | AI Orchestrator, Memory, Backend API, Database, Realtime, Story Pipeline, Performance | 7 |

---

## Communication Rules

### Core Principle
AI employees NEVER communicate directly.

### Communication Channel
The repository is the communication channel.

### Documents
Every OpenHands employee begins by reading:
- `README.md` (this file)
- `docs/architecture/ARCHITECTURE.md`
- `docs/modules/MODULES.md`
- `docs/tasks/TASKS.md`
- `docs/interfaces/INTERFACES.md`
- `docs/decisions/DECISIONS.md`
- `docs/status/STATUS.md`
- Own employee file in `docs/employees/`

### Updates
The Chief Architect communicates ONLY by updating repository documents.

---

## Repository Structure

```
PEAAI/
├── README.md                          # Project overview (this file)
├── TASKS.md                           # Task registry summary
├── docs/
│   ├── architecture/
│   │   ├── ARCHITECTURE.md            # System architecture
│   │   └── DEPENDENCIES.md            # Module dependency graph
│   ├── modules/
│   │   └── MODULES.md                 # Module definitions (M01-M11)
│   ├── tasks/
│   │   └── TASKS.md                   # Task registry
│   ├── interfaces/
│   │   └── INTERFACES.md              # Interface contracts
│   ├── decisions/
│   │   └── DECISIONS.md               # Architecture decisions
│   ├── status/
│   │   └── STATUS.md                  # Project status
│   └── employees/
│       ├── CA.md                      # Chief Architect
│       ├── DOC-001.md                # Documentation Engineer
│       ├── UI-001.md to UI-009.md    # UI/UX Team
│       ├── GE-001.md to GE-007.md    # Graphics Engine Team
│       └── BA-001.md to BA-007.md    # Backend & AI Team
└── src/                              # Source code (future)
```

---

## Swarm Architecture Rules

### One Employee = One Task
NOT: One Employee = One Module

Each employee receives exactly ONE task.

### Review Process
When an employee finishes:
1. Read the code
2. Compare against architecture
3. Check folder boundaries
4. Verify interface contracts
5. Review coding standards
6. Approve or reject

---

## Current Development Stage

| Stage | Status |
|-------|--------|
| Requirements | ✅ Frozen |
| Architecture | ✅ Frozen |
| System Design | ✅ Frozen |
| Modules | ✅ Frozen |
| Tasks | ✅ Frozen |
| Implementation | 🔴 Not Started |

---

## Module Overview

| ID | Module | Team | Status |
|----|--------|------|--------|
| M01 | Product Foundation | UI/UX | 🔴 Not Started |
| M02 | Companion Engine | Graphics | 🔴 Not Started |
| M03 | Pixel Graphics Engine | Graphics | 🔴 Not Started |
| M04 | Animation Engine | Graphics | 🔴 Not Started |
| M05 | Story Visualization Engine | Graphics | 🔴 Not Started |
| M06 | Transition Engine | Graphics | 🔴 Not Started |
| M07 | Conversation Engine | UI/UX | 🔴 Not Started |
| M08 | AI Engine | Backend | 🔴 Not Started |
| M09 | Backend Infrastructure | Backend | 🔴 Not Started |
| M10 | Memory Engine | Backend | 🔴 Not Started |
| M11 | Performance Engine | Backend | 🔴 Not Started |

---

## Getting Started

1. Read all documentation in this repository
2. Check your employee file in `docs/employees/`
3. Read your assigned task from `docs/tasks/TASKS.md`
4. Implement only your assigned task
5. Never modify another module
6. Never change architecture
7. Report completion in STATUS.md

---

## Documentation Index

| Document | Purpose |
|----------|---------|
| docs/architecture/ARCHITECTURE.md | System architecture |
| docs/architecture/DEPENDENCIES.md | Module dependency graph |
| docs/modules/MODULES.md | Module definitions |
| docs/tasks/TASKS.md | Task registry |
| docs/interfaces/INTERFACES.md | Interface contracts |
| docs/decisions/DECISIONS.md | Architecture decisions |
| docs/status/STATUS.md | Project status |
| docs/employees/* | Employee assignments |

---

## Last Updated

2024-01-01 - V2 Architecture initialized
