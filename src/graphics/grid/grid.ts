/**
 * Pixel Grid Manager - Coordinate system and grid management
 * 
 * Features:
 * - Grid size configuration
 * - Coordinate transformation (grid <-> pixel)
 * - Grid-to-pixel mapping
 * - Boundary checking
 */

import { IPosition, ISize, IColor } from '../types';

export interface IGridManager {
  setGridSize(width: number, height: number): void;
  getGridSize(): ISize;
  gridToPixel(gridX: number, gridY: number): IPosition;
  pixelToGrid(pixelX: number, pixelY: number): IPosition;
  isWithinBounds(gridX: number, gridY: number): boolean;
  clampToGrid(gridX: number, gridY: number): IPosition;
  getPixelRect(gridX: number, gridY: number): { x: number; y: number; width: number; height: number };
  setPixelSize(width: number, height: number): void;
  getPixelSize(): ISize;
}

export interface GridConfig {
  gridWidth: number;
  gridHeight: number;
  pixelWidth: number;
  pixelHeight: number;
}

const DEFAULT_CONFIG: Required<GridConfig> = {
  gridWidth: 32,
  gridHeight: 32,
  pixelWidth: 1,
  pixelHeight: 1,
};

export class PixelGridManager implements IGridManager {
  private gridWidth: number;
  private gridHeight: number;
  private pixelWidth: number;
  private pixelHeight: number;

  constructor(config: Partial<GridConfig> = {}) {
    const merged = { ...DEFAULT_CONFIG, ...config };
    this.gridWidth = merged.gridWidth;
    this.gridHeight = merged.gridHeight;
    this.pixelWidth = merged.pixelWidth;
    this.pixelHeight = merged.pixelHeight;
  }

  setGridSize(width: number, height: number): void {
    if (width <= 0 || height <= 0) {
      throw new Error('Grid width and height must be positive');
    }
    this.gridWidth = width;
    this.gridHeight = height;
  }

  getGridSize(): ISize {
    return {
      width: this.gridWidth,
      height: this.gridHeight,
    };
  }

  gridToPixel(gridX: number, gridY: number): IPosition {
    return {
      x: gridX * this.pixelWidth,
      y: gridY * this.pixelHeight,
    };
  }

  pixelToGrid(pixelX: number, pixelY: number): IPosition {
    return {
      x: Math.floor(pixelX / this.pixelWidth),
      y: Math.floor(pixelY / this.pixelHeight),
    };
  }

  isWithinBounds(gridX: number, gridY: number): boolean {
    return (
      gridX >= 0 &&
      gridX < this.gridWidth &&
      gridY >= 0 &&
      gridY < this.gridHeight
    );
  }

  clampToGrid(gridX: number, gridY: number): IPosition {
    return {
      x: Math.max(0, Math.min(gridX, this.gridWidth - 1)),
      y: Math.max(0, Math.min(gridY, this.gridHeight - 1)),
    };
  }

  getPixelRect(gridX: number, gridY: number): { x: number; y: number; width: number; height: number } {
    const pos = this.gridToPixel(gridX, gridY);
    return {
      x: pos.x,
      y: pos.y,
      width: this.pixelWidth,
      height: this.pixelHeight,
    };
  }

  setPixelSize(width: number, height: number): void {
    if (width <= 0 || height <= 0) {
      throw new Error('Pixel width and height must be positive');
    }
    this.pixelWidth = width;
    this.pixelHeight = height;
  }

  getPixelSize(): ISize {
    return {
      width: this.pixelWidth,
      height: this.pixelHeight,
    };
  }

  getTotalPixels(): number {
    return this.gridWidth * this.gridHeight;
  }

  getTotalPixelArea(): number {
    return this.getTotalPixels() * this.pixelWidth * this.pixelHeight;
  }

  getGridIndex(gridX: number, gridY: number): number {
    if (!this.isWithinBounds(gridX, gridY)) {
      return -1;
    }
    return gridY * this.gridWidth + gridX;
  }

  indexToGrid(index: number): IPosition | null {
    if (index < 0 || index >= this.getTotalPixels()) {
      return null;
    }
    return {
      x: index % this.gridWidth,
      y: Math.floor(index / this.gridWidth),
    };
  }

  iteratePixels(callback: (x: number, y: number) => void): void {
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        callback(x, y);
      }
    }
  }

  iteratePixelsInRect(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    callback: (x: number, y: number) => void
  ): void {
    const startX = Math.max(0, Math.min(x1, x2));
    const startY = Math.max(0, Math.min(y1, y2));
    const endX = Math.max(0, Math.min(Math.max(x1, x2) + 1, this.gridWidth));
    const endY = Math.max(0, Math.min(Math.max(y1, y2) + 1, this.gridHeight));

    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        callback(x, y);
      }
    }
  }

  getNeighbors(gridX: number, gridY: number, includeDiagonals: boolean = false): IPosition[] {
    const neighbors: IPosition[] = [];
    const directions = includeDiagonals
      ? [
          [-1, -1], [0, -1], [1, -1],
          [-1, 0],          [1, 0],
          [-1, 1],  [0, 1], [1, 1],
        ]
      : [
          [0, -1],
          [-1, 0], [1, 0],
          [0, 1],
        ];

    for (const [dx, dy] of directions) {
      const nx = gridX + dx;
      const ny = gridY + dy;
      if (this.isWithinBounds(nx, ny)) {
        neighbors.push({ x: nx, y: ny });
      }
    }

    return neighbors;
  }
}

export { PixelGridManager as default };
