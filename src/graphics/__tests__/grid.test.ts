/**
 * Tests for Pixel Grid Manager Module (T-014)
 */

import { PixelGridManager } from '../grid/grid';

describe('Pixel Grid Manager Module', () => {
  describe('PixelGridManager', () => {
    let grid: PixelGridManager;

    beforeEach(() => {
      grid = new PixelGridManager({
        gridWidth: 32,
        gridHeight: 32,
        pixelWidth: 1,
        pixelHeight: 1,
      });
    });

    describe('constructor', () => {
      it('should create grid manager with default config', () => {
        const g = new PixelGridManager();
        expect(g).toBeDefined();
        expect(g.getGridSize()).toEqual({ width: 32, height: 32 });
      });

      it('should create grid manager with custom config', () => {
        const g = new PixelGridManager({
          gridWidth: 64,
          gridHeight: 48,
          pixelWidth: 2,
          pixelHeight: 3,
        });
        expect(g.getGridSize()).toEqual({ width: 64, height: 48 });
        expect(g.getPixelSize()).toEqual({ width: 2, height: 3 });
      });

      it('should throw for invalid grid size when using setGridSize', () => {
        expect(() => grid.setGridSize(0, 32)).toThrow();
        expect(() => grid.setGridSize(32, -1)).toThrow();
      });
    });

    describe('setGridSize', () => {
      it('should set grid size', () => {
        grid.setGridSize(64, 64);
        expect(grid.getGridSize()).toEqual({ width: 64, height: 64 });
      });

      it('should throw for invalid size', () => {
        expect(() => grid.setGridSize(0, 32)).toThrow();
        expect(() => grid.setGridSize(32, -1)).toThrow();
      });
    });

    describe('setPixelSize', () => {
      it('should set pixel size', () => {
        grid.setPixelSize(2, 3);
        expect(grid.getPixelSize()).toEqual({ width: 2, height: 3 });
      });

      it('should throw for invalid size', () => {
        expect(() => grid.setPixelSize(0, 2)).toThrow();
        expect(() => grid.setPixelSize(2, -1)).toThrow();
      });
    });

    describe('gridToPixel', () => {
      it('should convert grid to pixel coordinates', () => {
        expect(grid.gridToPixel(0, 0)).toEqual({ x: 0, y: 0 });
        expect(grid.gridToPixel(5, 10)).toEqual({ x: 5, y: 10 });
      });

      it('should scale with pixel size', () => {
        grid.setPixelSize(2, 3);
        expect(grid.gridToPixel(5, 10)).toEqual({ x: 10, y: 30 });
      });
    });

    describe('pixelToGrid', () => {
      it('should convert pixel to grid coordinates', () => {
        expect(grid.pixelToGrid(0, 0)).toEqual({ x: 0, y: 0 });
        expect(grid.pixelToGrid(5, 10)).toEqual({ x: 5, y: 10 });
        expect(grid.pixelToGrid(5.5, 10.9)).toEqual({ x: 5, y: 10 });
      });

      it('should scale with pixel size', () => {
        grid.setPixelSize(2, 3);
        expect(grid.pixelToGrid(10, 30)).toEqual({ x: 5, y: 10 });
      });
    });

    describe('isWithinBounds', () => {
      it('should return true for valid coordinates', () => {
        expect(grid.isWithinBounds(0, 0)).toBe(true);
        expect(grid.isWithinBounds(31, 31)).toBe(true);
        expect(grid.isWithinBounds(15, 15)).toBe(true);
      });

      it('should return false for invalid coordinates', () => {
        expect(grid.isWithinBounds(-1, 0)).toBe(false);
        expect(grid.isWithinBounds(0, -1)).toBe(false);
        expect(grid.isWithinBounds(32, 0)).toBe(false);
        expect(grid.isWithinBounds(0, 32)).toBe(false);
      });
    });

    describe('clampToGrid', () => {
      it('should clamp coordinates to grid bounds', () => {
        expect(grid.clampToGrid(5, 5)).toEqual({ x: 5, y: 5 });
        expect(grid.clampToGrid(-5, 5)).toEqual({ x: 0, y: 5 });
        expect(grid.clampToGrid(5, -5)).toEqual({ x: 5, y: 0 });
        expect(grid.clampToGrid(100, 100)).toEqual({ x: 31, y: 31 });
        expect(grid.clampToGrid(32, 32)).toEqual({ x: 31, y: 31 });
      });
    });

    describe('getPixelRect', () => {
      it('should return pixel rectangle', () => {
        expect(grid.getPixelRect(5, 10)).toEqual({
          x: 5,
          y: 10,
          width: 1,
          height: 1,
        });
      });

      it('should scale with pixel size', () => {
        grid.setPixelSize(2, 3);
        expect(grid.getPixelRect(5, 10)).toEqual({
          x: 10,
          y: 30,
          width: 2,
          height: 3,
        });
      });
    });

    describe('getTotalPixels', () => {
      it('should return total number of pixels', () => {
        expect(grid.getTotalPixels()).toBe(32 * 32);
        
        grid.setGridSize(64, 48);
        expect(grid.getTotalPixels()).toBe(64 * 48);
      });
    });

    describe('getTotalPixelArea', () => {
      it('should return total pixel area', () => {
        expect(grid.getTotalPixelArea()).toBe(32 * 32);
        
        grid.setPixelSize(2, 3);
        expect(grid.getTotalPixelArea()).toBe(32 * 32 * 2 * 3);
      });
    });

    describe('getGridIndex', () => {
      it('should return correct index', () => {
        expect(grid.getGridIndex(0, 0)).toBe(0);
        expect(grid.getGridIndex(1, 0)).toBe(1);
        expect(grid.getGridIndex(0, 1)).toBe(32);
        expect(grid.getGridIndex(31, 31)).toBe(31 * 32 + 31);
      });

      it('should return -1 for out of bounds', () => {
        expect(grid.getGridIndex(-1, 0)).toBe(-1);
        expect(grid.getGridIndex(0, -1)).toBe(-1);
        expect(grid.getGridIndex(32, 0)).toBe(-1);
        expect(grid.getGridIndex(0, 32)).toBe(-1);
      });
    });

    describe('indexToGrid', () => {
      it('should return correct coordinates', () => {
        expect(grid.indexToGrid(0)).toEqual({ x: 0, y: 0 });
        expect(grid.indexToGrid(1)).toEqual({ x: 1, y: 0 });
        expect(grid.indexToGrid(32)).toEqual({ x: 0, y: 1 });
        expect(grid.indexToGrid(31 * 32 + 31)).toEqual({ x: 31, y: 31 });
      });

      it('should return null for invalid index', () => {
        expect(grid.indexToGrid(-1)).toBeNull();
        expect(grid.indexToGrid(32 * 32)).toBeNull();
      });
    });

    describe('iteratePixels', () => {
      it('should iterate all pixels', () => {
        const visited: Array<{ x: number; y: number }> = [];
        grid.iteratePixels((x, y) => visited.push({ x, y }));
        expect(visited.length).toBe(32 * 32);
        expect(visited[0]).toEqual({ x: 0, y: 0 });
        expect(visited[visited.length - 1]).toEqual({ x: 31, y: 31 });
      });
    });

    describe('iteratePixelsInRect', () => {
      it('should iterate pixels in rectangle', () => {
        const visited: Array<{ x: number; y: number }> = [];
        grid.iteratePixelsInRect(0, 0, 2, 2, (x, y) => visited.push({ x, y }));
        expect(visited.length).toBe(9);
      });

      it('should handle reversed coordinates', () => {
        const visited: Array<{ x: number; y: number }> = [];
        grid.iteratePixelsInRect(2, 2, 0, 0, (x, y) => visited.push({ x, y }));
        expect(visited.length).toBe(9);
      });

      it('should clamp to grid bounds', () => {
        const visited: Array<{ x: number; y: number }> = [];
        grid.iteratePixelsInRect(-5, -5, 100, 100, (x, y) => visited.push({ x, y }));
        expect(visited.length).toBe(32 * 32);
      });
    });

    describe('getNeighbors', () => {
      it('should return orthogonal neighbors', () => {
        const neighbors = grid.getNeighbors(5, 5, false);
        expect(neighbors.length).toBe(4);
        expect(neighbors).toContainEqual({ x: 5, y: 4 });
        expect(neighbors).toContainEqual({ x: 5, y: 6 });
        expect(neighbors).toContainEqual({ x: 4, y: 5 });
        expect(neighbors).toContainEqual({ x: 6, y: 5 });
      });

      it('should return diagonal neighbors', () => {
        const neighbors = grid.getNeighbors(5, 5, true);
        expect(neighbors.length).toBe(8);
      });

      it('should not return out of bounds neighbors', () => {
        const neighbors = grid.getNeighbors(0, 0, true);
        expect(neighbors.length).toBe(3);
        expect(neighbors).not.toContainEqual({ x: -1, y: 0 });
      });
    });
  });
});
