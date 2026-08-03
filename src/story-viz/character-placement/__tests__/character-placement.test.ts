/**
 * Character Placement Tests
 */

import { CharacterPlacementManager } from '../character-placement';
import type { SceneCharacter } from '../../scene-generator/types';
import type { IPosition } from '../../../graphics/types';

describe('CharacterPlacementManager', () => {
  let placementManager: CharacterPlacementManager;

  const createMockCharacter = (id: string, name: string, emotion: string = 'neutral'): SceneCharacter => ({
    id,
    name,
    position: { x: 0.5, y: 0.5 },
    scale: 1,
    layer: 0,
    expression: {
      eyeOpenness: 1,
      pupilDirection: { x: 0, y: 0 },
      mouthOpenness: 0,
      mouthCurve: 0,
      eyebrowAngle: 0,
      cheekRaise: 0,
    },
    emotion,
    speaking: false,
    animations: [],
  });

  beforeEach(() => {
    placementManager = new CharacterPlacementManager();
  });

  describe('addCharacter', () => {
    it('should add a character to the scene', () => {
      const character = createMockCharacter('char-1', 'Alice');
      
      const placement = placementManager.addCharacter(character);
      
      expect(placement).toBeDefined();
      expect(placement.characterId).toBe('char-1');
    });

    it('should calculate initial position', () => {
      const character = createMockCharacter('char-1', 'Alice');
      
      placementManager.addCharacter(character);
      
      const placement = placementManager.getPlacement('char-1');
      expect(placement?.position).toBeDefined();
      expect(placement?.position.x).toBeDefined();
      expect(placement?.position.y).toBeDefined();
    });

    it('should assign positions to characters', () => {
      const alice = createMockCharacter('char-1', 'Alice');
      const bob = createMockCharacter('char-2', 'Bob');
      
      placementManager.addCharacter(alice);
      placementManager.addCharacter(bob);
      
      const alicePlacement = placementManager.getPlacement('char-1');
      const bobPlacement = placementManager.getPlacement('char-2');
      
      // Characters should have positions assigned
      expect(alicePlacement?.position).toBeDefined();
      expect(bobPlacement?.position).toBeDefined();
      expect(alicePlacement?.position.x).toBeDefined();
      expect(bobPlacement?.position.x).toBeDefined();
    });

    it('should calculate scale based on position', () => {
      const character = createMockCharacter('char-1', 'Alice');
      
      placementManager.addCharacter(character);
      
      const placement = placementManager.getPlacement('char-1');
      expect(placement?.scale).toBeGreaterThan(0);
    });
  });

  describe('removeCharacter', () => {
    it('should remove a character from the scene', () => {
      const character = createMockCharacter('char-1', 'Alice');
      placementManager.addCharacter(character);
      
      const removed = placementManager.removeCharacter('char-1');
      
      expect(removed).toBe(true);
      expect(placementManager.getPlacement('char-1')).toBeUndefined();
    });

    it('should return false for non-existent character', () => {
      const removed = placementManager.removeCharacter('non-existent');
      
      expect(removed).toBe(false);
    });
  });

  describe('setPosition', () => {
    it('should update character position', () => {
      const character = createMockCharacter('char-1', 'Alice');
      placementManager.addCharacter(character);
      
      const success = placementManager.setPosition('char-1', { x: 0.8, y: 0.6 });
      
      expect(success).toBe(true);
      const placement = placementManager.getPlacement('char-1');
      expect(placement?.position.x).toBe(0.8);
      expect(placement?.position.y).toBe(0.6);
    });

    it('should return false for non-existent character', () => {
      const success = placementManager.setPosition('non-existent', { x: 0.5, y: 0.5 });
      
      expect(success).toBe(false);
    });
  });

  describe('setScale', () => {
    it('should update character scale', () => {
      const character = createMockCharacter('char-1', 'Alice');
      placementManager.addCharacter(character);
      
      const success = placementManager.setScale('char-1', 1.5);
      
      expect(success).toBe(true);
      const placement = placementManager.getPlacement('char-1');
      expect(placement?.scale).toBe(1.5);
    });

    it('should clamp scale to min/max bounds', () => {
      const character = createMockCharacter('char-1', 'Alice');
      placementManager.addCharacter(character);
      
      placementManager.setScale('char-1', 10); // Way over max
      let placement = placementManager.getPlacement('char-1');
      expect(placement?.scale).toBeLessThanOrEqual(2); // max is 2
      
      placementManager.setScale('char-1', 0.1); // Way under min
      placement = placementManager.getPlacement('char-1');
      expect(placement?.scale).toBeGreaterThanOrEqual(0.5); // min is 0.5
    });
  });

  describe('setLayer', () => {
    it('should update character layer', () => {
      const character = createMockCharacter('char-1', 'Alice');
      placementManager.addCharacter(character);
      
      const success = placementManager.setLayer('char-1', 75);
      
      expect(success).toBe(true);
      const placement = placementManager.getPlacement('char-1');
      expect(placement?.layer).toBe(75);
    });
  });

  describe('getAllPlacements', () => {
    it('should return all placements sorted by layer', () => {
      const alice = createMockCharacter('char-1', 'Alice');
      const bob = createMockCharacter('char-2', 'Bob');
      
      placementManager.addCharacter(alice);
      placementManager.addCharacter(bob);
      
      const placements = placementManager.getAllPlacements();
      
      expect(placements.length).toBe(2);
      // Should be sorted by layer
      for (let i = 1; i < placements.length; i++) {
        expect(placements[i].layer).toBeGreaterThanOrEqual(placements[i - 1].layer);
      }
    });
  });

  describe('applyLayout', () => {
    it('should apply rule of thirds layout', () => {
      const alice = createMockCharacter('char-1', 'Alice');
      const bob = createMockCharacter('char-2', 'Bob');
      
      placementManager.addCharacter(alice);
      placementManager.addCharacter(bob);
      
      placementManager.applyLayout('rule_of_thirds');
      
      // Rule of thirds should distribute characters
      const placements = placementManager.getAllPlacements();
      expect(placements.length).toBe(2);
    });

    it('should apply center layout', () => {
      const alice = createMockCharacter('char-1', 'Alice');
      const bob = createMockCharacter('char-2', 'Bob');
      
      placementManager.addCharacter(alice);
      placementManager.addCharacter(bob);
      
      placementManager.applyLayout('center');
      
      const placements = placementManager.getAllPlacements();
      expect(placements.every(p => p.position.y === 0.7)).toBe(true);
    });

    it('should apply opposing layout', () => {
      const alice = createMockCharacter('char-1', 'Alice');
      const bob = createMockCharacter('char-2', 'Bob');
      
      placementManager.addCharacter(alice);
      placementManager.addCharacter(bob);
      
      placementManager.applyLayout('opposing');
      
      const placements = placementManager.getAllPlacements();
      // Opposing should have characters on opposite sides
      const xPositions = placements.map(p => p.position.x);
      expect(Math.max(...xPositions) - Math.min(...xPositions)).toBeGreaterThan(0.3);
    });
  });

  describe('getRenderOrder', () => {
    it('should return placements sorted by layer and x position', () => {
      const alice = createMockCharacter('char-1', 'Alice');
      const bob = createMockCharacter('char-2', 'Bob');
      
      placementManager.addCharacter(alice);
      placementManager.addCharacter(bob);
      
      placementManager.setLayer('char-1', 60);
      placementManager.setLayer('char-2', 40);
      
      const renderOrder = placementManager.getRenderOrder();
      
      // char-2 (layer 40) should come before char-1 (layer 60)
      expect(renderOrder[0].characterId).toBe('char-2');
      expect(renderOrder[1].characterId).toBe('char-1');
    });
  });

  describe('clear', () => {
    it('should remove all characters', () => {
      const alice = createMockCharacter('char-1', 'Alice');
      const bob = createMockCharacter('char-2', 'Bob');
      
      placementManager.addCharacter(alice);
      placementManager.addCharacter(bob);
      
      placementManager.clear();
      
      expect(placementManager.getAllPlacements().length).toBe(0);
    });
  });

  describe('event subscription', () => {
    it('should receive position change events', () => {
      const character = createMockCharacter('char-1', 'Alice');
      placementManager.addCharacter(character);
      
      let eventReceived = false;
      placementManager.on(() => {
        eventReceived = true;
      });
      
      placementManager.setPosition('char-1', { x: 0.9, y: 0.9 });
      
      expect(eventReceived).toBe(true);
    });
  });

  describe('configuration', () => {
    it('should allow configuration updates', () => {
      placementManager.configure({
        canvasWidth: 1280,
        canvasHeight: 720,
      });
      
      const config = placementManager.getConfig();
      expect(config.canvasWidth).toBe(1280);
      expect(config.canvasHeight).toBe(720);
    });

    it('should update scale config', () => {
      placementManager.configure({
        scaleConfig: {
          base: 1.5,
          min: 0.3,
          max: 3,
          distanceScaling: false,
        },
      });
      
      const config = placementManager.getConfig();
      expect(config.scaleConfig.base).toBe(1.5);
      expect(config.scaleConfig.max).toBe(3);
    });
  });
});
