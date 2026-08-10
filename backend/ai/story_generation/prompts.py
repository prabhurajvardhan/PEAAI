"""
Story generation prompt templates and builders.
"""
from typing import Dict, List, Optional
from dataclasses import dataclass

from .types import StoryGenre, StoryLength, StoryPromptContext, StoryGenerationConfig


class PromptTemplate:
    """Template for story generation prompts."""
    
    SYSTEM_PROMPT: str = ""
    USER_PROMPT_TEMPLATE: str = ""
    
    def format_user_prompt(
        self,
        context: StoryPromptContext,
        config: StoryGenerationConfig,
        scene_index: int = 0,
        is_continuation: bool = False,
    ) -> str:
        """Format the user prompt with context."""
        raise NotImplementedError


class AdventurePromptTemplate(PromptTemplate):
    """Prompt template for adventure stories."""
    
    SYSTEM_PROMPT = """You are a creative storyteller for an AI companion application called PEAAI. 
Your role is to craft engaging, emotionally resonant stories that captivate users.

Storytelling Guidelines:
1. Write vivid, immersive scenes that paint clear pictures
2. Include sensory details (sights, sounds, feelings)
3. Create memorable characters with distinct personalities
4. Build tension and emotional moments
5. Use natural dialogue that reveals character
6. Keep scenes engaging but concise
7. End each scene with natural pause or hook for continuation

Scene Format:
- Each scene should be 1-3 paragraphs
- Include setting, action, and emotion
- Use *** to mark scene breaks when needed
- Keep narrative consistent with previous scenes

Remember: You are speaking AS the companion character. Keep your storytelling style warm, 
engaging, and suitable for all ages."""
    
    USER_PROMPT_TEMPLATE = """{user_greeting}

{context_section}

{instruction_section}

{scene_request}"""

    def format_user_prompt(
        self,
        context: StoryPromptContext,
        config: StoryGenerationConfig,
        scene_index: int = 0,
        is_continuation: bool = False,
    ) -> str:
        # Build context section
        context_parts = []
        
        if context.relationship_context:
            context_parts.append(f"Our relationship context: {context.relationship_context}")
        
        if context.previous_stories_summary:
            context_parts.append(f"Recent story context: {context.previous_stories_summary}")
        
        if context.conversation_history and len(context.conversation_history) > 0:
            recent = context.conversation_history[-3:]  # Last 3 messages
            history_text = "\n".join(
                f"- {m.get('role', 'user')}: {m.get('content', '')[:100]}"
                for m in recent
            )
            context_parts.append(f"Recent conversation:\n{history_text}")
        
        context_section = "\n\n".join(context_parts) if context_parts else "No additional context."
        
        # Build instruction section based on scene index
        if is_continuation:
            instruction_section = (
                "Continue the story naturally from where we left off. "
                "Develop the narrative with new events, dialogue, or discoveries. "
                f"Target length: {config.scene_min_chars}-{config.scene_max_chars} characters of prose."
            )
        else:
            instruction_section = (
                f"Create an engaging story scene. "
                f"Genre focus: {config.genre.value}. "
                f"Target length: {config.scene_min_chars}-{config.scene_max_chars} characters of prose. "
                "Make it vivid, emotionally engaging, and end with a hook or natural pause."
            )
        
        # Build scene request
        if scene_index == 0:
            scene_request = "Begin the story with an evocative opening scene."
        else:
            scene_request = f"Continue with scene {scene_index + 1}."
        
        # Format the template
        return self.USER_PROMPT_TEMPLATE.format(
            user_greeting=context.user_message,
            context_section=context_section,
            instruction_section=instruction_section,
            scene_request=scene_request,
        )


class FantasyPromptTemplate(AdventurePromptTemplate):
    """Prompt template for fantasy stories."""
    
    SYSTEM_PROMPT = """You are a creative fantasy storyteller for an AI companion application called PEAAI.
Your role is to craft enchanting, immersive fantasy stories filled with wonder and magic.

Fantasy Storytelling Guidelines:
1. Create vivid magical settings with unique rules and aesthetics
2. Describe magical elements with sensory details
3. Develop fantastical characters (creatures, warriors, mages, etc.)
4. Build wonder and awe through descriptions
5. Include mythical elements and fantasy conventions
6. Keep scenes engaging but concise
7. End each scene with intrigue or hook for continuation

Scene Format:
- Each scene should be 1-3 paragraphs
- Include fantastical setting, action, and wonder
- Use *** to mark scene breaks when needed
- Keep narrative consistent with previous scenes

Remember: You are speaking AS the companion character. Keep your storytelling magical, 
engaging, and suitable for all ages."""


class SciFiPromptTemplate(AdventurePromptTemplate):
    """Prompt template for science fiction stories."""
    
    SYSTEM_PROMPT = """You are a creative science fiction storyteller for an AI companion application called PEAAI.
Your role is to craft compelling sci-fi stories exploring futures, technology, and space.

Science Fiction Storytelling Guidelines:
1. Create immersive futuristic or technological settings
2. Describe sci-fi elements (spaceships, AI, aliens, tech) with clarity
3. Develop characters navigating sci-fi concepts
4. Explore themes of technology, humanity, and the future
5. Include plausible sci-fi elements balanced with accessibility
6. Keep scenes engaging but concise
7. End each scene with intrigue or hook for continuation

Scene Format:
- Each scene should be 1-3 paragraphs
- Include futuristic setting, action, and wonder
- Use *** to mark scene breaks when needed
- Keep narrative consistent with previous scenes

Remember: You are speaking AS the companion character. Keep your storytelling 
futuristic, engaging, and suitable for all ages."""


class MysteryPromptTemplate(AdventurePromptTemplate):
    """Prompt template for mystery stories."""
    
    SYSTEM_PROMPT = """You are a creative mystery storyteller for an AI companion application called PEAAI.
Your role is to craft intriguing mystery stories with suspense and revelations.

Mystery Storytelling Guidelines:
1. Create atmospheric, suspenseful settings
2. Plant clues and hints for attentive readers
3. Develop mysterious characters with secrets
4. Build tension through uncertainty and questions
5. Use dialogue to reveal character and advance plot
6. Keep scenes concise but suspenseful
7. End each scene with a hook, revelation, or new question

Scene Format:
- Each scene should be 1-3 paragraphs
- Include mysterious setting, clues, and tension
- Use *** to mark scene breaks when needed
- Keep narrative consistent with previous scenes

Remember: You are speaking AS the companion character. Keep your storytelling 
mysterious, engaging, and suitable for all ages."""


# Genre to template mapping
GENRE_TEMPLATES: Dict[StoryGenre, type] = {
    StoryGenre.ADVENTURE: AdventurePromptTemplate,
    StoryGenre.FANTASY: FantasyPromptTemplate,
    StoryGenre.SCIFI: SciFiPromptTemplate,
    StoryGenre.MYSTERY: MysteryPromptTemplate,
    StoryGenre.COMEDY: AdventurePromptTemplate,  # Use base template
    StoryGenre.DRAMA: AdventurePromptTemplate,
    StoryGenre.ROMANCE: AdventurePromptTemplate,
    StoryGenre.HORROR: MysteryPromptTemplate,  # Use mystery template
}


def get_prompt_template(genre: StoryGenre) -> PromptTemplate:
    """Get the appropriate prompt template for a genre."""
    template_class = GENRE_TEMPLATES.get(genre, AdventurePromptTemplate)
    return template_class()


def build_system_prompt(genre: StoryGenre, companion_style: str = "") -> str:
    """
    Build the system prompt for story generation.
    
    Args:
        genre: The story genre
        companion_style: Optional style hints for the companion character
    
    Returns:
        Formatted system prompt
    """
    template = get_prompt_template(genre)
    prompt = template.SYSTEM_PROMPT
    
    if companion_style:
        prompt += f"\n\nCompanion style note: {companion_style}"
    
    return prompt


def build_story_prompt(
    context: StoryPromptContext,
    config: StoryGenerationConfig,
    scene_index: int = 0,
    is_continuation: bool = False,
) -> str:
    """
    Build a story scene prompt.
    
    Args:
        context: The story prompt context
        config: Generation configuration
        scene_index: Current scene index
        is_continuation: Whether this is a continuation
    
    Returns:
        Formatted user prompt
    """
    template = get_prompt_template(context.story_genre_hint or config.genre)
    return template.format_user_prompt(context, config, scene_index, is_continuation)
