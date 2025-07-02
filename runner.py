"""
Enhanced AI Model Runner with Improved Generation Parameters
Handles text generation with better response quality and completion validation.
"""

import logging
import re
from typing import Dict, List, Any, Generator, Optional
from datetime import datetime
from app.persona import (
    get_default_persona, 
    enhance_persona_context, 
    get_fallback_responses,
    validate_persona
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class AIModelRunner:
    """
    Enhanced AI Model Runner with improved generation parameters and response validation.
    """
    
    def __init__(self, model_name: str = "default", persona: Dict[str, Any] = None):
        """
        Initialize the AI Model Runner.
        
        Args:
            model_name: Name of the model to use
            persona: Persona configuration dictionary
        """
        self.model_name = model_name
        self.persona = persona or get_default_persona()
        self.conversation_history = []
        self.fallback_responses = get_fallback_responses()
        
        # Validate persona
        if not validate_persona(self.persona):
            logger.warning("Invalid persona provided, using default")
            self.persona = get_default_persona()
        
        # Initialize tokenizer placeholders (would be actual tokenizer in real implementation)
        self.tokenizer = self._initialize_tokenizer()
        
        logger.info(f"AI Model Runner initialized with persona: {self.persona['name']}")
    
    def _initialize_tokenizer(self):
        """
        Initialize tokenizer (placeholder for actual implementation).
        In a real implementation, this would load the actual tokenizer.
        """
        # Placeholder tokenizer object
        class MockTokenizer:
            def __init__(self):
                self.pad_token_id = 0
                self.eos_token_id = 2
            
            def encode(self, text, return_tensors=None):
                # Simple mock encoding - in real implementation would use actual tokenizer
                return {"input_ids": [1] * min(len(text.split()), 512)}
            
            def decode(self, tokens):
                # Simple mock decoding
                return " ".join(["token"] * len(tokens))
        
        return MockTokenizer()
    
    def _calculate_smart_max_tokens(self, prompt: str, max_tokens: int = None) -> int:
        """
        Calculate smart maximum tokens based on prompt and response requirements.
        
        Args:
            prompt: Input prompt
            max_tokens: Maximum tokens limit
            
        Returns:
            Calculated maximum tokens
        """
        base_tokens = 150  # Base response length
        
        # Adjust based on prompt length and type
        if any(keyword in prompt.lower() for keyword in ["explain", "describe", "detailed", "how"]):
            base_tokens = 300
        
        if any(keyword in prompt.lower() for keyword in ["list", "steps", "process"]):
            base_tokens = 250
        
        if len(prompt.split()) > 20:  # Longer prompts might need longer responses
            base_tokens += 100
        
        # Apply limits
        smart_max_tokens = min(base_tokens, max_tokens or 500)
        smart_max_tokens = max(smart_max_tokens, 50)  # Minimum tokens
        
        return smart_max_tokens
    
    def _get_generation_kwargs(self, smart_max_tokens: int) -> Dict[str, Any]:
        """
        Get enhanced generation parameters for better response quality.
        
        Args:
            smart_max_tokens: Maximum tokens to generate
            
        Returns:
            Dictionary of generation parameters
        """
        return {
            "max_new_tokens": smart_max_tokens,
            "min_new_tokens": 20,  # Ensure minimum response length
            "do_sample": True,
            "temperature": 0.8,  # Slightly higher for creativity while maintaining coherence
            "top_p": 0.95,  # Increase for more diverse responses
            "top_k": 40,  # Increase for better word selection
            "repetition_penalty": 1.1,  # Increase to avoid repetition
            "pad_token_id": self.tokenizer.pad_token_id,
            "eos_token_id": self.tokenizer.eos_token_id,
            "use_cache": True,
            "num_beams": 1,
            "early_stopping": False,  # Don't stop early to ensure complete responses
            "length_penalty": 1.0,  # Encourage longer responses
            "no_repeat_ngram_size": 3,  # Prevent repetitive n-grams
        }
    
    def _validate_and_complete_response(self, response: str, original_prompt: str) -> str:
        """
        Validate response and ensure it's complete and relevant.
        
        Args:
            response: Generated response
            original_prompt: Original user prompt
            
        Returns:
            Validated and potentially enhanced response
        """
        if not response or not response.strip():
            return self.fallback_responses["general"]
        
        # Check for incomplete responses
        incomplete_indicators = [
            response.endswith(','),
            response.endswith(' and'),
            response.endswith(' but'),
            response.endswith(' however'),
            response.endswith(' because'),
            response.endswith(' so'),
            response.endswith(' therefore'),
            len(response.split()) < 5,  # Too short
            not response.strip().endswith(('.', '!', '?')),  # No proper ending
        ]
        
        if any(incomplete_indicators):
            # Provide more complete responses based on prompt content
            if any(keyword in original_prompt.lower() for keyword in ['apply', 'application', 'admission']):
                return self.fallback_responses["application"]
            
            elif any(keyword in original_prompt.lower() for keyword in ['president', 'leadership', 'administration']):
                return self.fallback_responses["president"]
            
            elif len(response.split()) < 10:  # Very short response
                return f"Thank you for your question about {original_prompt[:50]}{'...' if len(original_prompt) > 50 else ''}. {self.fallback_responses['general']}"
            
            else:
                # Try to complete the response
                return f"{response.rstrip('.,!?')}. {self.fallback_responses['incomplete']}"
        
        # Check if response is too generic or irrelevant
        generic_phrases = ['yes, there', 'i can help', 'certainly', 'of course']
        if len(response.split()) < 15 and any(phrase in response.lower() for phrase in generic_phrases):
            # Enhance with more specific information
            if any(keyword in original_prompt.lower() for keyword in ['university', 'jdu', 'college', 'school']):
                return f"{response} For specific information about JDU (Japan Digital University), I recommend contacting the university directly or visiting their official website for the most accurate and up-to-date information about programs, admissions, and services."
            else:
                return f"{response} Is there anything specific you'd like to know more about? I'm here to help with detailed information and guidance."
        
        return response
    
    def _format_enhanced_prompt(self, prompt: str) -> str:
        """
        Format prompt with enhanced context and persona information.
        
        Args:
            prompt: User input prompt
            
        Returns:
            Enhanced formatted prompt
        """
        # Get enhanced persona context
        enhanced_context = enhance_persona_context(self.persona, self.conversation_history)
        
        # Format the complete prompt
        formatted_prompt = f"""{enhanced_context}

<|current_interaction|>
User: {prompt}
{self.persona["name"]}: I'll provide you with a complete and helpful response to your question."""
        
        return formatted_prompt
    
    def generate_text_streaming(self, prompt: str, max_tokens: int = None, response_preset: str = None) -> Generator[Dict[str, Any], None, None]:
        """
        Generate text with streaming output and enhanced parameters.
        
        Args:
            prompt: Input prompt
            max_tokens: Maximum tokens to generate
            response_preset: Response preset configuration
            
        Yields:
            Dictionary containing response chunks with metadata
        """
        try:
            # Calculate smart token limits
            smart_max_tokens = self._calculate_smart_max_tokens(prompt, max_tokens)
            
            # Apply response preset adjustments
            if response_preset:
                preset_configs = self._get_response_presets()
                if response_preset in preset_configs:
                    smart_max_tokens = min(smart_max_tokens, preset_configs[response_preset]["max_tokens"])
            
            # Format enhanced prompt
            formatted_prompt = self._format_enhanced_prompt(prompt)
            
            # Get generation parameters
            generation_kwargs = self._get_generation_kwargs(smart_max_tokens)
            
            # Log generation attempt
            logger.info(f"Generating response for prompt: {prompt[:100]}...")
            logger.info(f"Using max_tokens: {smart_max_tokens}")
            
            # Simulate text generation (in real implementation, this would use actual model)
            response = self._simulate_text_generation(formatted_prompt, generation_kwargs)
            
            # Validate and complete response
            validated_response = self._validate_and_complete_response(response, prompt)
            
            # Store in conversation history
            self.conversation_history.append({
                "user": prompt,
                "ai": validated_response,
                "timestamp": datetime.now().isoformat()
            })
            
            # Keep only recent history (last 10 conversations)
            if len(self.conversation_history) > 10:
                self.conversation_history = self.conversation_history[-10:]
            
            # Yield response in chunks (simulating streaming)
            words = validated_response.split()
            current_chunk = ""
            
            for i, word in enumerate(words):
                current_chunk += word + " "
                
                # Yield chunk every few words
                if (i + 1) % 5 == 0 or i == len(words) - 1:
                    yield {
                        "type": "content",
                        "content": current_chunk.strip(),
                        "chunk_index": i // 5,
                        "is_final": i == len(words) - 1,
                        "timestamp": datetime.now().isoformat(),
                        "word_count": len(current_chunk.split()),
                        "total_words": len(words)
                    }
                    current_chunk = ""
        
        except Exception as e:
            logger.error(f"Error in text generation: {str(e)}")
            
            # Provide fallback response
            fallback_response = f"I apologize, but I encountered an issue while processing your question. Please try rephrasing your question or contact support if this continues. Your question was: {prompt[:100]}{'...' if len(prompt) > 100 else ''}"
            
            yield {
                "type": "error",
                "content": fallback_response,
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
    
    def _simulate_text_generation(self, prompt: str, generation_kwargs: Dict[str, Any]) -> str:
        """
        Simulate text generation (placeholder for actual model inference).
        
        Args:
            prompt: Formatted prompt
            generation_kwargs: Generation parameters
            
        Returns:
            Generated response text
        """
        # This is a simulation - in real implementation, this would call the actual model
        # For now, return contextually appropriate responses based on prompt content
        
        user_input = ""
        if "User:" in prompt:
            user_input = prompt.split("User:")[-1].split(self.persona["name"] + ":")[0].strip()
        
        # Generate contextually appropriate responses
        if any(keyword in user_input.lower() for keyword in ['hello', 'hi', 'hey']):
            return f"Hello! I'm {self.persona['name']}, your AI assistant. I'm here to help you with any questions or tasks you might have. Whether you need information about university programs, academic guidance, or general assistance, I'm ready to provide detailed and helpful responses. What would you like to know about today?"
        
        elif any(keyword in user_input.lower() for keyword in ['apply', 'application', 'admission']):
            return self.fallback_responses["application"]
        
        elif any(keyword in user_input.lower() for keyword in ['president', 'leadership']):
            return self.fallback_responses["president"]
        
        elif any(keyword in user_input.lower() for keyword in ['university', 'jdu', 'japan digital']):
            return """Japan Digital University (JDU) is an innovative private university established in 2021, focusing on digital technologies and modern innovation. The university offers various programs designed to prepare students for the digital age.

Key aspects of JDU include:
- Cutting-edge curriculum in digital technologies
- Modern learning environments
- Industry-relevant programs
- Focus on practical skills and innovation

For specific information about programs, admission requirements, tuition fees, or campus facilities, I recommend contacting the university's admissions office directly or visiting their official website. They can provide you with the most current and detailed information about all aspects of university life and academic offerings.

Is there anything specific about digital technology education or university programs that you'd like to know more about?"""
        
        else:
            return f"Thank you for your question about: {user_input[:100]}{'...' if len(user_input) > 100 else ''}. I'm here to provide you with helpful and detailed information. While I'd like to give you more specific details about this topic, I recommend checking official sources or contacting relevant authorities for the most accurate and up-to-date information. Is there anything else I can help you with or any way I can provide more specific guidance?"
    
    def _get_response_presets(self) -> Dict[str, Dict[str, Any]]:
        """
        Get response preset configurations.
        
        Returns:
            Dictionary of response presets
        """
        return {
            "short": {
                "max_tokens": 150, 
                "description": "Qisqa javoblar",
                "temperature": 0.7
            },
            "medium": {
                "max_tokens": 300, 
                "description": "O'rtacha javoblar",
                "temperature": 0.8
            }, 
            "long": {
                "max_tokens": 500, 
                "description": "Uzun javoblar",
                "temperature": 0.8
            },
            "detailed": {
                "max_tokens": 750, 
                "description": "Batafsil javoblar",
                "temperature": 0.9
            }
        }
    
    def get_conversation_summary(self) -> Dict[str, Any]:
        """
        Get a summary of the current conversation.
        
        Returns:
            Dictionary containing conversation summary
        """
        return {
            "total_exchanges": len(self.conversation_history),
            "persona_name": self.persona["name"],
            "recent_topics": [conv["user"][:50] for conv in self.conversation_history[-3:]],
            "last_interaction": self.conversation_history[-1]["timestamp"] if self.conversation_history else None
        }
    
    def clear_conversation_history(self) -> None:
        """Clear the conversation history."""
        self.conversation_history = []
        logger.info("Conversation history cleared")
    
    def update_persona(self, new_persona: Dict[str, Any]) -> bool:
        """
        Update the current persona.
        
        Args:
            new_persona: New persona configuration
            
        Returns:
            bool: True if update successful, False otherwise
        """
        if validate_persona(new_persona):
            self.persona = new_persona
            logger.info(f"Persona updated to: {new_persona['name']}")
            return True
        else:
            logger.warning("Invalid persona provided, keeping current persona")
            return False


# Response preset constants for external usage
RESPONSE_PRESETS = {
    "short": {"max_tokens": 150, "description": "Qisqa javoblar"},
    "medium": {"max_tokens": 300, "description": "O'rtacha javoblar"}, 
    "long": {"max_tokens": 500, "description": "Uzun javoblar"},
    "detailed": {"max_tokens": 750, "description": "Batafsil javoblar"}
}


def create_ai_runner(model_name: str = "default", persona_name: str = "echoza") -> AIModelRunner:
    """
    Factory function to create an AI Model Runner instance.
    
    Args:
        model_name: Name of the model to use
        persona_name: Name of the persona to load
        
    Returns:
        Configured AIModelRunner instance
    """
    from app.persona import get_persona_by_name
    
    persona = get_persona_by_name(persona_name)
    return AIModelRunner(model_name=model_name, persona=persona)