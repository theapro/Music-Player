"""
AI Model Response System
Enhanced persona system and text generation with improved response quality.
"""

from .persona import (
    get_default_persona,
    get_university_info,
    get_persona_by_name,
    validate_persona,
    enhance_persona_context,
    get_fallback_responses
)

__version__ = "1.0.0"
__author__ = "AI Model Response System"
__description__ = "Enhanced AI assistant with improved response quality and completion validation"

__all__ = [
    "get_default_persona",
    "get_university_info", 
    "get_persona_by_name",
    "validate_persona",
    "enhance_persona_context",
    "get_fallback_responses"
]