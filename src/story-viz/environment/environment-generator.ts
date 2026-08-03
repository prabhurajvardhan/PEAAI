/**
 * Environment Generator
 * 
 * Generates environment visuals for story scenes including backgrounds,
 * weather effects, lighting, and atmosphere.
 * 
 * Features:
 * - Background sprite generation
 * - Weather effects (rain, snow, fog, etc.)
 * - Lighting system with shadows and highlights
 * - Atmospheric effects (blur, vignette, grain)
 */

import { IColor, IPosition } from '../../graphics/types';
import type {
  LocationType,
  TimeOfDay,
  WeatherType,
  LightingType,
  AtmosphereMood,
  BackgroundLayer,
  WeatherEffect,
  WeatherParticle,
  LightingEffect,
  AtmosphereEffect,
  EnvironmentData,
  ParallaxLayer,
  EnvironmentGeneratorConfig,
  EnvironmentPreset,
  ShadowConfig,
  HighlightConfig,
  ColorGradeConfig,
  VignetteConfig,
  GrainConfig,
  DepthOfFieldConfig,
} from './types';

/**
 * Default environment configuration
 */
const DEFAULT_CONFIG: EnvironmentGeneratorConfig = {
  canvasWidth: 1920,
  canvasHeight: 1080,
  pixelScale: 1,
  backgroundColor: { r: 128, g: 128, b: 128, a: 1 },
  defaultTimeOfDay: 'daytime' as TimeOfDay,
  defaultWeather: 'clear',
  enableParallax: true,
  enableAtmosphere: true,
  enableWeather: true,
  enableLighting: true,
};

/**
 * Location color palettes
 */
const LOCATION_PALETTES: Record<LocationType, { sky: IColor; ground: IColor; accent: IColor }> = {
  forest: { sky: { r: 135, g: 206, b: 235, a: 1 }, ground: { r: 34, g: 85, b: 34, a: 1 }, accent: { r: 139, g: 90, b: 43, a: 1 } },
  beach: { sky: { r: 135, g: 206, b: 250, a: 1 }, ground: { r: 238, g: 214, b: 175, a: 1 }, accent: { r: 70, g: 130, b: 180, a: 1 } },
  city: { sky: { r: 100, g: 100, b: 120, a: 1 }, ground: { r: 64, g: 64, b: 64, a: 1 }, accent: { r: 200, g: 200, b: 100, a: 1 } },
  room: { sky: { r: 180, g: 160, b: 140, a: 1 }, ground: { r: 139, g: 119, b: 101, a: 1 }, accent: { r: 210, g: 180, b: 140, a: 1 } },
  garden: { sky: { r: 135, g: 206, b: 235, a: 1 }, ground: { r: 107, g: 142, b: 35, a: 1 }, accent: { r: 255, g: 182, b: 193, a: 1 } },
  mountain: { sky: { r: 176, g: 196, b: 222, a: 1 }, ground: { r: 105, g: 105, b: 105, a: 1 }, accent: { r: 200, g: 200, b: 200, a: 1 } },
  road: { sky: { r: 135, g: 206, b: 235, a: 1 }, ground: { r: 85, g: 85, b: 85, a: 1 }, accent: { r: 255, g: 255, b: 224, a: 1 } },
  cave: { sky: { r: 30, g: 30, b: 40, a: 1 }, ground: { r: 60, g: 60, b: 70, a: 1 }, accent: { r: 100, g: 80, b: 60, a: 1 } },
  castle: { sky: { r: 70, g: 70, b: 90, a: 1 }, ground: { r: 100, g: 100, b: 100, a: 1 }, accent: { r: 180, g: 180, b: 200, a: 1 } },
  space: { sky: { r: 0, g: 0, b: 20, a: 1 }, ground: { r: 10, g: 10, b: 30, a: 1 }, accent: { r: 255, g: 255, b: 255, a: 1 } },
  underwater: { sky: { r: 0, g: 50, b: 100, a: 1 }, ground: { r: 0, g: 30, b: 60, a: 1 }, accent: { r: 100, g: 200, b: 255, a: 1 } },
  unknown: { sky: { r: 128, g: 128, b: 128, a: 1 }, ground: { r: 100, g: 100, b: 100, a: 1 }, accent: { r: 150, g: 150, b: 150, a: 1 } },
};

/**
 * Time of day lighting configurations
 */
const TIME_LIGHTING: Record<TimeOfDay, { ambient: number; color: IColor; direction: IPosition }> = {
  dawn: { ambient: 0.4, color: { r: 255, g: 160, b: 122, a: 1 }, direction: { x: -0.5, y: -0.5 } },
  morning: { ambient: 0.7, color: { r: 255, g: 255, b: 224, a: 1 }, direction: { x: -0.3, y: -0.8 } },
  midday: { ambient: 1.0, color: { r: 255, g: 255, b: 255, a: 1 }, direction: { x: 0, y: -1 } },
  afternoon: { ambient: 0.8, color: { r: 255, g: 250, b: 205, a: 1 }, direction: { x: 0.3, y: -0.7 } },
  evening: { ambient: 0.5, color: { r: 255, g: 140, b: 0, a: 1 }, direction: { x: 0.5, y: -0.5 } },
  dusk: { ambient: 0.3, color: { r: 255, g: 100, b: 80, a: 1 }, direction: { x: 0.6, y: -0.4 } },
  night: { ambient: 0.2, color: { r: 100, g: 100, b: 150, a: 1 }, direction: { x: 0, y: 0.2 } },
  midnight: { ambient: 0.1, color: { r: 50, g: 50, b: 100, a: 1 }, direction: { x: 0, y: 0.3 } },
};

/**
 * Mood color overlays
 */
const MOOD_COLORS: Record<AtmosphereMood, IColor> = {
  tense: { r: 100, g: 30, b: 30, a: 0.3 },
  calm: { r: 100, g: 150, b: 200, a: 0.2 },
  joyful: { r: 255, g: 220, b: 100, a: 0.25 },
  melancholy: { r: 80, g: 80, b: 120, a: 0.25 },
  mysterious: { r: 60, g: 40, b: 80, a: 0.35 },
  adventurous: { r: 150, g: 100, b: 50, a: 0.2 },
  romantic: { r: 255, g: 150, b: 180, a: 0.25 },
  dark: { r: 20, g: 20, b: 30, a: 0.4 },
  neutral: { r: 128, g: 128, b: 128, a: 0.1 },
};

/**
 * Weather configurations
 */
const WEATHER_CONFIGS: Record<WeatherType, { particleCount: number; speed: number; size: number; colors: IColor[] }> = {
  clear: { particleCount: 0, speed: 0, size: 0, colors: [] },
  sunny: { particleCount: 20, speed: 0.2, size: 2, colors: [{ r: 255, g: 255, b: 200, a: 0.5 }] },
  cloudy: { particleCount: 0, speed: 0, size: 0, colors: [] },
  rainy: { particleCount: 150, speed: 8, size: 2, colors: [{ r: 180, g: 200, b: 255, a: 0.6 }] },
  stormy: { particleCount: 200, speed: 12, size: 3, colors: [{ r: 150, g: 170, b: 200, a: 0.7 }, { r: 100, g: 100, b: 120, a: 0.8 }] },
  snowy: { particleCount: 100, speed: 2, size: 4, colors: [{ r: 255, g: 255, b: 255, a: 0.8 }] },
  foggy: { particleCount: 50, speed: 0.3, size: 20, colors: [{ r: 200, g: 200, b: 200, a: 0.3 }] },
  windy: { particleCount: 30, speed: 15, size: 1, colors: [{ r: 200, g: 200, b: 180, a: 0.4 }] },
};

/**
 * Environment Generator class
 */
export class EnvironmentGenerator {
  private config: EnvironmentGeneratorConfig;
  private weatherParticles: WeatherParticle[] = [];
  private animationId: number | null = null;
  private isAnimating: boolean = false;

  constructor(config: Partial<EnvironmentGeneratorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Generate complete environment data
   */
  generate(
    location: LocationType,
    timeOfDay: TimeOfDay,
    weather: WeatherType,
    mood: AtmosphereMood = 'neutral'
  ): EnvironmentData {
    return {
      location,
      timeOfDay,
      backgrounds: this.generateBackgrounds(location, timeOfDay),
      weather: this.generateWeather(weather),
      lighting: this.generateLighting(timeOfDay),
      atmosphere: this.generateAtmosphere(mood),
      parallaxLayers: this.generateParallaxLayers(location),
    };
  }

  /**
   * Generate background layers
   */
  private generateBackgrounds(location: LocationType, timeOfDay: TimeOfDay): BackgroundLayer[] {
    const palette = LOCATION_PALETTES[location] || LOCATION_PALETTES.unknown;
    const timeLighting = TIME_LIGHTING[timeOfDay] || TIME_LIGHTING.midday;

    return [
      {
        id: 'bg-sky',
        spriteId: `sky-${timeOfDay}`,
        parallax: 0,
        offset: { x: 0, y: 0 },
        opacity: 1,
        scale: 1,
        color: this.blendColors(palette.sky, timeLighting.color, 0.5),
      },
      {
        id: 'bg-mid',
        spriteId: `mid-${location}`,
        parallax: 0.3,
        offset: { x: 0, y: 0 },
        opacity: 0.8,
        scale: 1,
        color: palette.ground,
      },
      {
        id: 'bg-fore',
        spriteId: `fore-${location}`,
        parallax: 0.6,
        offset: { x: 0, y: 0 },
        opacity: 0.9,
        scale: 1,
        color: palette.accent,
      },
    ];
  }

  /**
   * Generate weather effect
   */
  private generateWeather(type: WeatherType): WeatherEffect {
    const weatherConfig = WEATHER_CONFIGS[type] || WEATHER_CONFIGS.clear;
    const particles = this.createWeatherParticles(weatherConfig);

    return {
      type,
      intensity: this.getWeatherIntensity(type),
      direction: this.getWeatherDirection(type),
      particles,
      colors: weatherConfig.colors,
    };
  }

  /**
   * Create weather particles
   */
  private createWeatherParticles(config: { particleCount: number; speed: number; size: number; colors: IColor[] }): WeatherParticle[] {
    const particles: WeatherParticle[] = [];

    for (let i = 0; i < config.particleCount; i++) {
      particles.push({
        x: Math.random() * this.config.canvasWidth,
        y: Math.random() * this.config.canvasHeight,
        vx: config.speed * (0.5 + Math.random()),
        vy: config.speed * (0.5 + Math.random()),
        size: config.size * (0.8 + Math.random() * 0.4),
        opacity: config.colors[0]?.a || 0.5,
        active: true,
      });
    }

    return particles;
  }

  /**
   * Get weather intensity based on type
   */
  private getWeatherIntensity(type: WeatherType): number {
    const intensities: Record<WeatherType, number> = {
      clear: 0,
      sunny: 0.2,
      cloudy: 0.3,
      rainy: 0.7,
      stormy: 1.0,
      snowy: 0.6,
      foggy: 0.5,
      windy: 0.4,
    };
    return intensities[type] || 0;
  }

  /**
   * Get weather direction based on type
   */
  private getWeatherDirection(type: WeatherType): IPosition {
    const directions: Record<WeatherType, IPosition> = {
      clear: { x: 0, y: 0 },
      sunny: { x: 0, y: -1 },
      cloudy: { x: 0.1, y: 0 },
      rainy: { x: 0.2, y: 1 },
      stormy: { x: 0.5, y: 1 },
      snowy: { x: 0.1, y: 0.8 },
      foggy: { x: 0.3, y: 0.1 },
      windy: { x: 1, y: 0.2 },
    };
    return directions[type] || { x: 0, y: 0 };
  }

  /**
   * Generate lighting effect
   */
  private generateLighting(timeOfDay: TimeOfDay): LightingEffect {
    const timeConfig = TIME_LIGHTING[timeOfDay] || TIME_LIGHTING.midday;

    return {
      type: this.getLightingType(timeOfDay),
      ambient: timeConfig.ambient,
      color: timeConfig.color,
      direction: timeConfig.direction,
      shadows: this.generateShadows(timeOfDay),
      highlights: this.generateHighlights(timeOfDay),
      colorGrade: this.generateColorGrade(timeOfDay),
    };
  }

  /**
   * Get lighting type from time of day
   */
  private getLightingType(timeOfDay: TimeOfDay): LightingType {
    const types: Record<TimeOfDay, LightingType> = {
      dawn: 'warm',
      morning: 'natural',
      midday: 'bright',
      afternoon: 'natural',
      evening: 'warm',
      dusk: 'dramatic',
      night: 'dark',
      midnight: 'dark',
    };
    return types[timeOfDay] || 'natural';
  }

  /**
   * Generate shadow configuration
   */
  private generateShadows(timeOfDay: TimeOfDay): ShadowConfig {
    const isDark = ['night', 'midnight', 'dusk'].includes(timeOfDay);

    return {
      enabled: !isDark,
      intensity: isDark ? 0.1 : 0.4,
      blur: 4,
      offset: { x: 2, y: 2 },
      color: { r: 0, g: 0, b: 0, a: 0.5 },
    };
  }

  /**
   * Generate highlight configuration
   */
  private generateHighlights(timeOfDay: TimeOfDay): HighlightConfig {
    const isBright = ['midday', 'morning', 'afternoon'].includes(timeOfDay);

    return {
      enabled: isBright,
      intensity: isBright ? 0.3 : 0.1,
      size: 8,
      color: { r: 255, g: 255, b: 255, a: 0.5 },
      threshold: 0.8,
    };
  }

  /**
   * Generate color grading configuration
   */
  private generateColorGrade(timeOfDay: TimeOfDay): ColorGradeConfig {
    const grades: Record<TimeOfDay, Partial<ColorGradeConfig>> = {
      dawn: { shadows: { r: 50, g: 30, b: 30, a: 1 }, saturation: 0.9, temperature: 0.2 },
      morning: { shadows: { r: 40, g: 50, b: 70, a: 1 }, saturation: 1.0, temperature: 0 },
      midday: { shadows: { r: 50, g: 50, b: 50, a: 1 }, saturation: 1.0, temperature: 0 },
      afternoon: { shadows: { r: 50, g: 45, b: 40, a: 1 }, saturation: 1.0, temperature: 0.1 },
      evening: { shadows: { r: 40, g: 30, b: 50, a: 1 }, saturation: 0.9, temperature: -0.2 },
      dusk: { shadows: { r: 30, g: 20, b: 40, a: 1 }, saturation: 0.8, temperature: -0.3 },
      night: { shadows: { r: 20, g: 20, b: 40, a: 1 }, saturation: 0.7, temperature: -0.4 },
      midnight: { shadows: { r: 10, g: 10, b: 30, a: 1 }, saturation: 0.6, temperature: -0.5 },
    };

    const grade = grades[timeOfDay] || grades.midday;

    return {
      enabled: true,
      shadows: grade.shadows || { r: 50, g: 50, b: 50, a: 1 },
      midtones: { r: 128, g: 128, b: 128, a: 1 },
      highlights: { r: 255, g: 240, b: 220, a: 1 },
      saturation: grade.saturation || 1.0,
      contrast: 1.0,
      temperature: grade.temperature || 0,
      tint: 0,
    };
  }

  /**
   * Generate atmosphere effect
   */
  private generateAtmosphere(mood: AtmosphereMood): AtmosphereEffect {
    const moodColor = MOOD_COLORS[mood] || MOOD_COLORS.neutral;

    return {
      mood,
      colorOverlay: moodColor,
      blur: this.getMoodBlur(mood),
      vignette: this.generateVignette(mood),
      grain: this.generateGrain(mood),
      depthOfField: this.generateDepthOfField(),
    };
  }

  /**
   * Get blur amount based on mood
   */
  private getMoodBlur(mood: AtmosphereMood): number {
    const blurAmounts: Record<AtmosphereMood, number> = {
      tense: 0,
      calm: 0,
      joyful: 0,
      melancholy: 1,
      mysterious: 2,
      adventurous: 0,
      romantic: 1,
      dark: 0,
      neutral: 0,
    };
    return blurAmounts[mood] || 0;
  }

  /**
   * Generate vignette configuration
   */
  private generateVignette(mood: AtmosphereMood): VignetteConfig {
    const isDark = ['dark', 'mysterious', 'tense'].includes(mood);

    return {
      enabled: true,
      intensity: isDark ? 0.6 : 0.3,
      radius: 0.8,
      softness: 0.5,
      color: { r: 0, g: 0, b: 0, a: 1 },
    };
  }

  /**
   * Generate grain configuration
   */
  private generateGrain(mood: AtmosphereMood): GrainConfig {
    const isNoisy = ['tense', 'dark', 'mysterious'].includes(mood);

    return {
      enabled: isNoisy,
      intensity: isNoisy ? 0.15 : 0.05,
      size: 1,
      animated: true,
    };
  }

  /**
   * Generate depth of field configuration
   */
  private generateDepthOfField(): DepthOfFieldConfig {
    return {
      enabled: false,
      focalDistance: 0.5,
      focalRange: 0.3,
      blurAmount: 2,
      bokehSize: 4,
    };
  }

  /**
   * Generate parallax layers
   */
  private generateParallaxLayers(location: LocationType): ParallaxLayer[] {
    const layerConfigs: Record<LocationType, ParallaxLayer[]> = {
      forest: [
        { id: 'parallax-sky', depth: 0, sprites: ['clouds'], scrollFactor: 0.1, opacity: 0.8 },
        { id: 'parallax-mountains', depth: 0.2, sprites: ['mtn_far'], scrollFactor: 0.3, opacity: 0.6 },
        { id: 'parallax-trees', depth: 0.5, sprites: ['trees_mid'], scrollFactor: 0.5, opacity: 0.8 },
        { id: 'parallax-bushes', depth: 0.8, sprites: ['bushes'], scrollFactor: 0.8, opacity: 1 },
      ],
      beach: [
        { id: 'parallax-sky', depth: 0, sprites: ['sky'], scrollFactor: 0.1, opacity: 0.9 },
        { id: 'parallax-ocean', depth: 0.3, sprites: ['ocean'], scrollFactor: 0.3, opacity: 0.7 },
        { id: 'parallax-sand', depth: 0.7, sprites: ['sand'], scrollFactor: 0.7, opacity: 1 },
      ],
      city: [
        { id: 'parallax-sky', depth: 0, sprites: ['sky'], scrollFactor: 0.1, opacity: 0.5 },
        { id: 'parallax-buildings', depth: 0.4, sprites: ['bldg_far'], scrollFactor: 0.4, opacity: 0.7 },
        { id: 'parallax-street', depth: 0.8, sprites: ['street'], scrollFactor: 0.8, opacity: 1 },
      ],
      room: [
        { id: 'parallax-wall', depth: 0, sprites: ['wall'], scrollFactor: 0, opacity: 1 },
        { id: 'parallax-decor', depth: 0.5, sprites: ['decor'], scrollFactor: 0.3, opacity: 0.9 },
      ],
      garden: [
        { id: 'parallax-sky', depth: 0, sprites: ['sky'], scrollFactor: 0.1, opacity: 0.8 },
        { id: 'parallax-trees', depth: 0.3, sprites: ['trees'], scrollFactor: 0.3, opacity: 0.7 },
        { id: 'parallax-flowers', depth: 0.7, sprites: ['flowers'], scrollFactor: 0.6, opacity: 1 },
      ],
      mountain: [
        { id: 'parallax-sky', depth: 0, sprites: ['sky'], scrollFactor: 0.1, opacity: 0.9 },
        { id: 'parallax-peak', depth: 0.4, sprites: ['peak'], scrollFactor: 0.4, opacity: 0.8 },
        { id: 'parallax-rocks', depth: 0.7, sprites: ['rocks'], scrollFactor: 0.7, opacity: 1 },
      ],
      road: [
        { id: 'parallax-horizon', depth: 0.2, sprites: ['horizon'], scrollFactor: 0.2, opacity: 0.7 },
        { id: 'parallax-road', depth: 0.6, sprites: ['road'], scrollFactor: 0.6, opacity: 1 },
      ],
      cave: [
        { id: 'parallax-darkness', depth: 0, sprites: ['darkness'], scrollFactor: 0, opacity: 1 },
        { id: 'parallax-rocks', depth: 0.5, sprites: ['rocks'], scrollFactor: 0.3, opacity: 0.8 },
      ],
      castle: [
        { id: 'parallax-sky', depth: 0, sprites: ['sky'], scrollFactor: 0.1, opacity: 0.6 },
        { id: 'parallax-towers', depth: 0.3, sprites: ['towers'], scrollFactor: 0.3, opacity: 0.8 },
        { id: 'parallax-walls', depth: 0.7, sprites: ['walls'], scrollFactor: 0.6, opacity: 1 },
      ],
      space: [
        { id: 'parallax-stars', depth: 0, sprites: ['stars'], scrollFactor: 0.05, opacity: 1 },
        { id: 'parallax-nebula', depth: 0.2, sprites: ['nebula'], scrollFactor: 0.1, opacity: 0.7 },
        { id: 'parallax-planets', depth: 0.5, sprites: ['planets'], scrollFactor: 0.3, opacity: 0.9 },
      ],
      underwater: [
        { id: 'parallax-depth', depth: 0, sprites: ['deep'], scrollFactor: 0.1, opacity: 1 },
        { id: 'parallax-fish', depth: 0.4, sprites: ['fish'], scrollFactor: 0.4, opacity: 0.8 },
        { id: 'parallax-coral', depth: 0.7, sprites: ['coral'], scrollFactor: 0.6, opacity: 1 },
      ],
      unknown: [
        { id: 'parallax-bg', depth: 0, sprites: ['bg'], scrollFactor: 0.2, opacity: 1 },
      ],
    };

    return layerConfigs[location] || layerConfigs.unknown;
  }

  /**
   * Blend two colors together
   */
  private blendColors(color1: IColor, color2: IColor, ratio: number): IColor {
    return {
      r: Math.round(color1.r * (1 - ratio) + color2.r * ratio),
      g: Math.round(color1.g * (1 - ratio) + color2.g * ratio),
      b: Math.round(color1.b * (1 - ratio) + color2.b * ratio),
      a: 1,
    };
  }

  /**
   * Get preset environment
   */
  getPreset(presetName: string): EnvironmentData | null {
    const presets: Record<string, EnvironmentPreset> = {
      forest_morning: { name: 'Forest Morning', location: 'forest', timeOfDay: 'morning', weather: 'clear', lighting: 'natural', mood: 'calm' },
      forest_night: { name: 'Forest Night', location: 'forest', timeOfDay: 'night', weather: 'foggy', lighting: 'dark', mood: 'mysterious' },
      beach_sunset: { name: 'Beach Sunset', location: 'beach', timeOfDay: 'evening', weather: 'windy', lighting: 'warm', mood: 'romantic' },
      city_rain: { name: 'City Rain', location: 'city', timeOfDay: 'evening', weather: 'rainy', lighting: 'dramatic', mood: 'tense' },
      room_night: { name: 'Room Night', location: 'room', timeOfDay: 'night', weather: 'clear', lighting: 'dim', mood: 'calm' },
    };

    const preset = presets[presetName];
    if (!preset) return null;

    return this.generate(preset.location, preset.timeOfDay, preset.weather, preset.mood);
  }

  /**
   * Update weather particle positions
   */
  updateWeather(deltaTime: number): void {
    for (const particle of this.weatherParticles) {
      if (!particle.active) continue;

      particle.x += particle.vx * deltaTime * 0.1;
      particle.y += particle.vy * deltaTime * 0.1;

      // Wrap around screen
      if (particle.y > this.config.canvasHeight) {
        particle.y = -particle.size;
        particle.x = Math.random() * this.config.canvasWidth;
      }
      if (particle.x > this.config.canvasWidth) {
        particle.x = 0;
      }
      if (particle.x < 0) {
        particle.x = this.config.canvasWidth;
      }
    }
  }

  /**
   * Configure the generator
   */
  configure(config: Partial<EnvironmentGeneratorConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): Readonly<EnvironmentGeneratorConfig> {
    return { ...this.config };
  }
}

export default EnvironmentGenerator;
