# PEAAI (Pixel Entertainment AI)

> An AI Companion for Entertainment

PEAAI is **not** another chatbot.

The goal is to build an AI companion that people become emotionally attached to. The conversation itself is the entertainment.

---

# Vision

The AI is represented by a **living pixel canvas**.

The canvas has two modes.

## Companion Mode

Default mode.

The canvas only displays the AI's pixel face.

Capabilities

- Blink
- Smile
- Think
- Look around
- Idle animation
- Emotional reactions
- Typing animation

The face should always feel alive.

---

## Story Mode

When storytelling begins,

the face transforms into a cinematic pixel movie.

Flow

AI Face

↓

Pixel Dissolve

↓

Story Scene 1

↓

Story Scene 2

↓

Story Scene 3

↓

Story End

↓

Pixels merge

↓

AI Face

Every paragraph of the story becomes one visual scene.

---

# Product Goal

Create an AI that users enjoy talking to for hours because of

- personality
- visual expressions
- storytelling
- humor
- emotional connection

---

# Development Methodology

This project follows the **AEF Swarm Development Process**.

Development is frozen stage by stage.

```
Requirements
        ↓
Architecture
        ↓
System Design
        ↓
Modules
        ↓
Tasks
        ↓
Implementation
```

No implementation begins until the previous stage is frozen.

---

# Swarm Architecture

This repository is developed using multiple OpenHands sessions.

## Rule

One AI Employee = One Task

NOT

One AI Employee = One Module

Each employee receives exactly one task.

---

# Communication Model

AI employees DO NOT communicate directly.

Instead they communicate through this repository.

The Chief Architect updates

- README.md
- TASKS.md
- MODULES.md
- DECISIONS.md

Every OpenHands session begins by reading these files.

---

# Chief Architect Responsibilities

The Chief Architect never builds features.

Responsibilities

- Freeze architecture
- Assign tasks
- Detect architecture drift
- Review completed work
- Update task board
- Maintain project documentation
- Ensure module boundaries are respected

---

# Project Modules

## M01 Pixel Canvas

Purpose

Render everything shown on the screen.

Tasks

- Canvas initialization
- Pixel buffer
- Rendering loop
- Resize engine
- Performance optimization
- Unit testing

Status

🔴 Not Started

---

## M02 Companion Face Engine

Purpose

Generate the AI face.

Tasks

- Face geometry
- Eye renderer
- Mouth renderer
- Blink animation
- Idle behaviour
- Emotion integration
- Testing

Status

🔴 Not Started

---

## M03 Expression Engine

Purpose

Control facial expressions.

Tasks

- State machine
- Expression transitions
- Animation timing
- Expression API
- Testing

Status

🔴 Not Started

---

## M04 Story Engine

Purpose

Generate scene-by-scene storytelling.

Tasks

- Story planner
- Story streaming
- Scene splitter
- Scene queue
- Story controller
- Testing

Status

🔴 Not Started

---

## M05 Story Renderer

Purpose

Render cinematic pixel scenes.

Tasks

- Background renderer
- Character renderer
- Weather effects
- Camera movement
- Scene animation
- Performance optimization

Status

🔴 Not Started

---

## M06 Transition Engine

Purpose

Transition between Companion Mode and Story Mode.

Tasks

- Face → Story
- Story → Face
- Pixel dissolve
- Particle system
- Animation timing

Status

🔴 Not Started

---

## M07 Chat System

Purpose

User interaction.

Tasks

- Chat UI
- Streaming messages
- Typing animation
- Notifications
- Markdown support

Status

🔴 Not Started

---

## M08 AI Orchestrator

Purpose

Coordinate every AI subsystem.

Tasks

- LLM integration
- Story routing
- Expression routing
- Memory routing
- Event bus

Status

🔴 Not Started

---

## M09 Memory Engine

Purpose

Long-term memory.

Tasks

- Conversation storage
- User profile
- Semantic search
- Story memory
- Memory API

Status

🔴 Not Started

---

## M10 Backend

Purpose

Server infrastructure.

Tasks

- Authentication
- REST API
- WebSocket
- Database
- Deployment

Status

🔴 Not Started

---

# Current Sprint

Sprint 1

Objective

Build the complete Pixel Canvas infrastructure.

Priority

M01 → M02 → M03

---

# Development Rules

Every OpenHands employee must

- Read README.md before coding.
- Work only on the assigned task.
- Never modify another module.
- Never change architecture.
- Never rename interfaces without approval.
- Submit only the assigned work.
- Report completion back by updating the task status.

---

# Current Status

Requirements

✅ Frozen

Architecture

✅ Frozen

System Design

✅ Frozen

Modules

✅ Frozen

Tasks

✅ Frozen

Implementation

🔴 Not Started

---

# Documentation

| Document | Purpose |
|----------|---------|
| README.md | Project overview and current status |
| MODULES.md | Module definitions and boundaries |
| TASKS.md | Task registry and assignments |
| INTERFACES.md | Public API definitions |
| DECISIONS.md | Architecture decision log |
| STATUS.md | Real-time project status tracking |

---

# Next Steps

**Sprint 1 is ready to begin.**

First task to assign: **T-001: Canvas Initialization**

See TASKS.md for full task registry.
