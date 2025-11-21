from openai import AsyncOpenAI
from typing import Dict, Any
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


# Singleton instance
ai_service = AIService()
