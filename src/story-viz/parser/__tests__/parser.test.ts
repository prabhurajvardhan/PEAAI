/**
 * Story Parser Tests
 */

import { StoryParser } from '../parser';
import type { ParsedStory, ParsedScene } from '../types';

describe('StoryParser', () => {
  let parser: StoryParser;

  beforeEach(() => {
    parser = new StoryParser();
  });

  describe('parse', () => {
    it('should parse a simple story into scenes', () => {
      const story = 'The brave knight walked through the dark forest. He looked around nervously. The trees whispered secrets.';
      
      const result = parser.parse(story);
      
      expect(result.scenes.length).toBeGreaterThanOrEqual(1);
      expect(result.totalScenes).toBe(result.scenes.length);
    });

    it('should extract characters from story text', () => {
      const story = 'Alice walked into the room. Bob greeted her warmly. Alice smiled back.';
      
      const result = parser.parse(story);
      
      const allCharacters = result.scenes.flatMap(scene => scene.characters);
      expect(allCharacters.length).toBeGreaterThan(0);
    });

    it('should extract environment information', () => {
      const story = 'The beautiful garden was bathed in warm sunlight. Birds sang softly.';
      
      const result = parser.parse(story);
      
      expect(result.scenes[0]).toBeDefined();
      expect(result.scenes[0].environment.location).toBeDefined();
    });

    it('should detect time of day', () => {
      const story = 'Under the bright moonlight, they walked through the silent town.';
      
      const result = parser.parse(story);
      
      expect(result.scenes[0].environment.timeOfDay).toBe('night');
    });

    it('should detect weather conditions', () => {
      const story = 'Rain poured down from the dark clouds. Everyone rushed inside.';
      
      const result = parser.parse(story);
      
      expect(result.scenes[0].environment.weather).toBe('rainy');
    });

    it('should extract actions from text', () => {
      const story = 'John walked to the door and opened it. He looked outside.';
      
      const result = parser.parse(story);
      
      const actions = result.scenes[0].actions;
      expect(actions.length).toBeGreaterThan(0);
    });

    it('should generate camera actions', () => {
      const story = 'The camera zoom in close on the mysterious figure.';
      
      const result = parser.parse(story);
      
      expect(result.scenes[0].camera.type).toBe('zoom');
    });

    it('should extract emotions', () => {
      const story = 'She felt so happy and excited about the wonderful news!';
      
      const result = parser.parse(story);
      
      const emotion = result.scenes[0].metadata.emotion;
      expect(['happy', 'excited']).toContain(emotion);
    });

    it('should handle multiple paragraphs', () => {
      const story = `
        The sun rose over the quiet village.
        
        Meanwhile, in the distant mountains, a storm was brewing.
        
        Sarah walked through the forest, her heart beating fast.
      `;
      
      const result = parser.parse(story);
      
      expect(result.scenes.length).toBeGreaterThanOrEqual(1);
    });

    it('should extract mood from text', () => {
      const story = 'Suddenly, a shadow appeared. Everyone panicked and ran.';
      
      const result = parser.parse(story);
      
      expect(['tense', 'mysterious']).toContain(result.scenes[0].environment.mood);
    });
  });

  describe('extractPrimaryEmotion', () => {
    it('should detect happy emotion', () => {
      const text = 'She was so happy and excited to see her friends.';
      
      const emotion = parser.extractPrimaryEmotion(text);
      
      expect(emotion.primary).toBe('happy');
      expect(emotion.intensity).toBeGreaterThan(0);
    });

    it('should detect sad emotion', () => {
      const text = 'Tears rolled down her cheeks. She felt so sad and alone.';
      
      const emotion = parser.extractPrimaryEmotion(text);
      
      expect(emotion.primary).toBe('sad');
    });

    it('should detect angry emotion', () => {
      const text = 'He was furious and rage filled his heart.';
      
      const emotion = parser.extractPrimaryEmotion(text);
      
      expect(emotion.primary).toBe('angry');
    });

    it('should return neutral for emotionless text', () => {
      const text = 'The book sat on the table. The room was quiet.';
      
      const emotion = parser.extractPrimaryEmotion(text);
      
      expect(emotion.primary).toBe('neutral');
    });
  });

  describe('configuration', () => {
    it('should use custom configuration', () => {
      const customParser = new StoryParser({
        minSceneLength: 100,
        maxSceneLength: 500,
      });
      
      const config = customParser.getConfig();
      
      expect(config.minSceneLength).toBe(100);
      expect(config.maxSceneLength).toBe(500);
    });

    it('should update configuration with configure method', () => {
      parser.configure({ extractEmotions: false });
      
      const config = parser.getConfig();
      
      expect(config.extractEmotions).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle empty string', () => {
      const result = parser.parse('');
      
      expect(result.scenes).toEqual([]);
      expect(result.totalScenes).toBe(0);
    });

    it('should handle very short text', () => {
      const story = 'Short text.';
      
      const result = parser.parse(story);
      
      expect(result).toBeDefined();
    });

    it('should handle text with no punctuation', () => {
      const story = 'The quick brown fox jumped over the lazy dog and ran away';
      
      const result = parser.parse(story);
      
      expect(result).toBeDefined();
    });
  });
});
