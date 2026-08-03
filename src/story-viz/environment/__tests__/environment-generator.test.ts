/**
 * Environment Generator Tests
 */

import { EnvironmentGenerator } from '../environment-generator';
import type { LocationType, TimeOfDay, WeatherType, AtmosphereMood } from '../types';

describe('EnvironmentGenerator', () => {
  let envGenerator: EnvironmentGenerator;

  beforeEach(() => {
    envGenerator = new EnvironmentGenerator();
  });

  describe('generate', () => {
    it('should generate environment data', () => {
      const result = envGenerator.generate('forest', 'morning', 'clear', 'calm');
      
      expect(result).toBeDefined();
      expect(result.location).toBe('forest');
      expect(result.timeOfDay).toBe('morning');
    });

    it('should generate background layers', () => {
      const result = envGenerator.generate('forest', 'morning', 'clear');
      
      expect(result.backgrounds).toBeDefined();
      expect(result.backgrounds.length).toBeGreaterThan(0);
      expect(result.backgrounds[0]).toHaveProperty('id');
      expect(result.backgrounds[0]).toHaveProperty('parallax');
      expect(result.backgrounds[0]).toHaveProperty('color');
    });

    it('should generate weather effect', () => {
      const result = envGenerator.generate('forest', 'morning', 'rainy');
      
      expect(result.weather).toBeDefined();
      expect(result.weather.type).toBe('rainy');
      expect(result.weather.intensity).toBeGreaterThan(0);
    });

    it('should generate lighting effect', () => {
      const result = envGenerator.generate('forest', 'evening', 'clear');
      
      expect(result.lighting).toBeDefined();
      expect(result.lighting.type).toBeDefined();
      expect(result.lighting.ambient).toBeGreaterThan(0);
      expect(result.lighting.color).toBeDefined();
    });

    it('should generate atmosphere effect', () => {
      const result = envGenerator.generate('forest', 'morning', 'clear', 'mysterious');
      
      expect(result.atmosphere).toBeDefined();
      expect(result.atmosphere.mood).toBe('mysterious');
      expect(result.atmosphere.colorOverlay).toBeDefined();
    });

    it('should generate parallax layers', () => {
      const result = envGenerator.generate('beach', 'afternoon', 'clear');
      
      expect(result.parallaxLayers).toBeDefined();
      expect(result.parallaxLayers.length).toBeGreaterThan(0);
    });
  });

  describe('location variations', () => {
    const locations: LocationType[] = ['forest', 'beach', 'city', 'room', 'garden', 'mountain', 'road', 'cave', 'castle', 'space', 'underwater'];

    locations.forEach(location => {
      it(`should generate ${location} environment`, () => {
        const result = envGenerator.generate(location, 'midday', 'clear');
        
        expect(result.location).toBe(location);
        expect(result.backgrounds).toBeDefined();
        expect(result.backgrounds.length).toBeGreaterThan(0);
      });
    });
  });

  describe('time of day variations', () => {
    const times: TimeOfDay[] = ['dawn', 'morning', 'midday', 'afternoon', 'evening', 'dusk', 'night', 'midnight'];

    times.forEach(time => {
      it(`should generate ${time} lighting`, () => {
        const result = envGenerator.generate('forest', time, 'clear');
        
        expect(result.lighting).toBeDefined();
        expect(result.timeOfDay).toBe(time);
      });
    });
  });

  describe('weather variations', () => {
    const weatherTypes: WeatherType[] = ['clear', 'sunny', 'cloudy', 'rainy', 'stormy', 'snowy', 'foggy', 'windy'];

    weatherTypes.forEach(weather => {
      it(`should generate ${weather} weather`, () => {
        const result = envGenerator.generate('forest', 'afternoon', weather);
        
        expect(result.weather.type).toBe(weather);
        if (weather === 'clear' || weather === 'cloudy') {
          expect(result.weather.particles.length).toBe(0);
        } else {
          expect(result.weather.particles.length).toBeGreaterThan(0);
        }
      });
    });
  });

  describe('atmosphere mood variations', () => {
    const moods: AtmosphereMood[] = ['tense', 'calm', 'joyful', 'melancholy', 'mysterious', 'adventurous', 'romantic', 'dark', 'neutral'];

    moods.forEach(mood => {
      it(`should generate ${mood} atmosphere`, () => {
        const result = envGenerator.generate('forest', 'evening', 'clear', mood);
        
        expect(result.atmosphere.mood).toBe(mood);
        expect(result.atmosphere.colorOverlay).toBeDefined();
      });
    });
  });

  describe('presets', () => {
    it('should get forest morning preset', () => {
      const preset = envGenerator.getPreset('forest_morning');
      
      expect(preset).not.toBeNull();
      expect(preset?.location).toBe('forest');
      expect(preset?.timeOfDay).toBe('morning');
      expect(preset?.weather.type).toBe('clear');
    });

    it('should get beach sunset preset', () => {
      const preset = envGenerator.getPreset('beach_sunset');
      
      expect(preset).not.toBeNull();
      expect(preset?.location).toBe('beach');
      expect(preset?.timeOfDay).toBe('evening');
    });

    it('should get city rain preset', () => {
      const preset = envGenerator.getPreset('city_rain');
      
      expect(preset).not.toBeNull();
      expect(preset?.location).toBe('city');
      expect(preset?.weather.type).toBe('rainy');
    });

    it('should return null for unknown preset', () => {
      const preset = envGenerator.getPreset('unknown_preset');
      
      expect(preset).toBeNull();
    });
  });

  describe('updateWeather', () => {
    it('should generate rainy weather with particles', () => {
      const result = envGenerator.generate('forest', 'morning', 'rainy');
      
      // Rainy weather should have particles
      expect(result.weather.particles).toBeDefined();
      expect(result.weather.type).toBe('rainy');
      expect(result.weather.intensity).toBeGreaterThan(0);
    });
  });

  describe('configuration', () => {
    it('should use custom canvas dimensions', () => {
      const customGenerator = new EnvironmentGenerator({
        canvasWidth: 1280,
        canvasHeight: 720,
      });
      
      const config = customGenerator.getConfig();
      
      expect(config.canvasWidth).toBe(1280);
      expect(config.canvasHeight).toBe(720);
    });

    it('should update configuration', () => {
      envGenerator.configure({
        enableParallax: false,
        enableAtmosphere: false,
      });
      
      const config = envGenerator.getConfig();
      
      expect(config.enableParallax).toBe(false);
      expect(config.enableAtmosphere).toBe(false);
    });
  });

  describe('lighting characteristics', () => {
    it('should have higher ambient at midday', () => {
      const midday = envGenerator.generate('forest', 'midday', 'clear');
      const midnight = envGenerator.generate('forest', 'midnight', 'clear');
      
      expect(midday.lighting.ambient).toBeGreaterThan(midnight.lighting.ambient);
    });

    it('should have warm color at dawn/evening', () => {
      const dawn = envGenerator.generate('forest', 'dawn', 'clear');
      
      expect(dawn.lighting.color.r).toBeGreaterThan(dawn.lighting.color.g);
    });

    it('should enable shadows during day', () => {
      const midday = envGenerator.generate('forest', 'midday', 'clear');
      
      expect(midday.lighting.shadows.enabled).toBe(true);
    });

    it('should disable shadows at night', () => {
      const night = envGenerator.generate('forest', 'night', 'clear');
      
      expect(night.lighting.shadows.enabled).toBe(false);
    });
  });

  describe('weather particle characteristics', () => {
    it('should create more particles for stormy weather', () => {
      const rainy = envGenerator.generate('forest', 'afternoon', 'rainy');
      const stormy = envGenerator.generate('forest', 'afternoon', 'stormy');
      
      expect(stormy.weather.particles.length).toBeGreaterThan(rainy.weather.particles.length);
    });

    it('should set correct intensity for weather types', () => {
      const clear = envGenerator.generate('forest', 'afternoon', 'clear');
      const stormy = envGenerator.generate('forest', 'afternoon', 'stormy');
      
      expect(clear.weather.intensity).toBeLessThan(stormy.weather.intensity);
    });
  });
});
