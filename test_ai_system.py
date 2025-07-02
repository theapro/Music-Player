"""
Test suite for AI Model Response System
Tests the persona system, runner functionality, and response validation.
"""

import unittest
import sys
import os
from typing import List, Dict, Any

# Add the project root to the path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.persona import (
    get_default_persona,
    get_university_info,
    get_persona_by_name,
    validate_persona,
    enhance_persona_context,
    get_fallback_responses
)

from runner import AIModelRunner, create_ai_runner, RESPONSE_PRESETS


class TestPersonaSystem(unittest.TestCase):
    """Test cases for the persona system."""
    
    def test_get_default_persona(self):
        """Test default persona retrieval."""
        persona = get_default_persona()
        
        self.assertIsInstance(persona, dict)
        self.assertEqual(persona["name"], "Echoza")
        self.assertEqual(persona["role"], "Professional AI Assistant")
        self.assertIn("system_prompt", persona)
        self.assertIn("personality_traits", persona)
        self.assertIsInstance(persona["personality_traits"], list)
        self.assertGreater(len(persona["system_prompt"]), 100)
    
    def test_university_info(self):
        """Test university information retrieval."""
        uni_info = get_university_info()
        
        self.assertIsInstance(uni_info, str)
        self.assertIn("JDU", uni_info)
        self.assertIn("Japan Digital University", uni_info)
        self.assertIn("2021", uni_info)
        self.assertGreater(len(uni_info), 100)
    
    def test_persona_validation(self):
        """Test persona validation."""
        valid_persona = get_default_persona()
        self.assertTrue(validate_persona(valid_persona))
        
        # Test invalid persona
        invalid_persona = {"name": "Test"}
        self.assertFalse(validate_persona(invalid_persona))
        
        # Test persona missing required fields
        incomplete_persona = {
            "name": "Test",
            "role": "Assistant"
        }
        self.assertFalse(validate_persona(incomplete_persona))
    
    def test_persona_by_name(self):
        """Test persona retrieval by name."""
        echoza = get_persona_by_name("echoza")
        default = get_persona_by_name("default")
        nonexistent = get_persona_by_name("nonexistent")
        
        self.assertEqual(echoza["name"], "Echoza")
        self.assertEqual(default["name"], "Echoza")
        self.assertEqual(nonexistent["name"], "Echoza")  # Should return default
    
    def test_enhance_persona_context(self):
        """Test persona context enhancement."""
        persona = get_default_persona()
        
        # Test without conversation history
        context = enhance_persona_context(persona)
        self.assertIn("<|system|>", context)
        self.assertIn("<|university_info|>", context)
        self.assertIn("<|personality|>", context)
        
        # Test with conversation history
        history = [
            {"user": "Hello", "ai": "Hi there!"},
            {"user": "How are you?", "ai": "I'm doing well, thank you!"}
        ]
        context_with_history = enhance_persona_context(persona, history)
        self.assertIn("<|conversation_history|>", context_with_history)
        self.assertIn("Hello", context_with_history)
    
    def test_fallback_responses(self):
        """Test fallback responses."""
        responses = get_fallback_responses()
        
        self.assertIsInstance(responses, dict)
        self.assertIn("application", responses)
        self.assertIn("president", responses)
        self.assertIn("general", responses)
        
        # Check response quality
        for key, response in responses.items():
            self.assertGreater(len(response.split()), 20)  # Should be substantial


class TestAIModelRunner(unittest.TestCase):
    """Test cases for the AI Model Runner."""
    
    def setUp(self):
        """Set up test cases."""
        self.runner = create_ai_runner()
    
    def test_runner_initialization(self):
        """Test runner initialization."""
        self.assertIsInstance(self.runner, AIModelRunner)
        self.assertEqual(self.runner.persona["name"], "Echoza")
        self.assertEqual(len(self.runner.conversation_history), 0)
    
    def test_smart_max_tokens_calculation(self):
        """Test smart token calculation."""
        # Test different prompt types
        simple_prompt = "Hello"
        detailed_prompt = "Please explain in detail how to apply to university"
        list_prompt = "List the steps to apply"
        
        simple_tokens = self.runner._calculate_smart_max_tokens(simple_prompt)
        detailed_tokens = self.runner._calculate_smart_max_tokens(detailed_prompt)
        list_tokens = self.runner._calculate_smart_max_tokens(list_prompt)
        
        self.assertGreater(detailed_tokens, simple_tokens)
        self.assertGreater(list_tokens, simple_tokens)
        self.assertGreaterEqual(simple_tokens, 50)  # Minimum tokens
    
    def test_generation_kwargs(self):
        """Test generation parameters."""
        kwargs = self.runner._get_generation_kwargs(200)
        
        required_params = [
            "max_new_tokens", "min_new_tokens", "temperature", 
            "top_p", "top_k", "repetition_penalty"
        ]
        
        for param in required_params:
            self.assertIn(param, kwargs)
        
        self.assertEqual(kwargs["max_new_tokens"], 200)
        self.assertGreaterEqual(kwargs["min_new_tokens"], 20)
        self.assertFalse(kwargs["early_stopping"])  # Should not stop early
    
    def test_response_validation(self):
        """Test response validation and completion."""
        # Test incomplete responses
        incomplete_responses = [
            "Yes, there",
            "I can help with",
            "The university is",
            "",  # Empty response
            "Ok"  # Too short
        ]
        
        for incomplete in incomplete_responses:
            validated = self.runner._validate_and_complete_response(incomplete, "test prompt")
            self.assertGreater(len(validated.split()), 10)  # Should be enhanced
            self.assertTrue(validated.endswith(('.', '!', '?')))  # Should end properly
    
    def test_prompt_formatting(self):
        """Test enhanced prompt formatting."""
        prompt = "How do I apply to university?"
        formatted = self.runner._format_enhanced_prompt(prompt)
        
        self.assertIn("<|system|>", formatted)
        self.assertIn("<|current_interaction|>", formatted)
        self.assertIn("Echoza", formatted)
        self.assertIn(prompt, formatted)
    
    def test_text_generation_streaming(self):
        """Test text generation with streaming."""
        test_prompts = [
            "hello",
            "how do I apply to JDU?",
            "who is the president of the university?",
            "tell me about Japan Digital University"
        ]
        
        for prompt in test_prompts:
            responses = list(self.runner.generate_text_streaming(prompt))
            
            # Should have at least one response
            self.assertGreater(len(responses), 0)
            
            # Final response should be marked as final
            final_response = responses[-1]
            if final_response["type"] == "content":
                self.assertTrue(final_response.get("is_final", False))
            
            # Combine all content chunks
            full_response = ""
            for response in responses:
                if response["type"] == "content":
                    full_response += response["content"] + " "
            
            # Validate response quality
            if full_response.strip():
                words = full_response.split()
                self.assertGreater(len(words), 15)  # Should be substantial
                
                # Check for specific prompt handling
                if "apply" in prompt.lower():
                    self.assertIn("application", full_response.lower())
                elif "president" in prompt.lower():
                    self.assertIn("university", full_response.lower())
                elif "hello" in prompt.lower():
                    self.assertIn("hello", full_response.lower())
    
    def test_conversation_history(self):
        """Test conversation history management."""
        # Generate multiple responses
        prompts = ["Hello", "How are you?", "Tell me about JDU"]
        
        for prompt in prompts:
            list(self.runner.generate_text_streaming(prompt))
        
        # Check history
        self.assertEqual(len(self.runner.conversation_history), 3)
        
        # Check history structure
        for conv in self.runner.conversation_history:
            self.assertIn("user", conv)
            self.assertIn("ai", conv)
            self.assertIn("timestamp", conv)
    
    def test_response_presets(self):
        """Test response preset functionality."""
        prompt = "Tell me about university programs"
        
        for preset_name in RESPONSE_PRESETS.keys():
            responses = list(self.runner.generate_text_streaming(prompt, response_preset=preset_name))
            
            # Should generate valid responses
            self.assertGreater(len(responses), 0)
            
            # Combine response content
            full_response = ""
            for response in responses:
                if response["type"] == "content":
                    full_response += response["content"] + " "
            
            if full_response.strip():
                self.assertGreater(len(full_response.split()), 10)
    
    def test_conversation_summary(self):
        """Test conversation summary functionality."""
        # Generate some conversation
        list(self.runner.generate_text_streaming("Hello"))
        list(self.runner.generate_text_streaming("How are you?"))
        
        summary = self.runner.get_conversation_summary()
        
        self.assertIn("total_exchanges", summary)
        self.assertIn("persona_name", summary)
        self.assertIn("recent_topics", summary)
        self.assertEqual(summary["total_exchanges"], 2)
        self.assertEqual(summary["persona_name"], "Echoza")
    
    def test_persona_update(self):
        """Test persona updating."""
        new_persona = get_default_persona()
        new_persona["name"] = "TestBot"
        
        # Valid update
        result = self.runner.update_persona(new_persona)
        self.assertTrue(result)
        self.assertEqual(self.runner.persona["name"], "TestBot")
        
        # Invalid update
        invalid_persona = {"name": "Invalid"}
        result = self.runner.update_persona(invalid_persona)
        self.assertFalse(result)
        self.assertEqual(self.runner.persona["name"], "TestBot")  # Should remain unchanged


class TestSpecificPrompts(unittest.TestCase):
    """Test specific prompts that were failing in the original system."""
    
    def setUp(self):
        """Set up test cases."""
        self.runner = create_ai_runner()
    
    def test_problematic_prompts(self):
        """Test the specific prompts mentioned in the problem statement."""
        problematic_prompts = [
            "how do I apply to",
            "hello",
            "who is the president of JDU?",
            "tell me about Japan Digital University"
        ]
        
        for prompt in problematic_prompts:
            responses = list(self.runner.generate_text_streaming(prompt))
            
            # Should not be empty
            self.assertGreater(len(responses), 0)
            
            # Combine all content
            full_response = ""
            for response in responses:
                if response["type"] == "content":
                    full_response += response["content"] + " "
            
            full_response = full_response.strip()
            
            # Should not be incomplete
            self.assertGreater(len(full_response.split()), 10)  # More than 10 words
            self.assertFalse(full_response.endswith(("Yes, there", "I can help")))  # Not cut off
            self.assertTrue(full_response.endswith(('.', '!', '?')))  # Proper ending
            
            # Should be relevant to the prompt
            if "apply" in prompt.lower():
                self.assertIn("application", full_response.lower())
            elif "hello" in prompt.lower():
                self.assertTrue("hello" in full_response.lower() or "hi" in full_response.lower(), 
                               f"Response should contain greeting: {full_response}")
            elif "president" in prompt.lower():
                self.assertTrue(any(word in full_response.lower() 
                                  for word in ["president", "leadership", "administration"]))
    
    def test_minimum_response_length(self):
        """Test that responses meet minimum length requirements."""
        test_prompts = [
            "How do I apply to university?",
            "Tell me about JDU programs",
            "What is the admission process?"
        ]
        
        for prompt in test_prompts:
            responses = list(self.runner.generate_text_streaming(prompt))
            
            # Combine response content
            full_response = ""
            for response in responses:
                if response["type"] == "content":
                    full_response += response["content"] + " "
            
            word_count = len(full_response.split())
            self.assertGreaterEqual(word_count, 20)  # Should meet minimum length for detailed questions
    
    def test_complete_sentences(self):
        """Test that responses contain complete sentences."""
        prompts = [
            "hello",
            "how do I apply?",
            "who is the president?"
        ]
        
        for prompt in prompts:
            responses = list(self.runner.generate_text_streaming(prompt))
            
            # Get final content
            full_response = ""
            for response in responses:
                if response["type"] == "content":
                    full_response += response["content"] + " "
            
            full_response = full_response.strip()
            
            # Should not end with incomplete indicators
            incomplete_endings = [", ", " and", " but", " however", " because"]
            for ending in incomplete_endings:
                self.assertFalse(full_response.endswith(ending),
                               f"Response ends with incomplete indicator '{ending}': {full_response}")


def run_specific_test_cases():
    """Run specific test cases for the problematic prompts."""
    print("Testing specific problematic prompts...\n")
    
    runner = create_ai_runner()
    
    test_cases = [
        {
            "prompt": "how do I apply to",
            "expected_keywords": ["application", "apply", "university", "contact"]
        },
        {
            "prompt": "hello",
            "expected_keywords": ["hello", "hi", "assistant", "help"]
        },
        {
            "prompt": "who is the president of JDU?",
            "expected_keywords": ["president", "leadership", "administration", "university"]
        }
    ]
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"Test Case {i}: '{test_case['prompt']}'")
        print("-" * 50)
        
        responses = list(runner.generate_text_streaming(test_case["prompt"]))
        
        # Combine response content
        full_response = ""
        for response in responses:
            if response["type"] == "content":
                full_response += response["content"] + " "
        
        full_response = full_response.strip()
        
        print(f"Response ({len(full_response.split())} words):")
        print(full_response)
        print()
        
        # Check for expected keywords
        found_keywords = []
        for keyword in test_case["expected_keywords"]:
            if keyword.lower() in full_response.lower():
                found_keywords.append(keyword)
        
        print(f"Found keywords: {found_keywords}")
        print(f"Response quality: {'✓ GOOD' if len(full_response.split()) >= 15 else '✗ TOO SHORT'}")
        print(f"Complete sentence: {'✓ YES' if full_response.endswith(('.', '!', '?')) else '✗ NO'}")
        print("=" * 60)
        print()


if __name__ == "__main__":
    # Run specific test cases first
    print("=" * 60)
    print("RUNNING SPECIFIC TEST CASES FOR PROBLEMATIC PROMPTS")
    print("=" * 60)
    run_specific_test_cases()
    
    # Run full test suite
    print("=" * 60)
    print("RUNNING FULL TEST SUITE")
    print("=" * 60)
    unittest.main(verbosity=2)