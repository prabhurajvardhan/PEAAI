# PEAAI Interface Contracts

> Public API definitions for all modules

---

## Interface Principles

1. All interfaces are frozen once implementation begins
2. Changes require Chief Architect approval
3. Interfaces must be self-documenting
4. TypeScript types define the contract

---

## ICanvas Interface

| Property | Value |
|----------|-------|
| Name | ICanvas |
| Purpose | Core canvas rendering interface |
| Owner Module | M01 (Pixel Canvas) |
| Status | 🟡 Frozen (Draft) |

### Interface Definition

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

### Inputs
- `container: HTMLElement` - DOM container for canvas
- `width: number` - Canvas width in pixels
- `height: number` - Canvas height in pixels
- `scale: number` - Pixel scale multiplier

### Outputs
- Canvas element with rendering context
- Pixel buffer access
- Render state management

---

## IPixelBuffer Interface

| Property | Value |
|----------|-------|
| Name | IPixelBuffer |
| Purpose | Direct pixel manipulation |
| Owner Module | M01 (Pixel Canvas) |
| Status | 🟡 Frozen (Draft) |

### Interface Definition

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

### Inputs
- `x: number`, `y: number` - Pixel coordinates
- `color: IColor` - RGBA color values
- `pixels: IPixelBatch` - Batch of pixel operations

### Outputs
- Pixel data read/write
- Buffer operations
- Blended pixel data

---

## IRenderLoop Interface

| Property | Value |
|----------|-------|
| Name | IRenderLoop |
| Purpose | Frame timing and loop control |
| Owner Module | M01 (Pixel Canvas) |
| Status | 🟡 Frozen (Draft) |

### Interface Definition

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

### Inputs
- `callback: (deltaTime: number) => void` - Frame callback function

### Outputs
- Frame timing data
- Loop state
- FPS information

---

## IFaceGeometry Interface

| Property | Value |
|----------|-------|
| Name | IFaceGeometry |
| Purpose | Face structure definitions |
| Owner Module | M02 (Companion Face Engine) |
| Status | 🟡 Frozen (Draft) |

### Interface Definition

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

### Inputs
- None (constants)

### Outputs
- Face geometry constants
- Face state data

---

## IFaceRenderer Interface

| Property | Value |
|----------|-------|
| Name | IFaceRenderer |
| Purpose | Face rendering to pixel buffer |
| Owner Module | M02 (Companion Face Engine) |
| Status | 🟡 Frozen (Draft) |

### Interface Definition

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

### Inputs
- `state: IFaceState` - Current face state
- `buffer: IPixelBuffer` - Target pixel buffer
- `emotion: EmotionType` - Emotion color mapping

### Outputs
- Rendered face to pixel buffer

---

## IExpressionEngine Interface

| Property | Value |
|----------|-------|
| Name | IExpressionEngine |
| Purpose | Expression state management |
| Owner Module | M03 (Expression Engine) |
| Status | 🟡 Frozen (Draft) |

### Interface Definition

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

### Inputs
- `expression: ExpressionType` - Target expression
- `callback: Function` - Event handlers
- `renderer: IFaceRenderer` - Face renderer connection

### Outputs
- Expression state changes
- Transition events
- Face state commands

---

## IEventBus Interface

| Property | Value |
|----------|-------|
| Name | IEventBus |
| Purpose | Event-driven module communication |
| Owner Module | M08 (AI Orchestrator) |
| Status | 🟡 Frozen (Draft) |

### Interface Definition

```typescript
interface IEventBus {
  emit<T>(event: string, data?: T): void;
  on<T>(event: string, handler: (data: T) => void): () => void;
  once<T>(event: string, handler: (data: T) => void): () => void;
  off(event: string): void;
  offAll(): void;
}
```

### Inputs
- `event: string` - Event name
- `data: T` - Event payload
- `handler: Function` - Event handler

### Outputs
- Event dispatch
- Handler subscription

---

## IStorage Interface

| Property | Value |
|----------|-------|
| Name | IStorage |
| Purpose | Persistent data storage |
| Owner Module | M09 (Memory Engine) |
| Status | 🟡 Frozen (Draft) |

### Interface Definition

```typescript
interface IStorage {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  keys(): Promise<string[]>;
}
```

### Inputs
- `key: string` - Storage key
- `value: T` - Data to store

### Outputs
- Retrieved data
- Operation status

---

## Interface Status Summary

| Interface | Module | Status | Version |
|-----------|--------|--------|---------|
| ICanvas | M01 | 🟡 Draft | 1.0 |
| IPixelBuffer | M01 | 🟡 Draft | 1.0 |
| IRenderLoop | M01 | 🟡 Draft | 1.0 |
| IFaceGeometry | M02 | 🟡 Draft | 1.0 |
| IFaceRenderer | M02 | 🟡 Draft | 1.0 |
| IExpressionEngine | M03 | 🟡 Draft | 1.0 |
| IEventBus | M08 | 🟡 Draft | 1.0 |
| IStorage | M09 | 🟡 Draft | 1.0 |

---

## Breaking Changes Policy

A breaking change requires:
1. New version number
2. Deprecation notice in DECISIONS.md
3. Migration guide
4. Coexistence period for old interface

---

## Last Updated

2024-01-01 - Interfaces defined
