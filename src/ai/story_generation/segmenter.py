"""
Scene segmentation for story text.

Breaks story text into meaningful scenes that can be visualized.
"""
import re
import uuid
from typing import List, Optional, Callable
from dataclasses import dataclass

from .types import StoryScene, StoryGenre, SceneMarker


@dataclass
class SegmentationResult:
    """Result of scene segmentation."""
    scenes: List[StoryScene]
    full_text: str
    total_scenes: int


class SceneSegmenter:
    """
    Segments story text into scenes.
    
    Handles:
    - Paragraph-based segmentation
    - Dialogue-aware segmentation
    - Scene boundary detection
    - Scene metadata extraction
    """
    
    # Patterns for detecting scene boundaries
    SCENE_BREAK_PATTERNS = [
        r'\*\*\*',           # Markdown scene break
        r'\n\n\n+',         # Multiple newlines
        r'---+',             # Dash separator
        r'===+',             # Equals separator
    ]
    
    # Patterns for detecting scene elements
    SETTING_PATTERNS = [
        r'(?:In|At|The|Outside|Inside|Near|Through|Inside|Deep|Low|High)\s+[A-Z][a-z]+',
        r'(?:The\s+)?(?:\w+\s+)?(?:forest|mountain|castle|house|room|village|town|city|ship|planet)',
    ]
    
    MOOD_INDICATORS = {
        "tense": ["suddenly", "quietly", "darkness", "shadow", "silence"],
        "happy": ["bright", "smile", "laugh", "warm", "joy", "cheerful"],
        "sad": ["tears", "cry", "sigh", "rain", "cloud", "dark"],
        "mysterious": ["strange", "unknown", "hidden", "secret", "whisper"],
        "exciting": ["rush", "charge", "escape", "chase", "race", "quickly"],
        "peaceful": ["calm", "soft", "gentle", "serene", "quiet", "rest"],
    }
    
    CHARACTER_INDICATORS = [
        r'\b([A-Z][a-z]+)\s+said',
        r'\b([A-Z][a-z]+)\s+replied',
        r'\b([A-Z][a-z]+)\s+asked',
        r'\b([A-Z][a-z]+)\s+whispered',
        r'\b([A-Z][a-z]+)\s+shouted',
        r'\b([A-Z][a-z]+)\s+thought',
        r'\b([A-Z][a-z]+)\s+waved',
        r'\b([A-Z][a-z]+)\s+walked',
        r'\b([A-Z][a-z]+)\s+ran',
        r'\"[^\"]+\"\s+(?:said|replied|asked|whispered)',
    ]
    
    def __init__(
        self,
        min_scene_length: int = 100,
        max_scene_length: int = 800,
        preserve_dialogue: bool = True,
    ):
        """
        Initialize the segmenter.
        
        Args:
            min_scene_length: Minimum characters for a valid scene
            max_scene_length: Maximum characters before forcing a split
            preserve_dialogue: Keep dialogue intact when segmenting
        """
        self.min_scene_length = min_scene_length
        self.max_scene_length = max_scene_length
        self.preserve_dialogue = preserve_dialogue
    
    def segment(
        self,
        text: str,
        genre: Optional[StoryGenre] = None,
        scene_index_offset: int = 0,
    ) -> SegmentationResult:
        """
        Segment text into scenes.
        
        Args:
            text: The story text to segment
            genre: Optional genre hint for better segmentation
            scene_index_offset: Starting index for scene IDs
        
        Returns:
            SegmentationResult with list of scenes
        """
        # Clean the text
        cleaned_text = self._clean_text(text)
        
        # Split into raw segments
        raw_segments = self._split_into_segments(cleaned_text)
        
        # Merge small segments and split large ones
        merged_segments = self._merge_and_split(raw_segments)
        
        # Convert to StoryScene objects
        scenes = []
        for i, segment in enumerate(merged_segments):
            scene = self._create_scene(segment, i + scene_index_offset, genre)
            scenes.append(scene)
        
        return SegmentationResult(
            scenes=scenes,
            full_text=cleaned_text,
            total_scenes=len(scenes),
        )
    
    def _clean_text(self, text: str) -> str:
        """Clean and normalize text."""
        # Remove excessive whitespace
        text = re.sub(r'[ \t]+', ' ', text)
        # Normalize line endings
        text = re.sub(r'\r\n', '\n', text)
        return text.strip()
    
    def _split_into_segments(self, text: str) -> List[str]:
        """Split text into initial segments."""
        # Try to split on scene break patterns first
        pattern = '|'.join(self.SCENE_BREAK_PATTERNS)
        segments = re.split(f'({pattern})', text)
        
        # Combine separators with adjacent segments
        combined = []
        current = ""
        
        for segment in segments:
            if re.match(pattern, segment):
                # This is a separator, add to current
                current += segment
            else:
                if current:
                    combined.append(current)
                current = segment
        
        if current:
            combined.append(current)
        
        # If no splits, try paragraph-based splitting
        if len(combined) <= 1:
            paragraphs = text.split('\n\n')
            combined = [p.strip() for p in paragraphs if p.strip()]
        
        return combined
    
    def _merge_and_split(self, segments: List[str]) -> List[str]:
        """Merge small segments and split large ones."""
        if not segments:
            return []
        
        merged = []
        current = ""
        
        for segment in segments:
            segment = segment.strip()
            if not segment:
                continue
            
            test_merged = current + " " + segment if current else segment
            test_merged = test_merged.strip()
            
            # If current would be too large, start new segment
            if len(test_merged) > self.max_scene_length:
                if current:
                    merged.append(current)
                # Split the large segment
                split_segments = self._split_segment(segment)
                merged.extend(split_segments[:-1])
                current = split_segments[-1] if split_segments else ""
            # If current would be too small and we have content, wait
            elif current and len(test_merged) < self.min_scene_length:
                current = test_merged
            else:
                current = test_merged
        
        if current:
            merged.append(current)
        
        # Final pass: merge consecutive small segments
        final = []
        buffer = ""
        
        for segment in merged:
            if buffer:
                if len(buffer) + len(segment) < self.max_scene_length:
                    buffer += " " + segment
                else:
                    final.append(buffer)
                    buffer = segment
            else:
                buffer = segment
        
        if buffer:
            final.append(buffer)
        
        return final
    
    def _split_segment(self, segment: str) -> List[str]:
        """Split a large segment into smaller pieces."""
        if len(segment) <= self.max_scene_length:
            return [segment]
        
        # Try to split on sentence boundaries
        sentences = re.split(r'(?<=[.!?])\s+', segment)
        result = []
        current = ""
        
        for sentence in sentences:
            if len(current) + len(sentence) > self.max_scene_length:
                if current:
                    result.append(current)
                current = sentence
            else:
                current = current + " " + sentence if current else sentence
        
        if current:
            result.append(current)
        
        return result if result else [segment]
    
    def _create_scene(
        self,
        text: str,
        index: int,
        genre: Optional[StoryGenre] = None,
    ) -> StoryScene:
        """Create a StoryScene from segment text."""
        scene_id = f"scene_{uuid.uuid4().hex[:8]}"
        
        # Extract description (first sentence or two)
        description = self._extract_description(text)
        
        # Extract characters
        characters = self._extract_characters(text)
        
        # Extract setting
        setting = self._extract_setting(text)
        
        # Determine mood
        mood = self._extract_mood(text)
        
        # Estimate duration based on length
        duration = len(text) / 150  # ~150 chars per second of reading
        
        return StoryScene(
            scene_id=scene_id,
            index=index,
            text=text,
            description=description,
            characters=characters,
            setting=setting,
            mood=mood,
            duration_estimate=duration,
        )
    
    def _extract_description(self, text: str) -> str:
        """Extract a short description from the scene."""
        # Take first 1-2 sentences, truncated
        sentences = re.split(r'(?<=[.!?])\s+', text)
        if not sentences:
            return text[:100] + "..." if len(text) > 100 else text
        
        desc = sentences[0]
        if len(sentences) > 1 and len(desc) < 50:
            desc += " " + sentences[1]
        
        return desc[:200] + "..." if len(desc) > 200 else desc
    
    def _extract_characters(self, text: str) -> List[str]:
        """Extract character names from dialogue and narration."""
        characters = set()
        
        for pattern in self.CHARACTER_INDICATORS:
            matches = re.findall(pattern, text)
            characters.update(matches)
        
        return list(characters)[:5]  # Limit to 5 characters
    
    def _extract_setting(self, text: str) -> str:
        """Extract setting/location hints from text."""
        for pattern in self.SETTING_PATTERNS:
            match = re.search(pattern, text)
            if match:
                return match.group(0)
        return "Unknown location"
    
    def _extract_mood(self, text: str) -> str:
        """Determine the mood/atmosphere of the scene."""
        text_lower = text.lower()
        
        mood_scores = {}
        for mood, indicators in self.MOOD_INDICATORS.items():
            score = sum(1 for indicator in indicators if indicator in text_lower)
            if score > 0:
                mood_scores[mood] = score
        
        if mood_scores:
            return max(mood_scores, key=mood_scores.get)
        return "neutral"


# Global segmenter instance
_segmenter: Optional[SceneSegmenter] = None


def get_segmenter(
    min_scene_length: int = 100,
    max_scene_length: int = 800,
) -> SceneSegmenter:
    """Get or create the global segmenter instance."""
    global _segmenter
    if _segmenter is None:
        _segmenter = SceneSegmenter(
            min_scene_length=min_scene_length,
            max_scene_length=max_scene_length,
        )
    return _segmenter
