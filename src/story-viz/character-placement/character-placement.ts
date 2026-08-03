/**
 * Character Placement
 * 
 * Manages character positioning, scaling, and Z-layering in story scenes.
 * 
 * Features:
 * - Position definitions with anchor points
 * - Character scaling (distance-based, emotion-based)
 * - Z-layering for proper depth sorting
 * - Animation integration for movement
 * - Multiple layout rules (rule of thirds, golden ratio, etc.)
 */

import { IPosition } from '../../graphics/types';
import type {
  CharacterPlacement,
  PlacementPosition,
  ScaleConfig,
  ZLayerConfig,
  LayoutConfig,
  PlacementRule,
  AnchorPoint,
  CharacterBounds,
  PlacementAnimation,
  AnimationKeyframe,
  CharacterPlacementConfig,
} from './types';
import type { SceneCharacter } from '../scene-generator/types';

/**
 * Golden ratio constant
 */
const GOLDEN_RATIO = 1.618033988749895;

/**
 * Default scale configuration
 */
const DEFAULT_SCALE_CONFIG: ScaleConfig = {
  base: 1,
  min: 0.5,
  max: 2,
  distanceScaling: true,
};

/**
 * Default Z-layer configuration
 */
const DEFAULT_Z_LAYERS: ZLayerConfig = {
  foreground: 100,
  midground: 50,
  background: 0,
  characters: 50,
  props: 40,
  effects: 90,
};

/**
 * Default character bounds (32x32 pixel character)
 */
const DEFAULT_BOUNDS: CharacterBounds = {
  width: 32,
  height: 32,
  pivotX: 0.5,
  pivotY: 1,
};

/**
 * Default anchor point
 */
const DEFAULT_ANCHOR: AnchorPoint = {
  horizontal: 'center',
  vertical: 'bottom',
};

/**
 * Default layout configuration
 */
const DEFAULT_LAYOUT: LayoutConfig = {
  rule: 'rule_of_thirds',
  maxCharacters: 5,
  spacing: 0.1,
  offset: { x: 0, y: 0 },
};

/**
 * Default controller configuration
 */
const DEFAULT_CONFIG: CharacterPlacementConfig = {
  canvasWidth: 1920,
  canvasHeight: 1080,
  scaleConfig: DEFAULT_SCALE_CONFIG,
  zLayers: DEFAULT_Z_LAYERS,
  defaultLayout: DEFAULT_LAYOUT,
  anchorPoint: DEFAULT_ANCHOR,
  bounds: DEFAULT_BOUNDS,
};

/**
 * Character Placement class
 */
export class CharacterPlacementManager {
  private placements: Map<string, CharacterPlacement> = new Map();
  private config: CharacterPlacementConfig;
  private eventListeners: Map<string, Set<(placement: CharacterPlacement) => void>> = new Map();

  constructor(config: Partial<CharacterPlacementConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Add a character to the scene
   */
  addCharacter(sceneCharacter: SceneCharacter): CharacterPlacement {
    const existing = this.placements.get(sceneCharacter.id);
    if (existing) {
      return existing;
    }

    const position = this.calculateInitialPosition(sceneCharacter, this.placements.size);
    const scale = this.calculateScale(sceneCharacter, position);
    const layer = this.calculateLayer(sceneCharacter);

    const placement: CharacterPlacement = {
      id: sceneCharacter.id,
      characterId: sceneCharacter.id,
      position,
      scale,
      layer,
      rotation: 0,
      opacity: 1,
      anchor: 'bottom',
    };

    this.placements.set(sceneCharacter.id, placement);
    this.emit('characterAdded', placement);

    return placement;
  }

  /**
   * Remove a character from the scene
   */
  removeCharacter(characterId: string): boolean {
    const placement = this.placements.get(characterId);
    if (!placement) {
      return false;
    }

    this.placements.delete(characterId);
    this.emit('characterRemoved', placement);

    return true;
  }

  /**
   * Get placement for a character
   */
  getPlacement(characterId: string): CharacterPlacement | undefined {
    return this.placements.get(characterId);
  }

  /**
   * Get all placements sorted by layer
   */
  getAllPlacements(): CharacterPlacement[] {
    return Array.from(this.placements.values()).sort((a, b) => a.layer - b.layer);
  }

  /**
   * Update character position
   */
  setPosition(characterId: string, position: PlacementPosition): boolean {
    const placement = this.placements.get(characterId);
    if (!placement) {
      return false;
    }

    const previousPosition = { ...placement.position };
    placement.position = { ...position };
    this.emit('positionChanged', placement);

    return true;
  }

  /**
   * Update character scale
   */
  setScale(characterId: string, scale: number): boolean {
    const placement = this.placements.get(characterId);
    if (!placement) {
      return false;
    }

    const clampedScale = Math.max(
      this.config.scaleConfig.min,
      Math.min(this.config.scaleConfig.max, scale)
    );

    placement.scale = clampedScale;
    this.emit('scaleChanged', placement);

    return true;
  }

  /**
   * Update character layer (Z-order)
   */
  setLayer(characterId: string, layer: number): boolean {
    const placement = this.placements.get(characterId);
    if (!placement) {
      return false;
    }

    placement.layer = layer;
    this.emit('layerChanged', placement);

    return true;
  }

  /**
   * Animate character movement
   */
  animatePosition(
    characterId: string,
    targetPosition: PlacementPosition,
    duration: number = 500
  ): Promise<void> {
    return new Promise((resolve) => {
      const placement = this.placements.get(characterId);
      if (!placement) {
        resolve();
        return;
      }

      const startPosition = { ...placement.position };
      const startTime = performance.now();

      const animate = () => {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = this.easeInOutQuad(progress);

        placement.position = {
          x: startPosition.x + (targetPosition.x - startPosition.x) * easedProgress,
          y: startPosition.y + (targetPosition.y - startPosition.y) * easedProgress,
          anchor: targetPosition.anchor || placement.position.anchor,
        };

        this.emit('positionChanged', placement);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };

      animate();
    });
  }

  /**
   * Apply layout rule to all characters
   */
  applyLayout(rule: PlacementRule): void {
    const characters = Array.from(this.placements.values());
    
    switch (rule) {
      case 'equal_spacing':
        this.applyEqualSpacing(characters);
        break;
      case 'golden_ratio':
        this.applyGoldenRatio(characters);
        break;
      case 'rule_of_thirds':
        this.applyRuleOfThirds(characters);
        break;
      case 'center':
        this.applyCenter(characters);
        break;
      case 'cluster':
        this.applyCluster(characters);
        break;
      case 'opposing':
        this.applyOpposing(characters);
        break;
    }
  }

  /**
   * Calculate initial position based on character index
   */
  private calculateInitialPosition(character: SceneCharacter, index: number): PlacementPosition {
    const layout = this.config.defaultLayout;
    const count = this.placements.size + 1;

    switch (layout.rule) {
      case 'rule_of_thirds':
        return this.getRuleOfThirdsPosition(index, count);
      case 'golden_ratio':
        return this.getGoldenRatioPosition(index, count);
      case 'center':
        return this.getCenterPosition(index, count);
      case 'cluster':
        return this.getClusterPosition(index);
      case 'opposing':
        return this.getOpposingPosition(index, count);
      default:
        return this.getEqualSpacingPosition(index, count);
    }
  }

  /**
   * Get position using rule of thirds
   */
  private getRuleOfThirdsPosition(index: number, total: number): PlacementPosition {
    const thirds = [1 / 3, 0.5, 2 / 3];
    const yBase = 0.7;

    if (total === 1) {
      return { x: 0.5, y: yBase };
    }

    if (total === 2) {
      return { x: thirds[index], y: yBase };
    }

    if (total === 3) {
      return { x: thirds[index], y: yBase };
    }

    // For more characters, distribute horizontally
    const spacing = 1 / (total + 1);
    return {
      x: spacing * (index + 1),
      y: yBase + (index % 2) * 0.1,
    };
  }

  /**
   * Get position using golden ratio
   */
  private getGoldenRatioPosition(index: number, total: number): PlacementPosition {
    const yBase = 0.6;
    
    if (total === 1) {
      return { x: 0.5, y: yBase };
    }

    const angle = (index / total) * Math.PI * 2;
    const radius = 0.3;

    return {
      x: 0.5 + Math.cos(angle) * radius,
      y: yBase + Math.sin(angle) * radius * 0.5,
    };
  }

  /**
   * Get centered position
   */
  private getCenterPosition(index: number, total: number): PlacementPosition {
    if (total === 1) {
      return { x: 0.5, y: 0.7 };
    }

    const spacing = 0.1;
    const startX = 0.5 - ((total - 1) * spacing) / 2;

    return {
      x: startX + index * spacing,
      y: 0.7,
    };
  }

  /**
   * Get clustered position
   */
  private getClusterPosition(index: number): PlacementPosition {
    // Cluster around center with slight offset
    const offset = 0.08;
    const angle = (index / 6) * Math.PI * 2;

    return {
      x: 0.5 + Math.cos(angle) * offset,
      y: 0.7 + Math.sin(angle) * offset * 0.3,
    };
  }

  /**
   * Get opposing positions (e.g., for dialogue)
   */
  private getOpposingPosition(index: number, total: number): PlacementPosition {
    const side = index % 2 === 0 ? 'left' : 'right';
    const xPos = side === 'left' ? 0.3 : 0.7;
    const yOffset = Math.floor(index / 2) * 0.15;

    return {
      x: xPos,
      y: 0.6 + yOffset,
    };
  }

  /**
   * Get equal spacing position
   */
  private getEqualSpacingPosition(index: number, total: number): PlacementPosition {
    const spacing = 1 / (total + 1);
    return {
      x: spacing * (index + 1),
      y: 0.7,
    };
  }

  /**
   * Apply equal spacing layout
   */
  private applyEqualSpacing(characters: CharacterPlacement[]): void {
    const spacing = 1 / (characters.length + 1);

    characters.forEach((char, index) => {
      char.position.x = spacing * (index + 1);
      this.emit('positionChanged', char);
    });
  }

  /**
   * Apply golden ratio layout
   */
  private applyGoldenRatio(characters: CharacterPlacement[]): void {
    const baseX = 1 / GOLDEN_RATIO;
    const baseY = 1 / GOLDEN_RATIO;

    characters.forEach((char, index) => {
      const offset = index * 0.05;
      char.position.x = baseX + offset;
      char.position.y = baseY + offset * 0.5;
      this.emit('positionChanged', char);
    });
  }

  /**
   * Apply rule of thirds layout
   */
  private applyRuleOfThirds(characters: CharacterPlacement[]): void {
    characters.forEach((char, index) => {
      const position = this.getRuleOfThirdsPosition(index, characters.length);
      char.position = position;
      this.emit('positionChanged', char);
    });
  }

  /**
   * Apply center layout
   */
  private applyCenter(characters: CharacterPlacement[]): void {
    characters.forEach((char, index) => {
      const position = this.getCenterPosition(index, characters.length);
      char.position = position;
      this.emit('positionChanged', char);
    });
  }

  /**
   * Apply cluster layout
   */
  private applyCluster(characters: CharacterPlacement[]): void {
    characters.forEach((char, index) => {
      const position = this.getClusterPosition(index);
      char.position = position;
      this.emit('positionChanged', char);
    });
  }

  /**
   * Apply opposing layout
   */
  private applyOpposing(characters: CharacterPlacement[]): void {
    characters.forEach((char, index) => {
      const position = this.getOpposingPosition(index, characters.length);
      char.position = position;
      this.emit('positionChanged', char);
    });
  }

  /**
   * Calculate character scale
   */
  private calculateScale(character: SceneCharacter, position: PlacementPosition): number {
    const { scaleConfig } = this.config;

    let scale = scaleConfig.base;

    // Distance-based scaling (characters further back are smaller)
    if (scaleConfig.distanceScaling) {
      const distanceFromCenter = Math.abs(position.y - 0.5);
      scale *= 1 - distanceFromCenter * 0.3;
    }

    // Clamp to bounds
    return Math.max(scaleConfig.min, Math.min(scaleConfig.max, scale));
  }

  /**
   * Calculate Z-layer for character
   */
  private calculateLayer(character: SceneCharacter): number {
    const { zLayers, canvasHeight } = this.config;

    // Base layer for characters
    let layer = zLayers.characters;

    // Adjust based on vertical position (higher Y = closer = higher layer)
    const positionFactor = (character.position.y - 0.3) / 0.7; // Normalize to 0-1 range
    layer += positionFactor * (zLayers.foreground - zLayers.background);

    return Math.round(layer);
  }

  /**
   * Sort placements by layer for proper rendering order
   */
  getRenderOrder(): CharacterPlacement[] {
    return this.getAllPlacements().sort((a, b) => {
      // First sort by layer
      if (a.layer !== b.layer) {
        return a.layer - b.layer;
      }
      // Then by x position (left to right)
      return a.position.x - b.position.x;
    });
  }

  /**
   * Clear all placements
   */
  clear(): void {
    this.placements.clear();
  }

  /**
   * Update configuration
   */
  configure(config: Partial<CharacterPlacementConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): Readonly<CharacterPlacementConfig> {
    return { ...this.config };
  }

  /**
   * Subscribe to placement events
   */
  on(callback: (placement: CharacterPlacement) => void): () => void {
    return this.addEventListener('positionChanged', callback);
  }

  /**
   * Add event listener
   */
  private addEventListener(event: string, callback: (placement: CharacterPlacement) => void): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);

    return () => {
      this.eventListeners.get(event)?.delete(callback);
    };
  }

  /**
   * Emit event to listeners
   */
  private emit(event: string, placement: CharacterPlacement): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(placement));
    }
  }

  /**
   * Easing function
   */
  private easeInOutQuad(t: number): number {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }
}

export default CharacterPlacementManager;
