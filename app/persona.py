"""
Enhanced Persona System for AI Assistant
Provides robust persona management with better prompts and conversation handling.
"""

from typing import Dict, List, Any
from datetime import datetime


def get_default_persona() -> Dict[str, Any]:
    """
    Get the default persona configuration for Echoza AI Assistant.
    
    Returns:
        Dict containing persona configuration with enhanced system prompts
        and personality traits for better conversation handling.
    """
    return {
        "name": "Echoza",
        "role": "Professional AI Assistant",
        "system_prompt": """You are Echoza, a professional AI assistant created to help students and users with various tasks. You are knowledgeable, helpful, and always provide complete, detailed responses.

Key instructions:
- Always provide complete, well-structured answers
- Be conversational and friendly
- If you don't know something specific, explain what you do know and suggest where to find more information
- For university-related questions, provide general guidance and suggest contacting administration
- Always finish your thoughts completely
- Provide detailed explanations when possible
- Be encouraging and supportive

Remember: You must always complete your responses fully. Never stop mid-sentence.""",
        "personality_traits": [
            "helpful", "knowledgeable", "professional", "encouraging"
        ],
        "conversation_style": "detailed_and_complete",
        "response_guidelines": {
            "min_response_length": 50,  # Minimum words for detailed questions
            "preferred_response_length": 150,  # Preferred word count
            "max_response_length": 500,  # Maximum words to prevent overly long responses
            "completion_indicators": [
                ".", "!", "?", "Thank you", "Is there anything else"
            ]
        }
    }


def get_university_info() -> str:
    """
    Get comprehensive university information for context.
    
    Returns:
        String containing university information for AI responses.
    """
    return """JDU (Japan Digital University) is a private university founded in 2021, specializing in digital technologies and innovation. 
    
Key Information:
- Founded: 2021
- Type: Private University
- Focus: Digital Technologies and Innovation
- Programs: Various technology and digital innovation programs
    
For specific information about:
- Admissions procedures and requirements
- Program details and curriculum
- Administrative contacts
- Application deadlines
- Tuition and fees
- Campus facilities
    
Students should contact the university directly through their official website or administration office."""


def get_persona_by_name(name: str) -> Dict[str, Any]:
    """
    Get persona configuration by name.
    
    Args:
        name: Name of the persona to retrieve
        
    Returns:
        Dict containing persona configuration
    """
    personas = {
        "echoza": get_default_persona(),
        "default": get_default_persona()
    }
    
    return personas.get(name.lower(), get_default_persona())


def validate_persona(persona: Dict[str, Any]) -> bool:
    """
    Validate persona configuration.
    
    Args:
        persona: Persona dictionary to validate
        
    Returns:
        bool: True if persona is valid, False otherwise
    """
    required_fields = ["name", "role", "system_prompt", "personality_traits"]
    
    for field in required_fields:
        if field not in persona:
            return False
            
    if not isinstance(persona["personality_traits"], list):
        return False
        
    if len(persona["system_prompt"].strip()) < 50:
        return False
        
    return True


def enhance_persona_context(persona: Dict[str, Any], conversation_history: List[Dict] = None) -> str:
    """
    Enhance persona context with conversation history and guidelines.
    
    Args:
        persona: Persona configuration
        conversation_history: List of previous conversations
        
    Returns:
        Enhanced context string for better AI responses
    """
    context_parts = []
    
    # Add system prompt
    context_parts.append(f"<|system|>\n{persona['system_prompt']}")
    
    # Add university information
    context_parts.append(f"\n<|university_info|>\n{get_university_info()}")
    
    # Add personality guidelines
    traits = ", ".join(persona.get("personality_traits", []))
    context_parts.append(f"\n<|personality|>\nYou should be: {traits}")
    
    # Add response guidelines
    guidelines = persona.get("response_guidelines", {})
    min_length = guidelines.get("min_response_length", 50)
    context_parts.append(f"\n<|response_guidelines|>\n- Provide responses with at least {min_length} words for detailed questions")
    context_parts.append("- Always complete your thoughts and sentences")
    context_parts.append("- Be specific and helpful in your answers")
    context_parts.append("- If you don't have specific information, explain what you do know")
    
    # Add conversation history if available
    if conversation_history:
        context_parts.append("\n<|conversation_history|>")
        recent_conversations = conversation_history[-2:]  # Last 2 conversations
        for conv in recent_conversations:
            user_msg = conv.get('user', '')[:100]
            ai_msg = conv.get('ai', '')[:150]
            context_parts.append(f"User: {user_msg}")
            context_parts.append(f"{persona['name']}: {ai_msg}\n")
    
    return "\n".join(context_parts)


def get_fallback_responses() -> Dict[str, str]:
    """
    Get fallback responses for common scenarios.
    
    Returns:
        Dict mapping scenario types to fallback responses
    """
    return {
        "application": """To apply to Japan Digital University (JDU), you typically need to:

1. Visit the official university website for current application requirements
2. Check admission deadlines and requirements for your desired program
3. Prepare required documents (transcripts, language proficiency scores, etc.)
4. Submit your application through the official portal
5. Pay application fees if required

For the most accurate and up-to-date information about the application process, admission requirements, and deadlines, I recommend contacting JDU's admissions office directly or visiting their official website.""",
        
        "president": """I don't have specific information about JDU's current president in my database. For accurate information about the university's leadership and administration, I recommend:

1. Visiting the official JDU website
2. Checking the "About Us" or "Leadership" section
3. Contacting the university's main office directly
4. Looking at recent university announcements or press releases

This will ensure you get the most current and accurate information about the university's administration.""",
        
        "general": """Thank you for your question. While I'd like to provide more specific details, I recommend contacting the relevant department or checking official resources for the most accurate information. For university-related questions, the administration office or official website would be your best source for current and detailed information.""",
        
        "incomplete": """I apologize, but it seems my previous response may have been incomplete. Let me provide you with a more comprehensive answer. For specific information about your question, I recommend contacting the appropriate department or visiting official resources for the most accurate and up-to-date information."""
    }