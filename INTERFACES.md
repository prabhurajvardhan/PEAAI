# PEAAI Module Interfaces

> Public API definitions for all modules

---

## Core Principles

1. All interfaces are frozen once implementation begins
2. Changes require Chief Architect approval
3. Interfaces must be self-documenting
4. TypeScript types define the contract

---

## ICanvas Interface

```typescript
interface ICanvas {
  // Initialization
  initialize(container: HTMLElement): void;
  destroy(): void;
  
  // Rendering
  render(): void;
  clear(): void;
  
  // Pixel Buffer Access
  getPixelBuffer(): IPixelBuffer;
  
  // Configuration
  setSize(width: number, height: number): void;
  getSize(): { width: number; height: number };
  setPixelScale(scale: number): void;
  
  // State
  isInitialized(): boolean;
  pause(): void;
  resume(): void;
}
```

---

## IPixelBuffer Interface

```typescript
interface IPixelBuffer {
  // Pixel Access
  setPixel(x: number, y: number, color: IColor): void;
  getPixel(x: number, y: number): IColor;
  setPixelBatch(pixels: IPixelBatch): void;
  
  // Operations
  fill(color: IColor): void;
  copy(): IPixelBuffer;
  
  // Blending
  blend(other: IPixelBuffer, x: number, y: number, mode: BlendMode): void;
}

interface IColor {
  r: number; // 0-255
  g: number; // 0-255
  b: number; // 0-255
  a: number; // 0-255
}

interface IPixelBatch {
  pixels: Array<{ x: number; y: number; color: IColor }>;
}

type BlendMode = 'replace' | 'alpha' | 'add' | 'multiply';
```

---

## IRenderLoop Interface

```typescript
interface IRenderLoop {
  start(): void;
  stop(): void;
  pause(): void;
  resume(): void;
  
  onFrame(callback: (deltaTime: number) => void): () => void;
  
  getFPS(): number;
  isRunning(): boolean;
}
```

---

## IFaceGeometry Interface

```typescript
interface IFaceGeometry {
  readonly GRID_SIZE: number;
  readonly EYE_LEFT: IPosition;
  readonly EYE_RIGHT: IPosition;
  readonly MOUTH: IPosition;
  readonly PUPIL_SIZE: number;
}

interface IPosition {
  x: number;
  y: number;
}

interface IFaceState {
  eyeOpenness: number; // 0-1
  pupilDirection: IPosition; // -1 to 1 normalized
  mouthOpenness: number; // 0-1
  mouthCurve: number; // -1 to 1 (frown to smile)
}
```

---

## IFaceRenderer Interface

```typescript
interface IFaceRenderer {
  render(state: IFaceState, buffer: IPixelBuffer): void;
  
  renderEyes(state: IFaceState, buffer: IPixelBuffer): void;
  renderMouth(state: IFaceState, buffer: IPixelBuffer): void;
  
  setEmotionColor(emotion: EmotionType): void;
}

type EmotionType = 
  | 'neutral' 
  | 'happy' 
  | 'sad' 
  | 'angry' 
  | 'surprised' 
  | 'thinking'
  | 'excited'
  | 'sleepy';
```

---

## IExpressionEngine Interface

```typescript
interface IExpressionEngine {
  // State Management
  setExpression(expression: ExpressionType): Promise<void>;
  getCurrentExpression(): ExpressionType;
  queueExpression(expression: ExpressionType, duration?: number): void;
  clearQueue(): void;
  
  // Listening
  onExpressionChange(callback: (expr: ExpressionType) => void): () => void;
  onTransitionComplete(callback: () => void): () => void;
  
  // Face Integration
  connectFace(renderer: IFaceRenderer): void;
}

type ExpressionType = 
  | 'neutral'
  | 'happy'
  | 'sad'
  | 'angry'
  | 'surprised'
  | 'thinking'
  | 'curious'
  | 'sleepy'
  | 'excited';
```

---

## IEventBus Interface

```typescript
interface IEventBus {
  emit<T>(event: string, data?: T): void;
  on<T>(event: string, handler: (data: T) => void): () => void;
  once<T>(event: string, handler: (data: T) => void): () => void;
  off(event: string): void;
  offAll(): void;
}

// Event Types
interface AIEvents {
  'ai.thinking': { startTime: number };
  'ai.response.start': { messageId: string };
  'ai.response.token': { messageId: string; token: string };
  'ai.response.complete': { messageId: string };
  'ai.expression.request': { expression: ExpressionType };
  'ai.story.start': { topic: string };
  'ai.story.scene': { sceneIndex: number; description: string };
  'ai.story.end': { duration: number };
}

interface UserEvents {
  'user.message': { text: string };
  'user.typing.start': void;
  'user.typing.end': void;
}
```

---

## IStorage Interface

```typescript
interface IStorage {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  keys(): Promise<string[]>;
}
```

---

## Interface Versioning

| Interface | Version | Last Updated | Status |
|-----------|---------|--------------|--------|
| ICanvas | 1.0 | 2024-01-01 | Stable |
| IPixelBuffer | 1.0 | 2024-01-01 | Stable |
| IRenderLoop | 1.0 | 2024-01-01 | Stable |
| IFaceGeometry | 1.0 | 2024-01-01 | Stable |
| IFaceRenderer | 1.0 | 2024-01-01 | Stable |
| IExpressionEngine | 1.0 | 2024-01-01 | Stable |
| IEventBus | 1.0 | 2024-01-01 | Stable |
| IStorage | 1.0 | 2024-01-01 | Stable |

---

## Breaking Changes Policy

A breaking change requires:
1. New version number
2. Deprecation notice in DECISIONS.md
3. Migration guide
4. Coexistence period for old interface

---

## Unreleased Interfaces

These interfaces are defined but not yet frozen:

| Interface | Module | Status |
|-----------|--------|--------|
| IStoryEngine | M04 | Draft |
| IStoryRenderer | M05 | Draft |
| ITransitionEngine | M06 | Draft |
| IChatSystem | M07 | Draft |
| IAIOrchestrator | M08 | Draft |
| IMemoryEngine | M09 | Draft |
| IBackendAPI | M10 | Draft |
