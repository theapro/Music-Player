"""
Enhanced AI Model Runner with GPU Utilization and Performance Optimization
Implements Phi-2 model with comprehensive GPU management and error handling.
"""

import torch
import torch.nn.functional as F
from transformers import (
    AutoModelForCausalLM, 
    AutoTokenizer, 
    GenerationConfig,
    BitsAndBytesConfig
)
import logging
import psutil
import gc
import time
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
import json
from pathlib import Path

# GPU monitoring
try:
    import GPUtil
    GPU_AVAILABLE = True
except ImportError:
    GPU_AVAILABLE = False

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@dataclass
class GPUStatus:
    """GPU status information"""
    device_count: int
    current_device: int
    device_name: str
    total_memory: float
    used_memory: float
    free_memory: float
    utilization: float
    temperature: Optional[float] = None

@dataclass
class ModelConfig:
    """Model configuration"""
    model_name: str = "microsoft/phi-2"
    max_length: int = 2048
    temperature: float = 0.7
    top_p: float = 0.9
    top_k: int = 50
    do_sample: bool = True
    pad_token_id: Optional[int] = None
    eos_token_id: Optional[int] = None
    use_cache: bool = True

class ModelRunner:
    """
    Enhanced AI Model Runner with GPU optimization and comprehensive monitoring.
    Implements Phi-2 model with proper device management and error handling.
    """
    
    def __init__(self, config: Optional[ModelConfig] = None):
        """Initialize the model runner with GPU optimization."""
        self.config = config or ModelConfig()
        self.device = self._setup_device()
        self.model = None
        self.tokenizer = None
        self.generation_config = None
        self.conversation_history: List[Dict[str, str]] = []
        self.current_persona = "assistant"
        self.is_loaded = False
        
        # GPU monitoring
        self.gpu_status = None
        self._update_gpu_status()
        
        logger.info(f"ModelRunner initialized with device: {self.device}")
        logger.info(f"GPU Status: {self.gpu_status}")
    
    def _setup_device(self) -> torch.device:
        """Set up and verify the optimal device for model execution."""
        try:
            if torch.cuda.is_available():
                device_count = torch.cuda.device_count()
                logger.info(f"CUDA available with {device_count} device(s)")
                
                # Select the best GPU (highest memory)
                best_device = 0
                if device_count > 1:
                    max_memory = 0
                    for i in range(device_count):
                        memory = torch.cuda.get_device_properties(i).total_memory
                        logger.info(f"GPU {i}: {torch.cuda.get_device_name(i)} - {memory / 1e9:.1f}GB")
                        if memory > max_memory:
                            max_memory = memory
                            best_device = i
                
                device = torch.device(f"cuda:{best_device}")
                torch.cuda.set_device(device)
                
                # Clear GPU cache
                torch.cuda.empty_cache()
                
                logger.info(f"Selected device: {device}")
                logger.info(f"Device name: {torch.cuda.get_device_name(device)}")
                logger.info(f"Device memory: {torch.cuda.get_device_properties(device).total_memory / 1e9:.1f}GB")
                
                return device
            else:
                logger.warning("CUDA not available, falling back to CPU")
                return torch.device("cpu")
                
        except Exception as e:
            logger.error(f"Error setting up device: {e}")
            return torch.device("cpu")
    
    def _update_gpu_status(self) -> None:
        """Update GPU status information."""
        try:
            if torch.cuda.is_available():
                device_idx = self.device.index if self.device.type == "cuda" else 0
                
                total_memory = torch.cuda.get_device_properties(device_idx).total_memory
                allocated_memory = torch.cuda.memory_allocated(device_idx)
                cached_memory = torch.cuda.memory_reserved(device_idx)
                
                # Get utilization if GPUtil is available
                utilization = 0.0
                temperature = None
                if GPU_AVAILABLE:
                    try:
                        gpus = GPUtil.getGPUs()
                        if gpus and device_idx < len(gpus):
                            gpu = gpus[device_idx]
                            utilization = gpu.load * 100
                            temperature = gpu.temperature
                    except Exception as e:
                        logger.debug(f"Could not get GPU utilization: {e}")
                
                self.gpu_status = GPUStatus(
                    device_count=torch.cuda.device_count(),
                    current_device=device_idx,
                    device_name=torch.cuda.get_device_name(device_idx),
                    total_memory=total_memory / 1e9,
                    used_memory=(allocated_memory + cached_memory) / 1e9,
                    free_memory=(total_memory - allocated_memory - cached_memory) / 1e9,
                    utilization=utilization,
                    temperature=temperature
                )
            else:
                self.gpu_status = GPUStatus(
                    device_count=0,
                    current_device=-1,
                    device_name="CPU",
                    total_memory=psutil.virtual_memory().total / 1e9,
                    used_memory=psutil.virtual_memory().used / 1e9,
                    free_memory=psutil.virtual_memory().available / 1e9,
                    utilization=psutil.cpu_percent()
                )
                
        except Exception as e:
            logger.error(f"Error updating GPU status: {e}")
            self.gpu_status = None
    
    def load_model(self) -> bool:
        """Load the model with proper GPU utilization and error handling."""
        try:
            logger.info(f"Loading model: {self.config.model_name}")
            start_time = time.time()
            
            # Configure quantization for better GPU memory usage
            quantization_config = None
            if self.device.type == "cuda":
                try:
                    quantization_config = BitsAndBytesConfig(
                        load_in_4bit=True,
                        bnb_4bit_compute_dtype=torch.float16,
                        bnb_4bit_use_double_quant=True,
                        bnb_4bit_quant_type="nf4"
                    )
                    logger.info("Using 4-bit quantization for GPU optimization")
                except Exception as e:
                    logger.warning(f"Quantization not available: {e}")
            
            # Load tokenizer
            logger.info("Loading tokenizer...")
            self.tokenizer = AutoTokenizer.from_pretrained(
                self.config.model_name,
                trust_remote_code=True,
                padding_side="left"
            )
            
            # Set padding token if not available
            if self.tokenizer.pad_token is None:
                self.tokenizer.pad_token = self.tokenizer.eos_token
            
            # Load model with optimizations
            logger.info("Loading model...")
            model_kwargs = {
                "trust_remote_code": True,
                "torch_dtype": torch.float16 if self.device.type == "cuda" else torch.float32,
                "device_map": "auto" if self.device.type == "cuda" else None,
                "low_cpu_mem_usage": True
            }
            
            if quantization_config:
                model_kwargs["quantization_config"] = quantization_config
            
            self.model = AutoModelForCausalLM.from_pretrained(
                self.config.model_name,
                **model_kwargs
            )
            
            # Move model to device if not using device_map
            if not model_kwargs.get("device_map"):
                self.model = self.model.to(self.device)
            
            # Set model to evaluation mode
            self.model.eval()
            
            # Configure generation parameters
            self.generation_config = GenerationConfig(
                max_length=self.config.max_length,
                temperature=self.config.temperature,
                top_p=self.config.top_p,
                top_k=self.config.top_k,
                do_sample=self.config.do_sample,
                pad_token_id=self.tokenizer.pad_token_id,
                eos_token_id=self.tokenizer.eos_token_id,
                use_cache=self.config.use_cache
            )
            
            load_time = time.time() - start_time
            logger.info(f"Model loaded successfully in {load_time:.2f} seconds")
            
            # Update GPU status after loading
            self._update_gpu_status()
            logger.info(f"GPU memory after loading: {self.gpu_status.used_memory:.1f}GB / {self.gpu_status.total_memory:.1f}GB")
            
            self.is_loaded = True
            return True
            
        except Exception as e:
            logger.error(f"Error loading model: {e}")
            self.is_loaded = False
            return False
    
    def generate_response(self, prompt: str, max_new_tokens: int = 256, **kwargs) -> Dict[str, Any]:
        """
        Generate a response with comprehensive GPU monitoring and error handling.
        """
        if not self.is_loaded:
            return {
                "response": "",
                "error": "Model not loaded",
                "gpu_status": self.gpu_status.__dict__ if self.gpu_status else None
            }
        
        try:
            start_time = time.time()
            
            # Update GPU status before generation
            self._update_gpu_status()
            initial_memory = self.gpu_status.used_memory if self.gpu_status else 0
            
            logger.info(f"Generating response for prompt length: {len(prompt)}")
            logger.info(f"GPU memory before generation: {initial_memory:.1f}GB")
            
            # Prepare input with proper device placement
            inputs = self.tokenizer(
                prompt,
                return_tensors="pt",
                padding=True,
                truncation=True,
                max_length=self.config.max_length - max_new_tokens
            )
            
            # Ensure all tensors are on the correct device
            input_ids = inputs["input_ids"].to(self.device)
            attention_mask = inputs["attention_mask"].to(self.device)
            
            logger.debug(f"Input tensor device: {input_ids.device}")
            logger.debug(f"Model device: {next(self.model.parameters()).device}")
            
            # Verify device consistency
            if input_ids.device != next(self.model.parameters()).device:
                logger.warning("Device mismatch detected, moving tensors...")
                input_ids = input_ids.to(next(self.model.parameters()).device)
                attention_mask = attention_mask.to(next(self.model.parameters()).device)
            
            # Generate with error handling
            with torch.no_grad():
                if self.device.type == "cuda":
                    # Use automatic mixed precision for better performance
                    with torch.cuda.amp.autocast():
                        outputs = self.model.generate(
                            input_ids=input_ids,
                            attention_mask=attention_mask,
                            max_new_tokens=max_new_tokens,
                            generation_config=self.generation_config,
                            **kwargs
                        )
                else:
                    outputs = self.model.generate(
                        input_ids=input_ids,
                        attention_mask=attention_mask,
                        max_new_tokens=max_new_tokens,
                        generation_config=self.generation_config,
                        **kwargs
                    )
            
            # Decode response
            generated_tokens = outputs[0][len(input_ids[0]):]
            response = self.tokenizer.decode(generated_tokens, skip_special_tokens=True)
            
            # Clean up GPU memory
            del inputs, input_ids, attention_mask, outputs, generated_tokens
            if self.device.type == "cuda":
                torch.cuda.empty_cache()
            
            generation_time = time.time() - start_time
            
            # Update GPU status after generation
            self._update_gpu_status()
            final_memory = self.gpu_status.used_memory if self.gpu_status else 0
            
            logger.info(f"Response generated in {generation_time:.2f} seconds")
            logger.info(f"GPU memory after generation: {final_memory:.1f}GB")
            logger.info(f"Memory delta: {final_memory - initial_memory:.1f}GB")
            
            # Add to conversation history
            self.conversation_history.append({
                "prompt": prompt,
                "response": response,
                "timestamp": time.time(),
                "generation_time": generation_time,
                "persona": self.current_persona
            })
            
            return {
                "response": response.strip(),
                "generation_time": generation_time,
                "gpu_status": self.gpu_status.__dict__ if self.gpu_status else None,
                "memory_usage": {
                    "initial": initial_memory,
                    "final": final_memory,
                    "delta": final_memory - initial_memory
                },
                "device": str(self.device),
                "conversation_length": len(self.conversation_history)
            }
            
        except torch.cuda.OutOfMemoryError as e:
            logger.error(f"GPU out of memory: {e}")
            if self.device.type == "cuda":
                torch.cuda.empty_cache()
            gc.collect()
            return {
                "response": "",
                "error": "GPU out of memory. Try reducing max_new_tokens or clearing conversation history.",
                "gpu_status": self.gpu_status.__dict__ if self.gpu_status else None
            }
            
        except Exception as e:
            logger.error(f"Error generating response: {e}")
            return {
                "response": "",
                "error": str(e),
                "gpu_status": self.gpu_status.__dict__ if self.gpu_status else None
            }
    
    def set_persona(self, persona: str) -> bool:
        """Set the AI persona for responses."""
        try:
            self.current_persona = persona
            logger.info(f"Persona set to: {persona}")
            return True
        except Exception as e:
            logger.error(f"Error setting persona: {e}")
            return False
    
    def clear_conversation_history(self) -> bool:
        """Clear conversation history and free memory."""
        try:
            self.conversation_history.clear()
            if self.device.type == "cuda":
                torch.cuda.empty_cache()
            gc.collect()
            logger.info("Conversation history cleared")
            return True
        except Exception as e:
            logger.error(f"Error clearing conversation history: {e}")
            return False
    
    def get_model_info(self) -> Dict[str, Any]:
        """Get comprehensive model and system information."""
        try:
            self._update_gpu_status()
            
            model_info = {
                "model_name": self.config.model_name,
                "is_loaded": self.is_loaded,
                "device": str(self.device),
                "current_persona": self.current_persona,
                "conversation_length": len(self.conversation_history),
                "config": {
                    "max_length": self.config.max_length,
                    "temperature": self.config.temperature,
                    "top_p": self.config.top_p,
                    "top_k": self.config.top_k,
                    "do_sample": self.config.do_sample
                }
            }
            
            # Add GPU information
            if self.gpu_status:
                model_info["gpu_status"] = self.gpu_status.__dict__
            
            # Add model parameters count if loaded
            if self.is_loaded and self.model:
                try:
                    total_params = sum(p.numel() for p in self.model.parameters())
                    trainable_params = sum(p.numel() for p in self.model.parameters() if p.requires_grad)
                    model_info["parameters"] = {
                        "total": total_params,
                        "trainable": trainable_params,
                        "size_mb": total_params * 4 / 1024 / 1024  # Assuming float32
                    }
                except Exception as e:
                    logger.debug(f"Could not get parameter count: {e}")
            
            # System information
            model_info["system"] = {
                "cpu_percent": psutil.cpu_percent(),
                "memory_percent": psutil.virtual_memory().percent,
                "available_memory_gb": psutil.virtual_memory().available / 1e9
            }
            
            return model_info
            
        except Exception as e:
            logger.error(f"Error getting model info: {e}")
            return {"error": str(e)}
    
    def health_check(self) -> Dict[str, Any]:
        """Perform a comprehensive health check."""
        try:
            health_status = {
                "status": "healthy",
                "timestamp": time.time(),
                "checks": {}
            }
            
            # Model health
            health_status["checks"]["model_loaded"] = self.is_loaded
            
            # Device health
            health_status["checks"]["device_available"] = torch.cuda.is_available() if self.device.type == "cuda" else True
            
            # Memory health
            self._update_gpu_status()
            if self.gpu_status:
                memory_usage_percent = (self.gpu_status.used_memory / self.gpu_status.total_memory) * 100
                health_status["checks"]["memory_ok"] = memory_usage_percent < 90
                health_status["checks"]["memory_usage_percent"] = memory_usage_percent
            
            # GPU utilization
            if self.device.type == "cuda" and self.gpu_status:
                health_status["checks"]["gpu_utilization"] = self.gpu_status.utilization
                health_status["checks"]["gpu_temperature_ok"] = (
                    self.gpu_status.temperature is None or self.gpu_status.temperature < 85
                )
            
            # Overall health
            all_checks_passed = all(
                check for check in health_status["checks"].values() 
                if isinstance(check, bool)
            )
            
            if not all_checks_passed:
                health_status["status"] = "degraded"
            
            # Performance test
            if self.is_loaded:
                test_start = time.time()
                test_result = self.generate_response("Hello", max_new_tokens=10)
                test_time = time.time() - test_start
                
                health_status["checks"]["performance_test"] = {
                    "success": "error" not in test_result,
                    "response_time": test_time,
                    "response_time_ok": test_time < 10.0
                }
                
                if not health_status["checks"]["performance_test"]["success"]:
                    health_status["status"] = "unhealthy"
            
            return health_status
            
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return {
                "status": "unhealthy",
                "timestamp": time.time(),
                "error": str(e)
            }
    
    def cleanup(self) -> bool:
        """Clean up resources and free memory."""
        try:
            logger.info("Cleaning up model runner...")
            
            # Clear conversation history
            self.conversation_history.clear()
            
            # Delete model and tokenizer
            if self.model is not None:
                del self.model
                self.model = None
            
            if self.tokenizer is not None:
                del self.tokenizer
                self.tokenizer = None
            
            # Clear GPU cache
            if self.device.type == "cuda":
                torch.cuda.empty_cache()
                torch.cuda.synchronize()
            
            # Run garbage collection
            gc.collect()
            
            self.is_loaded = False
            logger.info("Cleanup completed successfully")
            return True
            
        except Exception as e:
            logger.error(f"Error during cleanup: {e}")
            return False