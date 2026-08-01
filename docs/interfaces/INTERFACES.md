# PEAAI Interface Contracts

> Public API definitions for all modules

---

## Interface Principles

1. All interfaces are frozen once implementation begins
2. Changes require Chief Architect approval
3. Interfaces must be self-documenting
4. TypeScript types define the contract

---

## Core Interfaces

### ICanvas

```typescript
interface ICanvas {
  initialize(container: HTMLElement): void;
  destroy(): void;
  render(): void;
  clear(): void;
  getPixelBuffer(): IPixelBuffer;
  setSize(width: number, height: number): void;
  getSize(): { width: number; height: number };
  setPixelScale(scale: number): void;
  isInitialized(): boolean;
  pause(): void;
  resume(): void;
}
```

### IPixelBuffer

```typescript
interface IPixelBuffer {
  setPixel(x: number, y: number, color: IColor): void;
  getPixel(x: number, y: number): IColor;
  setPixelBatch(pixels: IPixelBatch): void;
  fill(color: IColor): void;
  copy(): IPixelBuffer;
  blend(other: IPixelBuffer, x: number, y: number, mode: BlendMode): void;
}

interface IColor {
  r: number; g: number; b: number; a: number;
}

type BlendMode = 'replace' | 'alpha' | 'add' | 'multiply';
```

### IFaceGeometry

```typescript
interface IFaceGeometry {
  readonly GRID_SIZE: number;
  readonly EYE_LEFT: IPosition;
  readonly EYE_RIGHT: IPosition;
  readonly MOUTH: IPosition;
}

interface IFaceState {
  eyeOpenness: number;      // 0-1
  pupilDirection: IPosition; // -1 to 1 normalized
  mouthOpenness: number;    // 0-1
  mouthCurve: number;       // -1 to 1 (frown to smile)
}

type EmotionType = 'neutral' | 'happy' | 'sad' | 'angry' | 'surprised' | 'thinking' | 'excited' | 'sleepy';
```

### IExpressionEngine

```typescript
interface IExpressionEngine {
  setExpression(expression: ExpressionType): Promise<void>;
  getCurrentExpression(): ExpressionType;
  queueExpression(expression: ExpressionType, duration?: number): void;
  clearQueue(): void;
  onExpressionChange(callback: (expr: ExpressionType) => void): () => void;
  onTransitionComplete(callback: () => void): () => void;
  connectFace(renderer: IFaceRenderer): void;
}

type ExpressionType = 'neutral' | 'happy' | 'sad' | 'angry' | 'surprised' | 'thinking' | 'curious' | 'sleepy' | 'excited';
```

### IAnimationTimeline

```typescript
interface IAnimationTimeline {
  play(): void;
  pause(): void;
  stop(): void;
  seek(time: number): void;
  getDuration(): number;
  getCurrentTime(): number;
  onFrame(callback: (progress: number) => void): () => void;
}
```

### IEventBus

```typescript
interface IEventBus {
  emit<T>(event: string, data?: T): void;
  on<T>(event: string, handler: (data: T) => void): () => void;
  once<T>(event: string, handler: (data: T) => void): () => void;
  off(event: string): void;
  offAll(): void;
}
```

### IStorage

```typescript
interface IStorage {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  keys(): Promise<string[]>;
}
```

### ISceneRenderer

```typescript
interface ISceneRenderer {
  renderScene(scene: ISceneData): void;
  clearScene(): void;
  setCamera(camera: ICamera): void;
}

interface ISceneData {
  background: string;
  characters: ICharacter[];
  environment: IEnvironment;
  actions: ISceneAction[];
}
```

### ITransition

```typescript
interface ITransition {
  fromFace(state: IFaceState): Promise<void>;
  toFace(state: IFaceState): Promise<void>;
  fromScene(scene: ISceneData): Promise<void>;
  toScene(scene: ISceneData): Promise<void>;
  cancel(): void;
}
```

---

## Interface Status Summary

| Interface | Module | Status | Version |
|-----------|--------|--------|---------|
| ICanvas | M03 | 🟡 Draft | 1.0 |
| IPixelBuffer | M03 | 🟡 Draft | 1.0 |
| IFaceGeometry | M02 | 🟡 Draft | 1.0 |
| IExpressionEngine | M02 | 🟡 Draft | 1.0 |
| IAnimationTimeline | M04 | 🟡 Draft | 1.0 |
| IEventBus | M08 | 🟡 Draft | 1.0 |
| IStorage | M10 | 🟡 Draft | 1.0 |
| ISceneRenderer | M05 | 🟡 Draft | 1.0 |
| ITransition | M06 | 🟡 Draft | 1.0 |

---

## Breaking Changes Policy

A breaking change requires:
1. New version number
2. Deprecation notice in DECISIONS.md
3. Migration guide
4. Coexistence period for old interface

---

## Last Updated

2024-01-01 - V2 Interfaces defined
