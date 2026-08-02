/**
 * Pixel Assignment Engine - Assigns pixels to sprites with layer management and z-ordering
 * 
 * Features:
 * - Sprite registration system
 * - Layer management with visibility control
 * - Pixel-to-sprite mapping with spatial indexing
 * - Z-ordering for proper render order
 * - Performance optimization via dirty region tracking
 */

import { IPosition, ISize, IColor } from '../types';
import { IPixelBuffer, PixelBuffer } from '../buffer/buffer';

/**
 * Unique identifier for sprites
 */
export type SpriteId = string | number;

/**
 * Sprite configuration
 */
export interface SpriteConfig {
  id: SpriteId;
  width: number;
  height: number;
  offsetX?: number;
  offsetY?: number;
  visible?: boolean;
  opacity?: number;
}

/**
 * Sprite interface
 */
export interface ISprite {
  readonly id: SpriteId;
  readonly width: number;
  readonly height: number;
  offsetX: number;
  offsetY: number;
  visible: boolean;
  opacity: number;
  setPixel(x: number, y: number, color: IColor): void;
  getPixel(x: number, y: number): IColor | null;
  getBuffer(): IPixelBuffer;
  getBounds(): { x: number; y: number; width: number; height: number };
  setOffset(x: number, y: number): void;
  resize(width: number, height: number): void;
  clear(): void;
  containsPoint(x: number, y: number): boolean;
}

/**
 * Layer configuration
 */
export interface LayerConfig {
  id: string;
  name?: string;
  visible?: boolean;
  zIndex?: number;
  locked?: boolean;
}

/**
 * Layer interface
 */
export interface ILayer {
  readonly id: string;
  readonly name: string;
  visible: boolean;
  locked: boolean;
  zIndex: number;
  addSprite(sprite: ISprite): void;
  removeSprite(spriteId: SpriteId): void;
  getSprite(spriteId: SpriteId): ISprite | undefined;
  getAllSprites(): ISprite[];
  hasSprite(spriteId: SpriteId): boolean;
  clear(): void;
}

/**
 * Pixel Assignment Engine interface
 */
export interface IPixelAssignmentEngine {
  createLayer(config: LayerConfig): ILayer;
  removeLayer(layerId: string): void;
  getLayer(layerId: string): ILayer | undefined;
  getAllLayers(): ILayer[];
  setLayerOrder(layerIds: string[]): void;
  
  registerSprite(spriteConfig: SpriteConfig): ISprite;
  unregisterSprite(spriteId: SpriteId): void;
  getSprite(spriteId: SpriteId): ISprite | undefined;
  
  setSpriteLayer(spriteId: SpriteId, layerId: string): void;
  getSpriteLayer(spriteId: SpriteId): ILayer | undefined;
  
  getSpriteAtPosition(x: number, y: number): ISprite | undefined;
  getSpritesInRegion(x: number, y: number, width: number, height: number): ISprite[];
  
  render(buffer: IPixelBuffer): void;
  renderLayer(layerId: string, buffer: IPixelBuffer): void;
  
  markDirty(x: number, y: number): void;
  markDirtyRegion(x: number, y: number, width: number, height: number): void;
  getDirtyRegions(): Array<{ x: number; y: number; width: number; height: number }>;
  clearDirty(): void;
  
  getTotalSprites(): number;
  getVisibleSprites(): ISprite[];
}

/**
 * Sprite implementation
 */
class Sprite implements ISprite {
  readonly id: SpriteId;
  readonly width: number;
  readonly height: number;
  
  private _offsetX: number;
  private _offsetY: number;
  private _visible: boolean;
  private _opacity: number;
  private buffer: PixelBuffer;
  private onPositionChange?: (spriteId: SpriteId) => void;
  
  constructor(config: SpriteConfig, onPositionChange?: (spriteId: SpriteId) => void) {
    this.id = config.id;
    this.width = config.width;
    this.height = config.height;
    this._offsetX = config.offsetX ?? 0;
    this._offsetY = config.offsetY ?? 0;
    this._visible = config.visible ?? true;
    this._opacity = config.opacity ?? 1;
    this.buffer = new PixelBuffer(config.width, config.height);
    this.onPositionChange = onPositionChange;
  }
  
  get offsetX(): number {
    return this._offsetX;
  }
  
  set offsetX(value: number) {
    if (this._offsetX !== value) {
      this._offsetX = value;
      this.onPositionChange?.(this.id);
    }
  }
  
  get offsetY(): number {
    return this._offsetY;
  }
  
  set offsetY(value: number) {
    if (this._offsetY !== value) {
      this._offsetY = value;
      this.onPositionChange?.(this.id);
    }
  }
  
  get visible(): boolean {
    return this._visible;
  }
  
  set visible(value: boolean) {
    this._visible = value;
  }
  
  get opacity(): number {
    return this._opacity;
  }
  
  set opacity(value: number) {
    this._opacity = Math.max(0, Math.min(1, value));
  }
  
  setPixel(x: number, y: number, color: IColor): void {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return;
    }
    
    const finalColor: IColor = this._opacity < 1
      ? { ...color, a: Math.round(color.a * this._opacity) }
      : color;
    
    this.buffer.setPixel(x, y, finalColor);
  }
  
  getPixel(x: number, y: number): IColor | null {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return null;
    }
    return this.buffer.getPixel(x, y);
  }
  
  getBuffer(): IPixelBuffer {
    return this.buffer;
  }
  
  getBounds(): { x: number; y: number; width: number; height: number } {
    return {
      x: this._offsetX,
      y: this._offsetY,
      width: this.width,
      height: this.height,
    };
  }
  
  setOffset(x: number, y: number): void {
    let changed = false;
    if (this._offsetX !== x) {
      this._offsetX = x;
      changed = true;
    }
    if (this._offsetY !== y) {
      this._offsetY = y;
      changed = true;
    }
    if (changed) {
      this.onPositionChange?.(this.id);
    }
  }
  
  resize(width: number, height: number): void {
    this.buffer.resize(width, height);
    Object.defineProperty(this, 'width', { value: width, writable: false });
    Object.defineProperty(this, 'height', { value: height, writable: false });
    this.onPositionChange?.(this.id);
  }
  
  clear(): void {
    this.buffer.clear();
  }
  
  containsPoint(x: number, y: number): boolean {
    return (
      x >= this._offsetX &&
      x < this._offsetX + this.width &&
      y >= this._offsetY &&
      y < this._offsetY + this.height
    );
  }
}

/**
 * Layer implementation
 */
class Layer implements ILayer {
  readonly id: string;
  readonly name: string;
  
  private _visible: boolean;
  private _locked: boolean;
  private _zIndex: number;
  private sprites: Map<SpriteId, ISprite>;
  private spriteOrder: SpriteId[];
  
  constructor(config: LayerConfig) {
    this.id = config.id;
    this.name = config.name ?? config.id;
    this._visible = config.visible ?? true;
    this._locked = config.locked ?? false;
    this._zIndex = config.zIndex ?? 0;
    this.sprites = new Map();
    this.spriteOrder = [];
  }
  
  get visible(): boolean {
    return this._visible;
  }
  
  set visible(value: boolean) {
    this._visible = value;
  }
  
  get locked(): boolean {
    return this._locked;
  }
  
  set locked(value: boolean) {
    this._locked = value;
  }
  
  get zIndex(): number {
    return this._zIndex;
  }
  
  set zIndex(value: number) {
    this._zIndex = value;
  }
  
  addSprite(sprite: ISprite): void {
    if (this._locked) {
      return;
    }
    
    this.sprites.set(sprite.id, sprite);
    this.spriteOrder.push(sprite.id);
  }
  
  removeSprite(spriteId: SpriteId): void {
    if (this._locked) {
      return;
    }
    
    this.sprites.delete(spriteId);
    const index = this.spriteOrder.indexOf(spriteId);
    if (index !== -1) {
      this.spriteOrder.splice(index, 1);
    }
  }
  
  getSprite(spriteId: SpriteId): ISprite | undefined {
    return this.sprites.get(spriteId);
  }
  
  getAllSprites(): ISprite[] {
    return this.spriteOrder
      .map(id => this.sprites.get(id))
      .filter((sprite): sprite is ISprite => sprite !== undefined);
  }
  
  hasSprite(spriteId: SpriteId): boolean {
    return this.sprites.has(spriteId);
  }
  
  clear(): void {
    if (this._locked) {
      return;
    }
    
    this.sprites.clear();
    this.spriteOrder = [];
  }
}

/**
 * Dirty region for performance optimization
 */
interface DirtyRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Spatial index for fast sprite lookup
 */
class SpatialIndex {
  private cellSize: number;
  private grid: Map<string, Set<SpriteId>>;
  private spriteCells: Map<SpriteId, Set<string>>;
  
  constructor(cellSize: number = 8) {
    this.cellSize = cellSize;
    this.grid = new Map();
    this.spriteCells = new Map();
  }
  
  private getCellKey(x: number, y: number): string {
    const cellX = Math.floor(x / this.cellSize);
    const cellY = Math.floor(y / this.cellSize);
    return `${cellX},${cellY}`;
  }
  
  insert(sprite: ISprite): void {
    const bounds = sprite.getBounds();
    const cellKeys = new Set<string>();
    
    const startCellX = Math.floor(bounds.x / this.cellSize);
    const startCellY = Math.floor(bounds.y / this.cellSize);
    const endCellX = Math.floor((bounds.x + bounds.width - 1) / this.cellSize);
    const endCellY = Math.floor((bounds.y + bounds.height - 1) / this.cellSize);
    
    for (let cy = startCellY; cy <= endCellY; cy++) {
      for (let cx = startCellX; cx <= endCellX; cx++) {
        const key = `${cx},${cy}`;
        cellKeys.add(key);
        
        if (!this.grid.has(key)) {
          this.grid.set(key, new Set());
        }
        this.grid.get(key)!.add(sprite.id);
      }
    }
    
    this.spriteCells.set(sprite.id, cellKeys);
  }
  
  remove(spriteId: SpriteId): void {
    const cellKeys = this.spriteCells.get(spriteId);
    if (!cellKeys) return;
    
    for (const key of cellKeys) {
      const cell = this.grid.get(key);
      if (cell) {
        cell.delete(spriteId);
        if (cell.size === 0) {
          this.grid.delete(key);
        }
      }
    }
    
    this.spriteCells.delete(spriteId);
  }
  
  update(sprite: ISprite): void {
    this.remove(sprite.id);
    this.insert(sprite);
  }
  
  queryPoint(x: number, y: number): Set<SpriteId> {
    const key = this.getCellKey(x, y);
    const cell = this.grid.get(key);
    return cell ? new Set(cell) : new Set();
  }
  
  queryRegion(x: number, y: number, width: number, height: number): Set<SpriteId> {
    const result = new Set<SpriteId>();
    
    const startCellX = Math.floor(x / this.cellSize);
    const startCellY = Math.floor(y / this.cellSize);
    const endCellX = Math.floor((x + width - 1) / this.cellSize);
    const endCellY = Math.floor((y + height - 1) / this.cellSize);
    
    for (let cy = startCellY; cy <= endCellY; cy++) {
      for (let cx = startCellX; cx <= endCellX; cx++) {
        const key = `${cx},${cy}`;
        const cell = this.grid.get(key);
        if (cell) {
          for (const spriteId of cell) {
            result.add(spriteId);
          }
        }
      }
    }
    
    return result;
  }
  
  clear(): void {
    this.grid.clear();
    this.spriteCells.clear();
  }
}

/**
 * Pixel Assignment Engine implementation
 */
export class PixelAssignmentEngine implements IPixelAssignmentEngine {
  private layers: Map<string, ILayer>;
  private layerOrder: string[];
  private sprites: Map<SpriteId, ISprite>;
  private spriteToLayer: Map<SpriteId, string>;
  private spatialIndex: SpatialIndex;
  private dirtyRegions: DirtyRegion[];
  private gridWidth: number;
  private gridHeight: number;
  
  constructor(gridWidth: number = 32, gridHeight: number = 32, spatialCellSize: number = 8) {
    this.layers = new Map();
    this.layerOrder = [];
    this.sprites = new Map();
    this.spriteToLayer = new Map();
    this.spatialIndex = new SpatialIndex(spatialCellSize);
    this.dirtyRegions = [];
    this.gridWidth = gridWidth;
    this.gridHeight = gridHeight;
    
    // Create default layer
    this.createLayer({ id: 'default', name: 'Default Layer', zIndex: 0 });
  }
  
  /**
   * Update the spatial index for a sprite (called when sprite position changes)
   */
  updateSpriteSpatialIndex(spriteId: SpriteId): void {
    const sprite = this.sprites.get(spriteId);
    if (sprite) {
      this.spatialIndex.update(sprite);
    }
  }
  
  setGridSize(width: number, height: number): void {
    this.gridWidth = width;
    this.gridHeight = height;
  }
  
  createLayer(config: LayerConfig): ILayer {
    const layer = new Layer({
      ...config,
      zIndex: config.zIndex ?? this.layers.size,
    });
    
    this.layers.set(layer.id, layer);
    this.layerOrder.push(layer.id);
    this.sortLayerOrder();
    
    return layer;
  }
  
  removeLayer(layerId: string): void {
    const layer = this.layers.get(layerId);
    if (!layer) return;
    
    // Remove all sprites from the layer
    const sprites = layer.getAllSprites();
    for (const sprite of sprites) {
      this.spatialIndex.remove(sprite.id);
      this.sprites.delete(sprite.id);
      this.spriteToLayer.delete(sprite.id);
    }
    
    this.layers.delete(layerId);
    const index = this.layerOrder.indexOf(layerId);
    if (index !== -1) {
      this.layerOrder.splice(index, 1);
    }
  }
  
  getLayer(layerId: string): ILayer | undefined {
    return this.layers.get(layerId);
  }
  
  getAllLayers(): ILayer[] {
    return this.layerOrder
      .map(id => this.layers.get(id))
      .filter((layer): layer is ILayer => layer !== undefined);
  }
  
  setLayerOrder(layerIds: string[]): void {
    const validLayerIds = layerIds.filter(id => this.layers.has(id));
    const missingIds = layerIds.filter(id => !this.layers.has(id));
    
    if (missingIds.length > 0) {
      throw new Error(`Invalid layer IDs: ${missingIds.join(', ')}`);
    }
    
    this.layerOrder = validLayerIds;
  }
  
  registerSprite(spriteConfig: SpriteConfig): ISprite {
    if (this.sprites.has(spriteConfig.id)) {
      throw new Error(`Sprite with ID ${spriteConfig.id} already exists`);
    }
    
    // Create callback for position changes
    const onPositionChange = (spriteId: SpriteId) => {
      this.spatialIndex.update(this.sprites.get(spriteId)!);
    };
    
    const sprite = new Sprite(spriteConfig, onPositionChange);
    this.sprites.set(sprite.id, sprite);
    
    // Add to default layer
    const defaultLayer = this.layers.get('default');
    if (defaultLayer) {
      defaultLayer.addSprite(sprite);
      this.spriteToLayer.set(sprite.id, 'default');
    }
    
    // Update spatial index
    this.spatialIndex.insert(sprite);
    
    return sprite;
  }
  
  unregisterSprite(spriteId: SpriteId): void {
    const sprite = this.sprites.get(spriteId);
    if (!sprite) return;
    
    // Remove from layer
    const layerId = this.spriteToLayer.get(spriteId);
    if (layerId) {
      const layer = this.layers.get(layerId);
      if (layer) {
        layer.removeSprite(spriteId);
      }
    }
    
    // Remove from spatial index
    this.spatialIndex.remove(spriteId);
    
    // Remove from sprite registry
    this.sprites.delete(spriteId);
    this.spriteToLayer.delete(spriteId);
    
    // Mark affected region as dirty
    const bounds = sprite.getBounds();
    this.markDirtyRegion(bounds.x, bounds.y, bounds.width, bounds.height);
  }
  
  getSprite(spriteId: SpriteId): ISprite | undefined {
    return this.sprites.get(spriteId);
  }
  
  setSpriteLayer(spriteId: SpriteId, layerId: string): void {
    const sprite = this.sprites.get(spriteId);
    if (!sprite) {
      throw new Error(`Sprite ${spriteId} not found`);
    }
    
    const newLayer = this.layers.get(layerId);
    if (!newLayer) {
      throw new Error(`Layer ${layerId} not found`);
    }
    
    // Remove from current layer
    const currentLayerId = this.spriteToLayer.get(spriteId);
    if (currentLayerId) {
      const currentLayer = this.layers.get(currentLayerId);
      if (currentLayer) {
        currentLayer.removeSprite(spriteId);
      }
    }
    
    // Add to new layer
    newLayer.addSprite(sprite);
    this.spriteToLayer.set(spriteId, layerId);
    
    // Mark affected region as dirty
    const bounds = sprite.getBounds();
    this.markDirtyRegion(bounds.x, bounds.y, bounds.width, bounds.height);
  }
  
  getSpriteLayer(spriteId: SpriteId): ILayer | undefined {
    const layerId = this.spriteToLayer.get(spriteId);
    if (!layerId) return undefined;
    return this.layers.get(layerId);
  }
  
  getSpriteAtPosition(x: number, y: number): ISprite | undefined {
    // Query spatial index for potential sprites
    const candidateIds = this.spatialIndex.queryPoint(x, y);
    
    // Sort by z-order (layers first, then sprites)
    const candidates: Array<{ sprite: ISprite; layerZIndex: number; spriteIndex: number }> = [];
    
    for (const spriteId of candidateIds) {
      const sprite = this.sprites.get(spriteId);
      if (!sprite || !sprite.visible) continue;
      
      if (sprite.containsPoint(x, y)) {
        const layer = this.getSpriteLayer(spriteId);
        const layerIndex = this.layerOrder.indexOf(layer?.id ?? '');
        candidates.push({
          sprite,
          layerZIndex: layer?.zIndex ?? 0,
          spriteIndex: layerIndex,
        });
      }
    }
    
    // Sort by layer z-index (ascending) - lower z renders first (behind)
    candidates.sort((a, b) => {
      if (a.layerZIndex !== b.layerZIndex) {
        return b.layerZIndex - a.layerZIndex; // Higher layer z renders on top
      }
      return a.spriteIndex - b.spriteIndex;
    });
    
    return candidates[0]?.sprite;
  }
  
  getSpritesInRegion(x: number, y: number, width: number, height: number): ISprite[] {
    const candidateIds = this.spatialIndex.queryRegion(x, y, width, height);
    const result: ISprite[] = [];
    
    for (const spriteId of candidateIds) {
      const sprite = this.sprites.get(spriteId);
      if (!sprite || !sprite.visible) continue;
      
      const bounds = sprite.getBounds();
      if (this.regionsIntersect(x, y, width, height, bounds.x, bounds.y, bounds.width, bounds.height)) {
        result.push(sprite);
      }
    }
    
    return result;
  }
  
  render(buffer: IPixelBuffer): void {
    // Render layers in order (lower z-index first)
    for (const layerId of this.layerOrder) {
      const layer = this.layers.get(layerId);
      if (!layer || !layer.visible) continue;
      
      this.renderLayerInternal(layer, buffer);
    }
  }
  
  renderLayer(layerId: string, buffer: IPixelBuffer): void {
    const layer = this.layers.get(layerId);
    if (!layer || !layer.visible) return;
    
    this.renderLayerInternal(layer, buffer);
  }
  
  private renderLayerInternal(layer: ILayer, buffer: IPixelBuffer): void {
    const sprites = layer.getAllSprites();
    
    for (const sprite of sprites) {
      if (!sprite.visible) continue;
      
      const bounds = sprite.getBounds();
      buffer.blend(sprite.getBuffer(), bounds.x, bounds.y, 'alpha');
    }
  }
  
  markDirty(x: number, y: number): void {
    this.markDirtyRegion(x, y, 1, 1);
  }
  
  markDirtyRegion(x: number, y: number, width: number, height: number): void {
    const clampedX = Math.max(0, x);
    const clampedY = Math.max(0, y);
    const clampedWidth = Math.max(1, Math.min(width, this.gridWidth - clampedX));
    const clampedHeight = Math.max(1, Math.min(height, this.gridHeight - clampedY));
    
    if (clampedWidth > 0 && clampedHeight > 0) {
      this.dirtyRegions.push({
        x: clampedX,
        y: clampedY,
        width: clampedWidth,
        height: clampedHeight,
      });
    }
  }
  
  getDirtyRegions(): Array<{ x: number; y: number; width: number; height: number }> {
    return [...this.dirtyRegions];
  }
  
  clearDirty(): void {
    this.dirtyRegions = [];
  }
  
  getTotalSprites(): number {
    return this.sprites.size;
  }
  
  getVisibleSprites(): ISprite[] {
    return Array.from(this.sprites.values()).filter(s => s.visible);
  }
  
  private sortLayerOrder(): void {
    this.layerOrder.sort((a, b) => {
      const layerA = this.layers.get(a);
      const layerB = this.layers.get(b);
      return (layerA?.zIndex ?? 0) - (layerB?.zIndex ?? 0);
    });
  }
  
  private regionsIntersect(
    x1: number, y1: number, w1: number, h1: number,
    x2: number, y2: number, w2: number, h2: number
  ): boolean {
    return !(
      x1 + w1 <= x2 ||
      x2 + w2 <= x1 ||
      y1 + h1 <= y2 ||
      y2 + h2 <= y1
    );
  }
}

export { PixelAssignmentEngine as default };
