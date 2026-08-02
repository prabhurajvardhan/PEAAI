/**
 * Tests for Pixel Assignment Engine Module (T-016)
 */

import { PixelAssignmentEngine, SpriteId } from '../assignment';
import { PixelBuffer } from '../../buffer/buffer';

describe('Pixel Assignment Engine Module', () => {
  describe('PixelAssignmentEngine', () => {
    let engine: PixelAssignmentEngine;

    beforeEach(() => {
      engine = new PixelAssignmentEngine(32, 32, 8);
    });

    describe('Layer Management', () => {
      it('should create a default layer on initialization', () => {
        const layers = engine.getAllLayers();
        expect(layers).toHaveLength(1);
        expect(layers[0].id).toBe('default');
      });

      it('should create additional layers', () => {
        const layer = engine.createLayer({ id: 'foreground', name: 'Foreground', zIndex: 10 });
        expect(layer).toBeDefined();
        expect(layer.id).toBe('foreground');
        expect(engine.getLayer('foreground')).toBe(layer);
      });

      it('should remove layers', () => {
        engine.createLayer({ id: 'test' });
        engine.removeLayer('test');
        expect(engine.getLayer('test')).toBeUndefined();
      });

      it('should set layer order', () => {
        engine.createLayer({ id: 'layer1' });
        engine.createLayer({ id: 'layer2' });
        engine.setLayerOrder(['layer2', 'layer1', 'default']);
        
        const layers = engine.getAllLayers();
        expect(layers[0].id).toBe('layer2');
        expect(layers[1].id).toBe('layer1');
        expect(layers[2].id).toBe('default');
      });

      it('should throw for invalid layer order', () => {
        expect(() => engine.setLayerOrder(['invalid'])).toThrow();
      });
    });

    describe('Sprite Registration', () => {
      it('should register sprites', () => {
        const sprite = engine.registerSprite({
          id: 'sprite1',
          width: 8,
          height: 8,
          offsetX: 10,
          offsetY: 10,
        });
        
        expect(sprite).toBeDefined();
        expect(sprite.id).toBe('sprite1');
        expect(engine.getSprite('sprite1')).toBe(sprite);
      });

      it('should throw for duplicate sprite IDs', () => {
        engine.registerSprite({ id: 'sprite1', width: 8, height: 8 });
        expect(() => {
          engine.registerSprite({ id: 'sprite1', width: 8, height: 8 });
        }).toThrow();
      });

      it('should unregister sprites', () => {
        engine.registerSprite({ id: 'sprite1', width: 8, height: 8 });
        engine.unregisterSprite('sprite1');
        expect(engine.getSprite('sprite1')).toBeUndefined();
      });

      it('should get total sprite count', () => {
        engine.registerSprite({ id: 's1', width: 4, height: 4 });
        engine.registerSprite({ id: 's2', width: 4, height: 4 });
        expect(engine.getTotalSprites()).toBe(2);
      });

      it('should get visible sprites', () => {
        const sprite1 = engine.registerSprite({ id: 's1', width: 4, height: 4, visible: true });
        const sprite2 = engine.registerSprite({ id: 's2', width: 4, height: 4, visible: false });
        
        const visible = engine.getVisibleSprites();
        expect(visible).toHaveLength(1);
        expect(visible[0].id).toBe('s1');
      });
    });

    describe('Sprite Layer Assignment', () => {
      it('should assign sprites to layers', () => {
        const sprite = engine.registerSprite({ id: 'sprite1', width: 8, height: 8 });
        engine.createLayer({ id: 'layer1' });
        engine.setSpriteLayer('sprite1', 'layer1');
        
        const layer = engine.getSpriteLayer('sprite1');
        expect(layer?.id).toBe('layer1');
      });

      it('should throw for non-existent sprite', () => {
        expect(() => engine.setSpriteLayer('invalid', 'default')).toThrow();
      });

      it('should throw for non-existent layer', () => {
        engine.registerSprite({ id: 'sprite1', width: 8, height: 8 });
        expect(() => engine.setSpriteLayer('sprite1', 'invalid')).toThrow();
      });
    });

    describe('Sprite Properties', () => {
      it('should set sprite pixel', () => {
        const sprite = engine.registerSprite({
          id: 'sprite1',
          width: 8,
          height: 8,
        });
        
        sprite.setPixel(0, 0, { r: 255, g: 0, b: 0, a: 255 });
        expect(sprite.getPixel(0, 0)).toEqual({ r: 255, g: 0, b: 0, a: 255 });
      });

      it('should ignore out of bounds pixel access', () => {
        const sprite = engine.registerSprite({
          id: 'sprite1',
          width: 8,
          height: 8,
        });
        
        sprite.setPixel(10, 10, { r: 255, g: 0, b: 0, a: 255 });
        expect(sprite.getPixel(10, 10)).toBeNull();
      });

      it('should set sprite offset', () => {
        const sprite = engine.registerSprite({
          id: 'sprite1',
          width: 8,
          height: 8,
          offsetX: 5,
          offsetY: 5,
        });
        
        sprite.setOffset(10, 15);
        expect(sprite.offsetX).toBe(10);
        expect(sprite.offsetY).toBe(15);
        
        const bounds = sprite.getBounds();
        expect(bounds.x).toBe(10);
        expect(bounds.y).toBe(15);
      });

      it('should apply opacity to pixels', () => {
        const sprite = engine.registerSprite({
          id: 'sprite1',
          width: 8,
          height: 8,
          opacity: 0.5,
        });
        
        sprite.setPixel(0, 0, { r: 255, g: 0, b: 0, a: 255 });
        const pixel = sprite.getPixel(0, 0);
        expect(pixel?.a).toBe(128); // 255 * 0.5 = 128
      });

      it('should clear sprite', () => {
        const sprite = engine.registerSprite({
          id: 'sprite1',
          width: 8,
          height: 8,
        });
        
        sprite.setPixel(0, 0, { r: 255, g: 0, b: 0, a: 255 });
        sprite.clear();
        expect(sprite.getPixel(0, 0)).toEqual({ r: 0, g: 0, b: 0, a: 0 });
      });

      it('should check point containment', () => {
        const sprite = engine.registerSprite({
          id: 'sprite1',
          width: 8,
          height: 8,
          offsetX: 5,
          offsetY: 5,
        });
        
        expect(sprite.containsPoint(5, 5)).toBe(true);
        expect(sprite.containsPoint(6, 6)).toBe(true);
        expect(sprite.containsPoint(12, 12)).toBe(true);
        expect(sprite.containsPoint(13, 13)).toBe(false);
        expect(sprite.containsPoint(4, 5)).toBe(false);
      });
    });

    describe('Pixel-to-Sprite Mapping', () => {
      it('should find sprite at position', () => {
        engine.registerSprite({
          id: 'sprite1',
          width: 8,
          height: 8,
          offsetX: 5,
          offsetY: 5,
        });
        
        const sprite = engine.getSpriteAtPosition(7, 7);
        expect(sprite?.id).toBe('sprite1');
      });

      it('should return undefined for empty position', () => {
        const sprite = engine.getSpriteAtPosition(0, 0);
        expect(sprite).toBeUndefined();
      });

      it('should find sprites in region', () => {
        engine.registerSprite({ id: 's1', width: 8, height: 8, offsetX: 0, offsetY: 0 });
        engine.registerSprite({ id: 's2', width: 8, height: 8, offsetX: 10, offsetY: 10 });
        engine.registerSprite({ id: 's3', width: 8, height: 8, offsetX: 20, offsetY: 20 });
        
        const sprites = engine.getSpritesInRegion(0, 0, 15, 15);
        const ids = sprites.map(s => s.id).sort();
        expect(ids).toEqual(['s1', 's2']);
      });

      it('should return empty array for region with no sprites', () => {
        engine.registerSprite({ id: 's1', width: 8, height: 8, offsetX: 0, offsetY: 0 });
        
        const sprites = engine.getSpritesInRegion(20, 20, 10, 10);
        expect(sprites).toHaveLength(0);
      });
    });

    describe('Z-Ordering', () => {
      it('should render higher z-index layers on top', () => {
        const layer1 = engine.createLayer({ id: 'layer1', zIndex: 0 });
        const layer2 = engine.createLayer({ id: 'layer2', zIndex: 1 });
        
        const sprite1 = engine.registerSprite({ id: 's1', width: 32, height: 32, offsetX: 0, offsetY: 0 });
        sprite1.setPixel(0, 0, { r: 255, g: 0, b: 0, a: 255 }); // Red in bottom layer
        
        engine.setSpriteLayer('s1', 'layer1');
        
        const sprite2 = engine.registerSprite({ id: 's2', width: 32, height: 32, offsetX: 0, offsetY: 0 });
        sprite2.setPixel(0, 0, { r: 0, g: 255, b: 0, a: 255 }); // Green in top layer
        
        engine.setSpriteLayer('s2', 'layer2');
        
        const buffer = new PixelBuffer(32, 32);
        engine.render(buffer);
        
        // Top layer (layer2) should have its pixel rendered last
        const pixel = buffer.getPixel(0, 0);
        expect(pixel.r).toBe(0); // Green from layer2
        expect(pixel.g).toBeGreaterThan(0);
      });

      it('should respect layer visibility', () => {
        const layer = engine.createLayer({ id: 'test', visible: false });
        const sprite = engine.registerSprite({ id: 's1', width: 8, height: 8 });
        sprite.setPixel(0, 0, { r: 255, g: 0, b: 0, a: 255 });
        
        engine.setSpriteLayer('s1', 'test');
        
        const buffer = new PixelBuffer(32, 32);
        engine.render(buffer);
        
        expect(buffer.getPixel(0, 0)).toEqual({ r: 0, g: 0, b: 0, a: 0 });
      });
    });

    describe('Rendering', () => {
      it('should render all visible sprites', () => {
        const sprite = engine.registerSprite({
          id: 's1',
          width: 8,
          height: 8,
          offsetX: 5,
          offsetY: 5,
        });
        sprite.setPixel(0, 0, { r: 255, g: 0, b: 0, a: 255 });
        sprite.setPixel(1, 1, { r: 0, g: 255, b: 0, a: 255 });
        
        const buffer = new PixelBuffer(32, 32);
        engine.render(buffer);
        
        expect(buffer.getPixel(5, 5)).toEqual({ r: 255, g: 0, b: 0, a: 255 });
        expect(buffer.getPixel(6, 6)).toEqual({ r: 0, g: 255, b: 0, a: 255 });
      });

      it('should render specific layer', () => {
        engine.createLayer({ id: 'layer1' });
        engine.createLayer({ id: 'layer2' });
        
        const sprite1 = engine.registerSprite({ id: 's1', width: 8, height: 8, offsetX: 0, offsetY: 0 });
        sprite1.setPixel(0, 0, { r: 255, g: 0, b: 0, a: 255 });
        engine.setSpriteLayer('s1', 'layer1');
        
        const sprite2 = engine.registerSprite({ id: 's2', width: 8, height: 8, offsetX: 0, offsetY: 0 });
        sprite2.setPixel(0, 0, { r: 0, g: 255, b: 0, a: 255 });
        engine.setSpriteLayer('s2', 'layer2');
        
        const buffer = new PixelBuffer(32, 32);
        engine.renderLayer('layer1', buffer);
        
        expect(buffer.getPixel(0, 0)).toEqual({ r: 255, g: 0, b: 0, a: 255 });
        expect(buffer.getPixel(1, 1)).toEqual({ r: 0, g: 0, b: 0, a: 0 });
      });
    });

    describe('Dirty Region Tracking', () => {
      it('should mark dirty regions', () => {
        engine.markDirty(5, 5);
        engine.markDirtyRegion(10, 10, 8, 8);
        
        const regions = engine.getDirtyRegions();
        expect(regions).toHaveLength(2);
      });

      it('should clear dirty regions', () => {
        engine.markDirty(5, 5);
        engine.clearDirty();
        
        expect(engine.getDirtyRegions()).toHaveLength(0);
      });

      it('should clamp dirty regions to grid bounds', () => {
        engine.markDirtyRegion(-5, -5, 100, 100);
        
        const regions = engine.getDirtyRegions();
        expect(regions[0].x).toBe(0);
        expect(regions[0].y).toBe(0);
        expect(regions[0].width).toBeLessThanOrEqual(32);
        expect(regions[0].height).toBeLessThanOrEqual(32);
      });
    });

    describe('Performance Optimization', () => {
      it('should use spatial indexing for fast lookups', () => {
        // Register many sprites in a grid pattern
        // With 32x32 grid and 4x4 sprites, we can fit 8x8 = 64 sprites
        // sprite i: x = (i % 8) * 4, y = floor(i / 8) * 4
        for (let i = 0; i < 64; i++) {
          engine.registerSprite({
            id: `sprite${i}`,
            width: 4,
            height: 4,
            offsetX: (i % 8) * 4,
            offsetY: Math.floor(i / 8) * 4,
          });
        }
        
        // Query position (2, 2) - should find sprite0 (at 0,0 covering 0-3,0-3)
        const sprite0 = engine.getSpriteAtPosition(2, 2);
        expect(sprite0).toBeDefined();
        expect(sprite0?.id).toBe('sprite0');
        
        // Query position (4, 4) - should find sprite9 (at 4,4 covering 4-7,4-7)
        // sprite9: x = (9%8)*4 = 4, y = floor(9/8)*4 = 4
        const sprite9 = engine.getSpriteAtPosition(4, 4);
        expect(sprite9).toBeDefined();
        expect(sprite9?.id).toBe('sprite9');
        
        // Query position (12, 12) - should find sprite27 (at 12,12 covering 12-15,12-15)
        // sprite27: x = (27%8)*4 = 12, y = floor(27/8)*4 = 12
        const sprite27 = engine.getSpriteAtPosition(12, 12);
        expect(sprite27).toBeDefined();
        expect(sprite27?.id).toBe('sprite27');
        
        // Query region containing sprites
        const sprites = engine.getSpritesInRegion(0, 0, 16, 16);
        expect(sprites.length).toBe(16); // 4x4 grid of 4x4 sprites
      });

      it('should update spatial index when sprite moves', () => {
        const sprite = engine.registerSprite({
          id: 'sprite1',
          width: 8,
          height: 8,
          offsetX: 0,
          offsetY: 0,
        });
        
        // Initially at 0,0
        expect(engine.getSpriteAtPosition(4, 4)?.id).toBe('sprite1');
        
        // Move sprite
        sprite.setOffset(20, 20);
        
        // Should no longer be at 4,4
        expect(engine.getSpriteAtPosition(4, 4)?.id).toBeUndefined();
        expect(engine.getSpriteAtPosition(24, 24)?.id).toBe('sprite1');
      });
    });
  });
});
