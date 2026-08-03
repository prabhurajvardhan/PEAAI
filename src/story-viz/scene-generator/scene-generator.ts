/**
 * Scene Generator
 * 
 * Generates scene content from parsed story data for visualization.
 * 
 * Features:
 * - Character data generation
 * - Environment data generation
 * - Action data generation
 * - Emotion data generation
 */

import { IPosition, IColor } from '../../graphics/types';
import type {
  ParsedScene,
  ParsedStory,
} from '../parser/types';
import type {
  SceneCharacter,
  SceneEnvironment,
  SceneAction,
  SceneEmotion,
  GeneratedScene,
  GeneratedCamera,
  SceneGeneratorConfig,
  SceneGeneratorResult,
  CharacterExpression,
  CharacterAnimation,
  BackgroundData,
  WeatherData,
  LightingData,
  AtmosphereData,
  TransitionConfig,
} from './types';

/**
 * Default emotion to expression mapping
 */
const DEFAULT_EMOTION_MAPPING: Record<string, CharacterExpression> = {
  neutral: {
    eyeOpenness: 1,
    pupilDirection: { x: 0, y: 0 },
    mouthOpenness: 0,
    mouthCurve: 0,
    eyebrowAngle: 0,
    cheekRaise: 0,
  },
  happy: {
    eyeOpenness: 1,
    pupilDirection: { x: 0, y: 0 },
    mouthOpenness: 0.3,
    mouthCurve: 0.8,
    eyebrowAngle: 0,
    cheekRaise: 0.5,
  },
  sad: {
    eyeOpenness: 0.8,
    pupilDirection: { x: 0, y: 0.2 },
    mouthOpenness: 0.1,
    mouthCurve: -0.6,
    eyebrowAngle: 0.3,
    cheekRaise: 0,
  },
  angry: {
    eyeOpenness: 1,
    pupilDirection: { x: 0, y: 0 },
    mouthOpenness: 0.2,
    mouthCurve: -0.4,
    eyebrowAngle: -0.5,
    cheekRaise: 0,
  },
  surprised: {
    eyeOpenness: 1.2,
    pupilDirection: { x: 0, y: 0 },
    mouthOpenness: 0.8,
    mouthCurve: 0,
    eyebrowAngle: 0.5,
    cheekRaise: 0,
  },
  fearful: {
    eyeOpenness: 1.1,
    pupilDirection: { x: 0, y: 0 },
    mouthOpenness: 0.4,
    mouthCurve: 0,
    eyebrowAngle: 0.6,
    cheekRaise: 0,
  },
  thoughtful: {
    eyeOpenness: 0.9,
    pupilDirection: { x: 0, y: -0.2 },
    mouthOpenness: 0.1,
    mouthCurve: 0,
    eyebrowAngle: 0.2,
    cheekRaise: 0,
  },
  confused: {
    eyeOpenness: 1,
    pupilDirection: { x: 0.2, y: 0 },
    mouthOpenness: 0.2,
    mouthCurve: 0,
    eyebrowAngle: 0.4,
    cheekRaise: 0,
  },
  excited: {
    eyeOpenness: 1.2,
    pupilDirection: { x: 0, y: 0 },
    mouthOpenness: 0.6,
    mouthCurve: 0.9,
    eyebrowAngle: 0.2,
    cheekRaise: 0.8,
  },
};

/**
 * Default scene generator configuration
 */
const DEFAULT_CONFIG: SceneGeneratorConfig = {
  canvasWidth: 1920,
  canvasHeight: 1080,
  defaultScale: 1,
  defaultLayer: 0,
  emotionMapping: DEFAULT_EMOTION_MAPPING,
};

/**
 * Scene Generator class
 */
export class SceneGenerator {
  private config: SceneGeneratorConfig;
  private characterMap: Map<string, SceneCharacter>;

  constructor(config: Partial<SceneGeneratorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.characterMap = new Map();
  }

  /**
   * Generate scenes from parsed story
   */
  generate(parsedStory: ParsedStory): SceneGeneratorResult {
    this.characterMap.clear();
    const scenes: GeneratedScene[] = [];
    let totalDuration = 0;

    // First pass: create character definitions
    for (const characterName of parsedStory.characters) {
      this.createCharacter(characterName);
    }

    // Generate scenes
    for (const parsedScene of parsedStory.scenes) {
      const generatedScene = this.generateScene(parsedScene);
      scenes.push(generatedScene);
      totalDuration += generatedScene.duration;
    }

    return {
      scenes,
      characters: new Map(this.characterMap),
      totalDuration,
    };
  }

  /**
   * Generate a single scene from parsed data
   */
  generateScene(parsedScene: ParsedScene): GeneratedScene {
    const characters = this.generateCharacters(parsedScene);
    const environment = this.generateEnvironment(parsedScene);
    const actions = this.generateActions(parsedScene, characters);
    const emotion = this.generateEmotion(parsedScene);
    const camera = this.generateCamera(parsedScene);
    const duration = parsedScene.metadata.duration ?? 3000;

    return {
      id: parsedScene.id,
      sceneNumber: parsedScene.metadata.sceneNumber,
      characters,
      environment,
      actions,
      emotion,
      camera,
      duration,
      transitionIn: this.generateTransitionIn(parsedScene),
      transitionOut: this.generateTransitionOut(parsedScene),
    };
  }

  /**
   * Create a character definition
   */
  private createCharacter(name: string): SceneCharacter {
    const id = `char-${name.toLowerCase().replace(/\s+/g, '-')}`;
    
    const character: SceneCharacter = {
      id,
      name,
      position: this.getDefaultPosition(this.characterMap.size),
      scale: this.config.defaultScale,
      layer: this.config.defaultLayer + this.characterMap.size,
      expression: { ...DEFAULT_EMOTION_MAPPING.neutral },
      emotion: 'neutral',
      speaking: false,
      animations: this.getDefaultAnimations(),
    };

    this.characterMap.set(id, character);
    return character;
  }

  /**
   * Get default position for character based on index
   */
  private getDefaultPosition(index: number): IPosition {
    const positions = [
      { x: 0.3, y: 0.7 },
      { x: 0.5, y: 0.7 },
      { x: 0.7, y: 0.7 },
      { x: 0.2, y: 0.7 },
      { x: 0.8, y: 0.7 },
    ];

    return positions[index % positions.length];
  }

  /**
   * Get default animations for character
   */
  private getDefaultAnimations(): CharacterAnimation[] {
    return [
      { type: 'idle', duration: 1000, loop: true },
    ];
  }

  /**
   * Generate characters for a scene
   */
  private generateCharacters(parsedScene: ParsedScene): SceneCharacter[] {
    const characters: SceneCharacter[] = [];

    for (const extractedChar of parsedScene.characters) {
      let character = this.characterMap.get(
        `char-${extractedChar.name.toLowerCase().replace(/\s+/g, '-')}`
      );

      if (!character) {
        character = this.createCharacter(extractedChar.name);
      }

      // Update character with scene-specific data
      const updatedCharacter: SceneCharacter = {
        ...character,
        emotion: extractedChar.emotion || character.emotion,
        speaking: extractedChar.speaking || false,
        expression: this.emotionToExpression(extractedChar.emotion),
        animations: this.generateCharacterAnimations(extractedChar),
      };

      characters.push(updatedCharacter);
    }

    return characters;
  }

  /**
   * Map emotion to expression
   */
  private emotionToExpression(emotion: string): CharacterExpression {
    const mappedEmotion = emotion.toLowerCase();
    return this.config.emotionMapping[mappedEmotion] || 
           this.config.emotionMapping.neutral;
  }

  /**
   * Generate character animations based on extracted data
   */
  private generateCharacterAnimations(
    extractedChar: { speaking?: boolean; emotion?: string }
  ): CharacterAnimation[] {
    const animations: CharacterAnimation[] = [];

    // Idle animation
    animations.push({
      type: 'idle',
      duration: 1000,
      loop: true,
    });

    // Speaking animation if character is speaking
    if (extractedChar.speaking) {
      animations.push({
        type: 'talk',
        duration: 500,
        loop: true,
      });
    }

    // React based on emotion
    if (extractedChar.emotion) {
      animations.push({
        type: 'react',
        duration: 300,
        loop: false,
      });
    }

    return animations;
  }

  /**
   * Generate environment data
   */
  private generateEnvironment(parsedScene: ParsedScene): SceneEnvironment {
    const { environment: env } = parsedScene;
    const background = this.generateBackground(env.location, env.timeOfDay);

    return {
      location: env.location,
      timeOfDay: env.timeOfDay,
      background,
      backgrounds: [background],
      weather: this.generateWeather(env.weather),
      lighting: this.generateLighting(env.lighting, env.timeOfDay),
      atmosphere: this.generateAtmosphere(env.mood),
      parallaxLayers: [],
    };
  }

  /**
   * Generate background data
   */
  private generateBackground(location: string, timeOfDay: string): BackgroundData {
    const locationColors: Record<string, IColor> = {
      forest: { r: 34, g: 85, b: 34, a: 1 },
      beach: { r: 238, g: 214, b: 175, a: 1 },
      city: { r: 64, g: 64, b: 64, a: 1 },
      room: { r: 139, g: 119, b: 101, a: 1 },
      garden: { r: 107, g: 142, b: 35, a: 1 },
      mountain: { r: 105, g: 105, b: 105, a: 1 },
      road: { r: 85, g: 85, b: 85, a: 1 },
      unknown: { r: 128, g: 128, b: 128, a: 1 },
    };

    const timeColors: Record<string, IColor> = {
      dawn: { r: 255, g: 160, b: 122, a: 1 },
      morning: { r: 255, g: 255, b: 224, a: 1 },
      midday: { r: 255, g: 255, b: 255, a: 1 },
      evening: { r: 255, g: 140, b: 0, a: 1 },
      night: { r: 25, g: 25, b: 112, a: 1 },
      daytime: { r: 255, g: 255, b: 255, a: 1 },
    };

    return {
      spriteId: `bg-${location}`,
      parallax: 1,
      color: locationColors[location] || locationColors.unknown,
      gradient: {
        type: 'linear',
        colors: [
          { color: timeColors[timeOfDay] || timeColors.daytime, position: 0 },
          { color: locationColors[location] || locationColors.unknown, position: 1 },
        ],
        angle: 90,
      },
    };
  }

  /**
   * Generate weather data
   */
  private generateWeather(weather: string): WeatherData {
    const weatherConfigs: Record<string, Omit<WeatherData, 'type'>> = {
      sunny: {
        intensity: 0,
        direction: { x: 0, y: -1 },
        particles: { count: 0, speed: 0, size: 0, opacity: 0 },
      },
      cloudy: {
        intensity: 0.3,
        direction: { x: 0, y: 0 },
        particles: { count: 0, speed: 0, size: 0, opacity: 0 },
      },
      rainy: {
        intensity: 0.8,
        direction: { x: 0.2, y: 1 },
        particles: { count: 100, speed: 5, size: 2, opacity: 0.6 },
      },
      snowy: {
        intensity: 0.6,
        direction: { x: 0.1, y: 0.8 },
        particles: { count: 80, speed: 2, size: 4, opacity: 0.8 },
      },
      foggy: {
        intensity: 0.5,
        direction: { x: 0, y: 0 },
        particles: { count: 50, speed: 0.5, size: 8, opacity: 0.3 },
      },
      windy: {
        intensity: 0.7,
        direction: { x: 1, y: 0.2 },
        particles: { count: 20, speed: 8, size: 1, opacity: 0.4 },
      },
      clear: {
        intensity: 0,
        direction: { x: 0, y: -1 },
        particles: { count: 0, speed: 0, size: 0, opacity: 0 },
      },
    };

    const config = weatherConfigs[weather] || weatherConfigs.clear;
    return { type: weather as WeatherData['type'], ...config };
  }

  /**
   * Generate lighting data
   */
  private generateLighting(lighting: string, timeOfDay: string): LightingData {
    const ambientLevels: Record<string, number> = {
      bright: 1,
      dim: 0.5,
      dark: 0.2,
      warm: 0.8,
      cold: 0.6,
      natural: 0.7,
    };

    const lightingColors: Record<string, IColor> = {
      bright: { r: 255, g: 255, b: 255, a: 1 },
      dim: { r: 180, g: 180, b: 180, a: 1 },
      dark: { r: 50, g: 50, b: 70, a: 1 },
      warm: { r: 255, g: 200, b: 100, a: 1 },
      cold: { r: 200, g: 220, b: 255, a: 1 },
      natural: { r: 255, g: 255, b: 255, a: 1 },
    };

    const timeDirections: Record<string, IPosition> = {
      dawn: { x: -0.5, y: -0.5 },
      morning: { x: -0.3, y: -0.8 },
      midday: { x: 0, y: -1 },
      evening: { x: 0.5, y: -0.5 },
      night: { x: 0, y: 0 },
      daytime: { x: 0, y: -1 },
    };

    return {
      ambient: ambientLevels[lighting] ?? 0.7,
      direction: timeDirections[timeOfDay] || { x: 0, y: -1 },
      color: lightingColors[lighting] || lightingColors.natural,
      shadows: lighting !== 'bright' && lighting !== 'dark',
      highlights: lighting === 'bright' || lighting === 'warm',
    };
  }

  /**
   * Generate atmosphere data
   */
  private generateAtmosphere(mood: string): AtmosphereData {
    const moodColors: Record<string, IColor> = {
      tense: { r: 100, g: 50, b: 50, a: 0.3 },
      calm: { r: 100, g: 150, b: 200, a: 0.2 },
      joyful: { r: 255, g: 220, b: 100, a: 0.3 },
      melancholy: { r: 80, g: 80, b: 120, a: 0.3 },
      mysterious: { r: 60, g: 40, b: 80, a: 0.4 },
      adventurous: { r: 150, g: 100, b: 50, a: 0.2 },
      romantic: { r: 255, g: 150, b: 180, a: 0.3 },
      dark: { r: 30, g: 30, b: 40, a: 0.5 },
    };

    return {
      mood,
      color: moodColors[mood] || { r: 128, g: 128, b: 128, a: 0.2 },
      blur: mood === 'mysterious' ? 2 : 0,
      vignette: mood === 'dark' || mood === 'mysterious' ? 0.5 : 0.2,
      grain: mood === 'tense' || mood === 'dark' ? 0.1 : 0,
    };
  }

  /**
   * Generate actions for scene
   */
  private generateActions(
    parsedScene: ParsedScene,
    characters: SceneCharacter[]
  ): SceneAction[] {
    const actions: SceneAction[] = [];

    for (const extractedAction of parsedScene.actions) {
      const character = characters.find(
        c => c.name.toLowerCase() === extractedAction.character.toLowerCase()
      );

      if (character) {
        actions.push({
          id: `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          characterId: character.id,
          type: this.actionVerbToType(extractedAction.action),
          description: extractedAction.action,
          duration: 1000,
          easing: 'easeInOutQuad',
          keyframes: [],
        });
      }
    }

    return actions;
  }

  /**
   * Convert action verb to action type
   */
  private actionVerbToType(verb: string): SceneAction['type'] {
    const verbLower = verb.toLowerCase();
    
    if (['walked', 'ran', 'moved'].includes(verbLower)) return 'move';
    if (['said', 'asked', 'replied', 'shouted', 'whispered'].includes(verbLower)) return 'speak';
    if (['smiled', 'laughed', 'cried', 'nodded'].includes(verbLower)) return 'react';
    if (['entered', 'arrived'].includes(verbLower)) return 'enter';
    if (['left', 'departed'].includes(verbLower)) return 'exit';
    if (['pointed', 'waved', 'reached'].includes(verbLower)) return 'gesture';
    
    return 'react';
  }

  /**
   * Generate emotion data
   */
  private generateEmotion(parsedScene: ParsedScene): SceneEmotion {
    const emotion = parsedScene.metadata.emotion;
    
    return {
      primary: emotion,
      intensity: 0.5,
      transition: {
        duration: 500,
        easing: 'easeInOutQuad',
        blend: true,
      },
    };
  }

  /**
   * Generate camera configuration
   */
  private generateCamera(parsedScene: ParsedScene): GeneratedCamera {
    const { camera } = parsedScene;

    let zoom = 1;
    let position: IPosition = { x: 0.5, y: 0.5 };

    switch (camera.type) {
      case 'zoom':
        zoom = camera.zoomLevel ?? 1;
        break;
      case 'pan':
        if (camera.direction === 'left') position = { x: 0.3, y: 0.5 };
        if (camera.direction === 'right') position = { x: 0.7, y: 0.5 };
        if (camera.direction === 'up') position = { x: 0.5, y: 0.3 };
        if (camera.direction === 'down') position = { x: 0.5, y: 0.7 };
        break;
    }

    return {
      position,
      zoom,
      rotation: 0,
      easing: 'easeInOutQuad',
      duration: camera.duration ?? 500,
    };
  }

  /**
   * Generate transition in configuration
   */
  private generateTransitionIn(parsedScene: ParsedScene): TransitionConfig {
    const type = parsedScene.metadata.transitionType || 'cut';
    
    const durations: Record<string, number> = {
      cut: 0,
      fade: 500,
      dissolve: 800,
      wipe: 400,
      blur: 600,
    };

    return {
      type,
      duration: durations[type] ?? 0,
      easing: 'easeInOutQuad',
    };
  }

  /**
   * Generate transition out configuration
   */
  private generateTransitionOut(parsedScene: ParsedScene): TransitionConfig {
    const type = parsedScene.metadata.transitionType || 'cut';
    
    return {
      type,
      duration: type === 'cut' ? 0 : 300,
      easing: 'easeInOutQuad',
    };
  }

  /**
   * Update generator configuration
   */
  configure(config: Partial<SceneGeneratorConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): Readonly<SceneGeneratorConfig> {
    return { ...this.config };
  }

  /**
   * Get all registered characters
   */
  getCharacters(): Map<string, SceneCharacter> {
    return new Map(this.characterMap);
  }
}

export default SceneGenerator;
