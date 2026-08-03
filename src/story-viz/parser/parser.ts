/**
 * Story Parser
 * 
 * Parses story text into structured scene data for visualization.
 * 
 * Features:
 * - Text segmentation into sentences and paragraphs
 * - Scene boundary detection
 * - Element extraction (characters, actions, emotions)
 * - Environment and setting detection
 * - Camera action generation
 */

import type {
  ParsedStory,
  ParsedScene,
  ExtractedCharacter,
  ExtractedAction,
  EnvironmentDescription,
  CameraAction,
  SceneMetadata,
  SceneBoundaryPatterns,
  StoryParserConfig,
  EmotionExtraction,
  SceneTransitionType,
} from './types';

/**
 * Emotion keywords mapping
 */
const EMOTION_KEYWORDS: Record<string, string[]> = {
  happy: ['happy', 'joy', 'laugh', 'smile', 'cheerful', 'delighted', 'glad', 'pleased', 'excited', 'thrilled'],
  sad: ['sad', 'cry', 'tears', 'grief', 'sorrow', 'depressed', 'unhappy', 'melancholy', 'down', 'blue'],
  angry: ['angry', 'furious', 'rage', 'mad', 'annoyed', 'irritated', 'frustrated', 'upset', 'enraged'],
  surprised: ['surprised', 'shocked', 'amazed', 'astonished', 'startled', 'stunned', 'astonished'],
  fearful: ['scared', 'afraid', 'terrified', 'nervous', 'anxious', 'worried', 'frightened', 'spooked'],
  thoughtful: ['thoughtful', 'pensive', 'considering', 'thinking', 'reflecting', 'meditating'],
  confused: ['confused', 'puzzled', 'bewildered', 'perplexed', 'lost', 'uncertain'],
  romantic: ['love', 'romantic', 'affection', 'tender', 'caring', 'devoted', 'passionate'],
  mysterious: ['mysterious', 'cryptic', 'enigmatic', 'shadowy', 'unknown', 'secret'],
  tense: ['tense', 'stress', 'pressure', 'urgent', 'critical', 'nervous', 'edge'],
};

/**
 * Time of day keywords
 */
const TIME_OF_DAY: Record<string, string[]> = {
  dawn: ['dawn', 'sunrise', 'morning light', 'early morning'],
  morning: ['morning', 'breakfast', 'daybreak', 'a.m.'],
  midday: ['noon', 'midday', 'afternoon', 'lunchtime'],
  evening: ['evening', 'dusk', 'sunset', 'twilight'],
  night: ['night', 'midnight', 'darkness', 'moonlight', 'starlight'],
};

/**
 * Weather keywords
 */
const WEATHER: Record<string, string[]> = {
  sunny: ['sunny', 'clear', 'bright', 'sunshine'],
  cloudy: ['cloudy', 'overcast', 'gray', 'grey'],
  rainy: ['rain', 'rainy', 'stormy', 'drizzle', 'thunder'],
  snowy: ['snow', 'snowy', 'blizzard', 'frost', 'freezing'],
  foggy: ['fog', 'foggy', 'misty', 'haze'],
  windy: ['wind', 'windy', 'breezy', 'gusty'],
};

/**
 * Default scene boundary patterns
 */
const DEFAULT_BOUNDARY_PATTERNS: SceneBoundaryPatterns = {
  transitions: [
    /\b(however|Meanwhile|Meanwhile,)\b/i,
    /\b(Back at|Meanwhile back at)\b/i,
    /\.\.\./g,
    /\n\n+/,
  ],
  locationChanges: [
    /\bat the\b/gi,
    /\bin the\b/gi,
    /\bto the\b/gi,
    /\binside\b/gi,
    /\boutside\b/gi,
  ],
  timeChanges: [
    /\b(later|earlier|after|before|next day|yesterday|tomorrow)\b/i,
    /\b(hours|minutes|days|weeks|months|years) (later|passed|passed)\b/i,
  ],
  chapterMarkers: [
    /^Chapter \d+/im,
    /^Scene \d+/im,
    /^\d+\./m,
  ],
};

/**
 * Default parser configuration
 */
const DEFAULT_CONFIG: Required<StoryParserConfig> = {
  minSceneLength: 50,
  maxSceneLength: 2000,
  detectLocationChanges: true,
  detectTimeChanges: true,
  extractEmotions: true,
  generateCameraActions: true,
};

/**
 * Story Parser class
 */
export class StoryParser {
  private config: Required<StoryParserConfig>;
  private patterns: SceneBoundaryPatterns;

  constructor(config: StoryParserConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.patterns = DEFAULT_BOUNDARY_PATTERNS;
  }

  /**
   * Parse story text into structured scenes
   */
  parse(storyText: string): ParsedStory {
    const normalizedText = this.normalizeText(storyText);
    const segments = this.segmentText(normalizedText);
    const sceneBoundaries = this.detectSceneBoundaries(segments);
    const scenes = this.extractScenes(segments, sceneBoundaries);
    const characters = this.extractAllCharacters(scenes);
    
    return {
      title: this.extractTitle(storyText),
      scenes,
      totalScenes: scenes.length,
      characters,
    };
  }

  /**
   * Normalize text by removing extra whitespace and standardizing
   */
  private normalizeText(text: string): string {
    return text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\t/g, ' ')
      .replace(/ +/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  /**
   * Extract story title
   */
  private extractTitle(text: string): string | undefined {
    const firstLine = text.split('\n')[0]?.trim();
    if (firstLine && firstLine.length < 100) {
      return firstLine;
    }
    return undefined;
  }

  /**
   * Segment text into sentences
   */
  private segmentText(text: string): string[] {
    // Split by sentence boundaries but keep track of position
    const sentenceRegex = /[^.!?]+[.!?]+/g;
    const segments: string[] = [];
    let match;

    while ((match = sentenceRegex.exec(text)) !== null) {
      const segment = match[0].trim();
      if (segment.length > 0) {
        segments.push(segment);
      }
    }

    // Handle remaining text without sentence ending
    const lastIndex = sentenceRegex.lastIndex;
    if (lastIndex < text.length) {
      const remaining = text.slice(lastIndex).trim();
      if (remaining.length > 0) {
        segments.push(remaining);
      }
    }

    return segments;
  }

  /**
   * Detect scene boundaries based on patterns
   */
  private detectSceneBoundaries(segments: string[]): number[] {
    const boundaries: number[] = [0];
    let currentSceneStart = 0;
    let accumulatedLength = 0;

    for (let i = 1; i < segments.length; i++) {
      const segment = segments[i];
      accumulatedLength += segment.length;

      // Check for explicit scene boundaries
      const hasExplicitBoundary = this.patterns.chapterMarkers.some(
        pattern => pattern.test(segment)
      );

      // Check for time/location changes if enabled
      const hasLocationChange = this.config.detectLocationChanges && 
        this.patterns.locationChanges.some(pattern => pattern.test(segment));

      const hasTimeChange = this.config.detectTimeChanges && 
        this.patterns.timeChanges.some(pattern => pattern.test(segment));

      // Check for transition patterns
      const hasTransition = this.patterns.transitions.some(
        pattern => pattern.test(segment)
      );

      // Determine if this is a scene boundary
      const isSceneBoundary = 
        hasExplicitBoundary ||
        (hasTransition && accumulatedLength > 100) ||
        (hasLocationChange && accumulatedLength > 200) ||
        (hasTimeChange && accumulatedLength > 150) ||
        accumulatedLength > this.config.maxSceneLength;

      if (isSceneBoundary) {
        boundaries.push(i);
        currentSceneStart = i;
        accumulatedLength = 0;
      }
    }

    return boundaries;
  }

  /**
   * Extract scenes from segments based on boundaries
   */
  private extractScenes(segments: string[], boundaries: number[]): ParsedScene[] {
    const scenes: ParsedScene[] = [];

    for (let i = 0; i < boundaries.length; i++) {
      const startIdx = boundaries[i];
      const endIdx = i < boundaries.length - 1 ? boundaries[i + 1] : segments.length;
      
      const sceneSegments = segments.slice(startIdx, endIdx);
      const text = sceneSegments.join(' ');
      const startIndex = segments.slice(0, startIdx).join(' ').length;
      const endIndex = segments.slice(0, endIdx).join(' ').length;

      if (text.length >= this.config.minSceneLength) {
        const scene = this.createScene(
          text,
          startIndex,
          endIndex,
          i + 1
        );
        scenes.push(scene);
      }
    }

    return scenes;
  }

  /**
   * Create a parsed scene from text
   */
  private createScene(
    text: string,
    startIndex: number,
    endIndex: number,
    sceneNumber: number
  ): ParsedScene {
    return {
      id: `scene-${sceneNumber}`,
      text,
      characters: this.extractCharacters(text),
      actions: this.extractActions(text),
      environment: this.extractEnvironment(text),
      camera: this.generateCameraAction(text),
      metadata: this.generateMetadata(text, sceneNumber),
      startIndex,
      endIndex,
    };
  }

  /**
   * Extract characters from text
   */
  extractCharacters(text: string): ExtractedCharacter[] {
    const characters: ExtractedCharacter[] = [];
    
    // Pattern to find character names (capitalized words at start of sentences or after dialogue)
    const characterPattern = /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gm;
    const nameCounts: Record<string, number> = {};
    let match;

    while ((match = characterPattern.exec(text)) !== null) {
      const name = match[1];
      nameCounts[name] = (nameCounts[name] || 0) + 1;
    }

    // Get characters that appear multiple times (likely main characters)
    const mainCharacters = Object.entries(nameCounts)
      .filter(([_, count]) => count >= 1)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => name);

    for (const name of mainCharacters) {
      const emotion = this.extractPrimaryEmotion(text, name).primary;
      characters.push({
        name,
        emotion,
        speaking: this.isCharacterSpeaking(text, name),
      });
    }

    return characters;
  }

  /**
   * Check if a character is speaking in the text
   */
  private isCharacterSpeaking(text: string, characterName: string): boolean {
    const speakingPatterns = [
      new RegExp(`${characterName} said`, 'i'),
      new RegExp(`${characterName} replied`, 'i'),
      new RegExp(`${characterName} asked`, 'i'),
      new RegExp(`${characterName} shouted`, 'i'),
      new RegExp(`"[^"]*"`, 'g'), // Direct quotes
    ];

    return speakingPatterns.some(pattern => pattern.test(text));
  }

  /**
   * Extract actions from text
   */
  extractActions(text: string): ExtractedAction[] {
    const actions: ExtractedAction[] = [];
    
    // Common action verbs
    const actionVerbs = [
      'walked', 'ran', 'sat', 'stood', 'looked', 'turned', 'opened', 'closed',
      'took', 'gave', 'said', 'asked', 'replied', 'smiled', 'laughed', 'cried',
      'whispered', 'shouted', 'moved', 'entered', 'left', 'arrived', 'nodded',
      'shook', 'waved', 'pointed', 'reached', 'grabbed', 'dropped', 'fell',
    ];

    for (const verb of actionVerbs) {
      const pattern = new RegExp(`(\\w+)\\s+${verb}\\s*(?:to\\s+(\\w+))?`, 'gi');
      let match;

      while ((match = pattern.exec(text)) !== null) {
        const [, character, target] = match;
        // Only add if character looks like a name
        if (character && /^[A-Z][a-z]+$/.test(character)) {
          actions.push({
            character,
            action: verb,
            target,
          });
        }
      }
    }

    return actions;
  }

  /**
   * Extract environment description from text
   */
  extractEnvironment(text: string): EnvironmentDescription {
    const lowerText = text.toLowerCase();

    return {
      location: this.detectLocation(text),
      timeOfDay: this.detectTimeOfDay(lowerText),
      weather: this.detectWeather(lowerText),
      mood: this.detectMood(text),
      lighting: this.detectLighting(lowerText),
    };
  }

  /**
   * Detect location from text
   */
  private detectLocation(text: string): string {
    const locations = [
      { name: 'forest', patterns: ['forest', 'woods', 'trees', 'trees'] },
      { name: 'beach', patterns: ['beach', 'shore', 'ocean', 'sea', 'sand'] },
      { name: 'city', patterns: ['city', 'street', 'avenue', 'downtown', 'building'] },
      { name: 'room', patterns: ['room', 'bedroom', 'kitchen', 'hall', 'office'] },
      { name: 'garden', patterns: ['garden', 'yard', 'park', 'flowers', 'meadow'] },
      { name: 'mountain', patterns: ['mountain', 'peak', 'cliff', 'summit', 'rocky'] },
      { name: 'road', patterns: ['road', 'path', 'trail', 'highway', 'street'] },
    ];

    const lowerText = text.toLowerCase();
    
    for (const location of locations) {
      if (location.patterns.some(pattern => lowerText.includes(pattern))) {
        return location.name;
      }
    }

    return 'unknown';
  }

  /**
   * Detect time of day
   */
  private detectTimeOfDay(lowerText: string): string {
    for (const [time, keywords] of Object.entries(TIME_OF_DAY)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        return time;
      }
    }
    return 'daytime';
  }

  /**
   * Detect weather
   */
  private detectWeather(lowerText: string): string {
    for (const [weather, keywords] of Object.entries(WEATHER)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        return weather;
      }
    }
    return 'clear';
  }

  /**
   * Detect mood/atmosphere
   */
  private detectMood(text: string): string {
    const moodIndicators: Record<string, number> = {
      tense: 0,
      calm: 0,
      joyful: 0,
      melancholy: 0,
      mysterious: 0,
      adventurous: 0,
      romantic: 0,
      dark: 0,
    };

    const tensionWords = ['suddenly', 'quickly', 'urgent', 'rushed', 'panic', 'fear', 'danger'];
    const calmWords = ['quietly', 'peacefully', 'slowly', 'gentle', 'calm', 'serene', 'tranquil'];
    const joyfulWords = ['happy', 'laugh', 'smile', 'joy', 'celebrate', 'cheer', 'delight'];
    const mysteriousWords = ['shadow', 'dark', 'secret', 'mysterious', 'strange', 'unknown', 'hidden'];

    const lowerText = text.toLowerCase();

    tensionWords.forEach(word => { if (lowerText.includes(word)) moodIndicators.tense += 1; });
    calmWords.forEach(word => { if (lowerText.includes(word)) moodIndicators.calm += 1; });
    joyfulWords.forEach(word => { if (lowerText.includes(word)) moodIndicators.joyful += 1; });
    mysteriousWords.forEach(word => { if (lowerText.includes(word)) moodIndicators.mysterious += 1; });

    return Object.entries(moodIndicators)
      .sort((a, b) => b[1] - a[1])[0][0];
  }

  /**
   * Detect lighting from text
   */
  private detectLighting(lowerText: string): string {
    const lightingIndicators = [
      { name: 'bright', patterns: ['bright', 'sunlight', 'shine', 'glare', 'brilliant'] },
      { name: 'dim', patterns: ['dim', 'faint', 'shadow', 'dusk'] },
      { name: 'dark', patterns: ['dark', 'darkness', 'black', 'night'] },
      { name: 'warm', patterns: ['warm', 'golden', 'sunset', 'amber', 'glow'] },
      { name: 'cold', patterns: ['cold', 'pale', 'blue', 'frost', 'ice'] },
    ];

    for (const { name, patterns } of lightingIndicators) {
      if (patterns.some(pattern => lowerText.includes(pattern))) {
        return name;
      }
    }

    return 'natural';
  }

  /**
   * Extract primary emotion from text
   */
  extractPrimaryEmotion(text: string, characterName?: string): EmotionExtraction {
    const lowerText = text.toLowerCase();
    const emotionCounts: Record<string, number> = {};
    const emotionKeywords: Record<string, string[]> = {};

    for (const [emotion, keywords] of Object.entries(EMOTION_KEYWORDS)) {
      emotionCounts[emotion] = 0;
      emotionKeywords[emotion] = [];

      for (const keyword of keywords) {
        if (lowerText.includes(keyword)) {
          emotionCounts[emotion]++;
          emotionKeywords[emotion].push(keyword);
        }
      }
    }

    // Find primary emotion
    let maxCount = 0;
    let primaryEmotion = 'neutral';

    for (const [emotion, count] of Object.entries(emotionCounts)) {
      if (count > maxCount) {
        maxCount = count;
        primaryEmotion = emotion;
      }
    }

    // Calculate intensity (0-1)
    const totalWords = text.split(/\s+/).length;
    const intensity = Math.min(maxCount / 5, 1);

    return {
      primary: primaryEmotion,
      secondary: maxCount > 2 ? Object.entries(emotionCounts)
        .filter(([e]) => e !== primaryEmotion)
        .sort((a, b) => b[1] - a[1])[0]?.[0] : undefined,
      intensity,
      keywords: emotionKeywords[primaryEmotion] || [],
    };
  }

  /**
   * Generate camera action based on text
   */
  private generateCameraAction(text: string): CameraAction {
    const lowerText = text.toLowerCase();

    // Determine camera action based on keywords
    if (lowerText.includes('zoom in') || lowerText.includes('focus on') || lowerText.includes('close up')) {
      return {
        type: 'zoom',
        zoomLevel: 1.5,
        duration: 500,
      };
    }

    if (lowerText.includes('zoom out') || lowerText.includes('wide shot') || lowerText.includes('overview')) {
      return {
        type: 'zoom',
        zoomLevel: 0.7,
        duration: 500,
      };
    }

    if (lowerText.includes('pan left')) {
      return {
        type: 'pan',
        direction: 'left',
        duration: 1000,
      };
    }

    if (lowerText.includes('pan right')) {
      return {
        type: 'pan',
        direction: 'right',
        duration: 1000,
      };
    }

    if (lowerText.includes('track') || lowerText.includes('follow')) {
      return {
        type: 'track',
        duration: 2000,
      };
    }

    // Default to hold
    return {
      type: 'hold',
      duration: 3000,
    };
  }

  /**
   * Generate scene metadata
   */
  private generateMetadata(text: string, sceneNumber: number): SceneMetadata {
    const emotion = this.extractPrimaryEmotion(text);

    // Determine transition type based on scene content
    let transitionType: SceneTransitionType = 'cut';
    const lowerText = text.toLowerCase();

    if (lowerText.includes('fade') || lowerText.includes('slowly dissolve')) {
      transitionType = 'fade';
    } else if (lowerText.includes('wipe') || lowerText.includes('swipe')) {
      transitionType = 'wipe';
    } else if (lowerText.includes('crossfade') || lowerText.includes('mix')) {
      transitionType = 'dissolve';
    }

    return {
      sceneNumber,
      transitionType,
      duration: Math.max(2000, Math.min(text.length * 50, 10000)),
      emotion: emotion.primary,
      atmosphere: emotion.intensity > 0.5 ? emotion.primary : 'neutral',
    };
  }

  /**
   * Extract all unique characters from scenes
   */
  private extractAllCharacters(scenes: ParsedScene[]): string[] {
    const characterSet = new Set<string>();

    for (const scene of scenes) {
      for (const character of scene.characters) {
        characterSet.add(character.name);
      }
    }

    return Array.from(characterSet);
  }

  /**
   * Update parser configuration
   */
  configure(config: Partial<StoryParserConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): Readonly<Required<StoryParserConfig>> {
    return { ...this.config };
  }
}

export default StoryParser;
