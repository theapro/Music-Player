"""
Configuration file for AI Model System
Contains settings, presets, and system parameters.
"""

import os
from typing import Dict, Any

# Response presets configuration
RESPONSE_PRESETS = {
    "short": {
        "max_tokens": 150, 
        "description": "Qisqa javoblar",
        "temperature": 0.7,
        "min_words": 20
    },
    "medium": {
        "max_tokens": 300, 
        "description": "O'rtacha javoblar",
        "temperature": 0.8,
        "min_words": 40
    }, 
    "long": {
        "max_tokens": 500, 
        "description": "Uzun javoblar",
        "temperature": 0.8,
        "min_words": 80
    },
    "detailed": {
        "max_tokens": 750, 
        "description": "Batafsil javoblar",
        "temperature": 0.9,
        "min_words": 100
    }
}

# Model configuration
MODEL_CONFIG = {
    "default_model": "gpt-3.5-turbo",
    "fallback_model": "gpt-3.5-turbo",
    "max_context_length": 4096,
    "default_temperature": 0.8,
    "default_top_p": 0.95,
    "default_top_k": 40,
    "repetition_penalty": 1.1,
    "length_penalty": 1.0,
    "early_stopping": False
}

# Persona settings
PERSONA_CONFIG = {
    "default_persona": "echoza",
    "conversation_history_limit": 10,
    "context_window_conversations": 2,
    "min_response_length": 20,
    "preferred_response_length": 150,
    "max_response_length": 500
}

# University information settings
UNIVERSITY_CONFIG = {
    "name": "Japan Digital University",
    "short_name": "JDU",
    "founded": "2021",
    "type": "Private University",
    "focus": "Digital Technologies and Innovation",
    "contact_recommendation": "For specific information, contact the university directly or visit their official website"
}

# Response quality settings
QUALITY_CONFIG = {
    "min_words_for_detailed_questions": 50,
    "incomplete_response_indicators": [
        "ends_with_comma",
        "ends_with_conjunction",
        "too_short",
        "no_proper_ending"
    ],
    "generic_response_threshold": 15,  # words
    "completion_indicators": [".", "!", "?", "Thank you", "Is there anything else"],
    "enhancement_triggers": {
        "university_keywords": ["university", "jdu", "college", "school", "admission"],
        "application_keywords": ["apply", "application", "admission", "enroll"],
        "leadership_keywords": ["president", "leadership", "administration", "director"]
    }
}

# Logging configuration
LOGGING_CONFIG = {
    "level": "INFO",
    "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    "enable_file_logging": True,
    "log_file": "ai_system.log"
}

# Error handling configuration
ERROR_CONFIG = {
    "max_retries": 3,
    "retry_delay": 1.0,
    "fallback_enabled": True,
    "error_response_template": "I apologize, but I encountered an issue while processing your question. Please try rephrasing your question or contact support if this continues."
}

# Performance settings
PERFORMANCE_CONFIG = {
    "streaming_chunk_size": 5,  # words per chunk
    "max_generation_time": 30,  # seconds
    "cache_responses": True,
    "cache_size": 100
}


def get_config_section(section: str) -> Dict[str, Any]:
    """
    Get a specific configuration section.
    
    Args:
        section: Name of the configuration section
        
    Returns:
        Configuration dictionary for the section
    """
    config_sections = {
        "response_presets": RESPONSE_PRESETS,
        "model": MODEL_CONFIG,
        "persona": PERSONA_CONFIG,
        "university": UNIVERSITY_CONFIG,
        "quality": QUALITY_CONFIG,
        "logging": LOGGING_CONFIG,
        "error": ERROR_CONFIG,
        "performance": PERFORMANCE_CONFIG
    }
    
    return config_sections.get(section, {})


def get_environment_config() -> Dict[str, Any]:
    """
    Get configuration from environment variables.
    
    Returns:
        Dictionary of environment-based configuration
    """
    return {
        "debug_mode": os.getenv("AI_DEBUG_MODE", "false").lower() == "true",
        "log_level": os.getenv("AI_LOG_LEVEL", "INFO"),
        "model_name": os.getenv("AI_MODEL_NAME", "default"),
        "persona_name": os.getenv("AI_PERSONA_NAME", "echoza"),
        "max_tokens": int(os.getenv("AI_MAX_TOKENS", "500")),
        "temperature": float(os.getenv("AI_TEMPERATURE", "0.8"))
    }


def validate_config() -> bool:
    """
    Validate the configuration settings.
    
    Returns:
        bool: True if configuration is valid, False otherwise
    """
    try:
        # Check response presets
        for preset, config in RESPONSE_PRESETS.items():
            if not all(key in config for key in ["max_tokens", "description", "temperature"]):
                return False
            if config["max_tokens"] <= 0 or config["temperature"] <= 0:
                return False
        
        # Check model config
        if MODEL_CONFIG["max_context_length"] <= 0:
            return False
        if not (0 < MODEL_CONFIG["default_temperature"] <= 2):
            return False
        
        # Check persona config
        if PERSONA_CONFIG["conversation_history_limit"] <= 0:
            return False
        
        return True
    
    except (KeyError, ValueError, TypeError):
        return False


def get_prompt_templates() -> Dict[str, str]:
    """
    Get prompt templates for different scenarios.
    
    Returns:
        Dictionary of prompt templates
    """
    return {
        "system_base": """You are {persona_name}, a {persona_role}. {system_prompt}

University Information: {university_info}

Response Guidelines:
- Provide complete, well-structured answers
- Be conversational and friendly
- Always finish your thoughts completely
- For university questions, provide general guidance and suggest contacting administration
- Minimum response length: {min_words} words for detailed questions""",
        
        "conversation_context": """<|conversation_history|>
{conversation_history}

<|current_interaction|>
User: {user_prompt}
{persona_name}: I'll provide you with a complete and helpful response to your question.""",
        
        "fallback_template": """I understand you're asking about: {user_prompt}. {fallback_content}

For specific information about {topic}, I recommend contacting the relevant department or visiting official resources for the most accurate and up-to-date information.

Is there anything else I can help you with?""",
        
        "error_template": """I apologize, but I encountered an issue while processing your question about: {user_prompt}

Please try:
1. Rephrasing your question
2. Being more specific about what you'd like to know
3. Contacting support if this issue continues

Your question was: {user_prompt}"""
    }


# Export main configurations
__all__ = [
    "RESPONSE_PRESETS",
    "MODEL_CONFIG", 
    "PERSONA_CONFIG",
    "UNIVERSITY_CONFIG",
    "QUALITY_CONFIG",
    "LOGGING_CONFIG",
    "ERROR_CONFIG",
    "PERFORMANCE_CONFIG",
    "get_config_section",
    "get_environment_config",
    "validate_config",
    "get_prompt_templates"
]