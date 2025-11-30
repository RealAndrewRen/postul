from openai import AsyncOpenAI
from typing import Dict, Any, List, Optional
import logging
import json

from config import settings
from schema import ExtendedIdeaAnalysis

logger = logging.getLogger(__name__)


class AIService:
    """Service for OpenAI integration and AI-powered analysis generation."""

    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.openai_api_key)
        self.model = settings.openai_model

    async def analyze_idea(self, transcribed_text: str) -> ExtendedIdeaAnalysis:
        """
        Generate AI analysis for a startup idea using structured output.

        Args:
            transcribed_text: The transcribed text from voice input

        Returns:
            ExtendedIdeaAnalysis instance with scores and sources
        """
        prompt = self._build_analysis_prompt(transcribed_text)

        try:
            # Use Responses API with structured outputs
            response = await self.client.responses.parse(
                model=self.model,
                input=[
                    {
                        "role": "system",
                        "content": "You are an expert startup advisor and innovation consultant. "
                        "Your role is to help aspiring entrepreneurs validate their startup ideas "
                        "by providing clear, actionable feedback and analysis. "
                        "Focus on problem validation, market clarity, and practical next steps. "
                        "Provide realistic scores: saturation_score (0-10, higher = more saturated market), "
                        "juicy_score (0-10, higher = more promising idea). "
                        "Include 2-4 relevant research sources with titles and URLs.",
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=0.7,
                text_format=ExtendedIdeaAnalysis,
            )

            logger.info(
                f"Successfully generated structured analysis for idea (length: {len(transcribed_text)})"
            )
            return response.output_parsed

        except Exception as e:
            logger.error(f"Error generating AI analysis: {e}", exc_info=True)
            # Return a fallback analysis structure
            return self._get_fallback_analysis(transcribed_text)

    def _build_analysis_prompt(self, transcribed_text: str) -> str:
        """Build the prompt for AI analysis."""
        return f"""Analyze the following startup idea and provide a comprehensive analysis:

Idea: {transcribed_text}

Provide a detailed analysis including:
1. Problem statement: A clear, research-backed problem statement that the idea addresses
2. Summary: A brief summary of the idea and its core value proposition
3. Strengths: Key strengths and potential advantages of this idea
4. Weaknesses: Potential weaknesses, risks, or challenges
5. Opportunities: Market opportunities and growth potential
6. Threats: Competitive threats and market risks
7. Actionable items: 3-5 specific, actionable steps to validate this idea
8. Validation priority: High/Medium/Low based on idea clarity and market potential
9. Saturation score: Rate market saturation from 0-10 (0 = untapped market, 10 = highly saturated)
10. Juicy score: Rate idea potential/promise from 0-10 (0 = low potential, 10 = high potential)
11. Sources: Include 2-4 relevant research sources (articles, studies, reports) with titles and URLs

Focus on:
- Problem clarity and validation needs
- Market opportunity assessment
- Practical next steps for validation
- Critical assumptions that need testing
- Realistic scoring based on market research

Be constructive, specific, and actionable in your feedback."""

    def _parse_text_response(self, content: str) -> Dict[str, Any]:
        """Parse text response when JSON parsing fails."""
        # Simple fallback parser - extract sections from text
        analysis = {
            "problem_statement": "",
            "summary": content[:500] if len(content) > 500 else content,
            "strengths": "",
            "weaknesses": "",
            "opportunities": "",
            "threats": "",
            "actionable_items": [],
            "validation_priority": "Medium",
        }
        return analysis

    def _normalize_analysis(self, analysis: Dict[str, Any]) -> Dict[str, Any]:
        """Ensure analysis has all required fields with defaults."""
        return {
            "problem_statement": analysis.get("problem_statement", ""),
            "summary": analysis.get("summary", ""),
            "strengths": analysis.get("strengths", ""),
            "weaknesses": analysis.get("weaknesses", ""),
            "opportunities": analysis.get("opportunities", ""),
            "threats": analysis.get("threats", ""),
            "actionable_items": analysis.get("actionable_items", []),
            "validation_priority": analysis.get("validation_priority", "Medium"),
        }

    def _get_fallback_analysis(self, transcribed_text: str) -> ExtendedIdeaAnalysis:
        """Return a fallback analysis when AI service fails."""
        return ExtendedIdeaAnalysis(
            problem_statement="Unable to generate problem statement. Please try again.",
            summary=f"Analysis for: {transcribed_text[:200]}...",
            strengths="Analysis temporarily unavailable",
            weaknesses="Analysis temporarily unavailable",
            opportunities="Analysis temporarily unavailable",
            threats="Analysis temporarily unavailable",
            actionable_items=[
                "Review and refine your idea statement",
                "Try submitting your idea again",
                "Consider breaking down your idea into smaller components",
            ],
            validation_priority="Medium",
            saturation_score=5.0,
            juicy_score=5.0,
            sources=[],
        )

    async def tiki_taka_conversation(
        self, 
        transcribed_text: str, 
        conversation_history: list[Dict[str, str]] = None,
        idea_context: str = None
    ) -> str:
        """
        Generate an advisor response for tiki-taka conversation mode.
        Acts as a thoughtful advisor to help users think through their ideas.

        Args:
            transcribed_text: The user's current transcribed voice input
            conversation_history: Previous conversation messages (list of dicts with 'role' and 'content')
            idea_context: Optional initial idea context if this is the start of a conversation

        Returns:
            Advisor's response text
        """
        # Build conversation messages
        messages = []
        
        # System prompt for advisor role
        system_prompt = """You are a thoughtful startup advisor and innovation consultant. Your role is to help users think through their startup ideas through Socratic questioning and gentle guidance.

Key principles:
- Ask thoughtful questions that help users discover insights themselves
- Don't provide direct answers or analysis - guide them to think deeper
- Be encouraging and supportive, but also help them identify potential blind spots
- Focus on problem validation, market understanding, and critical assumptions
- Keep responses concise (2-4 sentences) - this is a back-and-forth conversation
- Use a conversational, friendly tone
- Help users explore different angles of their idea
- If they're stuck, offer gentle prompts or suggest areas to consider

Your goal is to help users think critically about their idea, not to analyze it for them."""
        
        messages.append({"role": "system", "content": system_prompt})
        
        # Add initial idea context if this is the start of a conversation
        if idea_context and (not conversation_history or len(conversation_history) == 0):
            messages.append({
                "role": "user", 
                "content": f"I have an idea: {idea_context}"
            })
            # Add a first advisor response if we have context
            if conversation_history is None:
                conversation_history = []
        
        # Add conversation history
        if conversation_history:
            for msg in conversation_history:
                # Ensure we have the right format
                if isinstance(msg, dict):
                    messages.append({
                        "role": msg.get("role", "user"),
                        "content": msg.get("content", "")
                    })
        
        # Add current user message
        messages.append({
            "role": "user",
            "content": transcribed_text
        })
        
        try:
            # Use chat completion API for conversation
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.8,  # Slightly higher for more natural conversation
                max_tokens=300,  # Keep responses concise
            )
            
            advisor_message = response.choices[0].message.content.strip()
            logger.info(f"Generated tiki-taka advisor response (length: {len(advisor_message)})")
            return advisor_message
            
        except Exception as e:
            logger.error(f"Error generating tiki-taka conversation: {e}", exc_info=True)
            # Return a fallback response
            return "That's an interesting thought! Can you tell me more about what problem you're trying to solve with this idea?"

    async def generate_project_details(self, transcribed_text: str) -> Dict[str, str]:
        """
        Generate project name and description from transcribed text using AI.

        Args:
            transcribed_text: The transcribed text from voice input

        Returns:
            Dictionary with 'name' and 'description' keys
        """
        from pydantic import BaseModel, Field

        class ProjectDetails(BaseModel):
            """Project details model for structured output."""

            name: str = Field(
                ...,
                min_length=1,
                max_length=255,
                description="Concise project name (2-5 words)",
            )
            description: str = Field(
                ...,
                min_length=50,
                description="Detailed project description (2-4 sentences)",
            )

        prompt = f"""Based on the following startup idea, generate a concise project name and detailed description:

Idea: {transcribed_text}

Generate:
1. A concise, memorable project name (2-5 words) that captures the essence of the idea
2. A detailed description (2-4 sentences) that explains what the project is about, its core value proposition, and key features

The name should be:
- Memorable and brandable
- Clear and descriptive
- Professional

The description should be:
- Clear and comprehensive
- Highlight the core value proposition
- Mention key features or benefits
- Professional tone"""

        try:
            # Use Responses API with structured outputs
            response = await self.client.responses.parse(
                model=self.model,
                input=[
                    {
                        "role": "system",
                        "content": "You are an expert at creating project names and descriptions for startup ideas. "
                        "Generate concise, professional, and memorable project names and descriptions.",
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=0.8,
                text_format=ProjectDetails,
            )

            # Parse the structured response from JSON
            return response.output_parsed


        except Exception as e:
            logger.error(f"Error generating project details: {e}", exc_info=True)
            # Fallback
            return {
                "name": transcribed_text[:50].strip() or "New Project",
                "description": transcribed_text[:500] or "A new project idea.",
            }

    async def generate_survey_posts(
        self,
        idea_context: str,
        platform: Optional[str] = None,
        count: int = 3
    ) -> List[Dict[str, str]]:
        """
        Generate survey post messages for social media platforms (X/Twitter or Threads).
        Uses OpenAI Responses API with structured output to generate engaging poll posts.

        Args:
            idea_context: The idea context (transcribed text and/or analysis summary)
            platform: Target platform ('x' or 'threads'), None for generic posts
            count: Number of post messages to generate (default: 3)

        Returns:
            List of dictionaries with 'id' and 'text' keys for each post message
        """
        from pydantic import BaseModel, Field

        class SurveyPost(BaseModel):
            """Single survey post message model for structured output."""
            text: str = Field(
                ...,
                min_length=10,
                max_length=500,
                description="Engaging survey post text that encourages interaction"
            )

        class SurveyPostsResponse(BaseModel):
            """Response model containing multiple survey posts."""
            posts: List[SurveyPost] = Field(
                ...,
                min_length=1,
                max_length=10,
                description="List of survey post messages"
            )

        # Build platform-specific instructions
        platform_instructions = ""
        char_limit = 280  # Default to X/Twitter limit
        
        if platform == "x":
            platform_instructions = """
- Optimize for X (Twitter) format: concise, punchy, engaging
- Character limit: 280 characters
- Use hashtags sparingly (1-2 max)
- Include emojis to increase engagement
- Make it shareable and retweetable
- Focus on asking thought-provoking questions
"""
            char_limit = 280
        elif platform == "threads":
            platform_instructions = """
- Optimize for Threads format: conversational, engaging
- Character limit: 500 characters
- Can be slightly longer and more conversational than X
- Use emojis naturally
- Encourage discussion and replies
- Focus on community engagement
"""
            char_limit = 500
        else:
            platform_instructions = """
- Create engaging survey posts suitable for social media
- Keep posts concise and engaging
- Include questions that encourage interaction
- Use emojis appropriately
- Make posts shareable and discussion-worthy
"""

        prompt = f"""Generate {count} engaging survey post messages based on the following startup idea context.

Idea Context:
{idea_context}

{platform_instructions}

Requirements for each post:
1. Should be engaging and encourage interaction (likes, replies, shares)
2. Should relate to the idea and invite audience feedback
3. Should be formatted as a question or poll-style post
4. Should be concise and within {char_limit} characters
5. Should use appropriate emojis (1-3 per post)
6. Should be professional yet conversational
7. Each post should have a slightly different angle or focus
8. Should encourage people to share their thoughts or vote/respond

Generate {count} unique, engaging survey posts that will help validate this startup idea through social media engagement."""

        try:
            # Use Responses API with structured outputs
            response = await self.client.responses.parse(
                model=self.model,
                input=[
                    {
                        "role": "system",
                        "content": "You are an expert social media content creator specializing in engaging survey posts and polls. "
                        "You create posts that encourage interaction, discussion, and feedback. "
                        "Your posts are concise, engaging, and optimized for social media platforms. "
                        "You understand how to craft questions that invite meaningful responses and engagement.",
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=0.8,  # Higher temperature for more creative variations
                text_format=SurveyPostsResponse,
            )

            # Extract posts from structured response
            posts_response = response.output_parsed
            
            # Convert to list of dicts with IDs
            messages = []
            for idx, post in enumerate(posts_response.posts, start=1):
                messages.append({
                    "id": str(idx),
                    "text": post.text
                })

            logger.info(f"Successfully generated {len(messages)} survey posts for platform: {platform or 'generic'}")
            return messages

        except Exception as e:
            logger.error(f"Error generating survey posts: {e}", exc_info=True)
            # Return fallback posts
            return self._get_fallback_survey_posts(idea_context, count)

    def _get_fallback_survey_posts(self, idea_context: str, count: int) -> List[Dict[str, str]]:
        """Return fallback survey posts when AI service fails."""
        # Create simple fallback posts based on idea context
        idea_preview = idea_context[:100] + "..." if len(idea_context) > 100 else idea_context
        
        fallback_posts = [
            {
                "id": "1",
                "text": f"What do you think about {idea_preview}? Would love your thoughts! 🚀"
            },
            {
                "id": "2",
                "text": f"I'm exploring {idea_preview}... What's your take? 💭"
            },
            {
                "id": "3",
                "text": f"Quick poll: {idea_preview}... Thoughts? 🤔"
            }
        ]
        
        return fallback_posts[:count]


# Singleton instance
ai_service = AIService()
