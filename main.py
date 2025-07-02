"""
FastAPI Backend for AI-Powered Music Player
Complete implementation with GPU monitoring, error handling, and AI model integration.
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.openapi.utils import get_openapi
import uvicorn
from contextlib import asynccontextmanager
import logging
import asyncio
import time
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field
import json
from pathlib import Path
import signal
import sys
import traceback

from app.runner import ModelRunner, ModelConfig, GPUStatus

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('ai_music_player.log')
    ]
)
logger = logging.getLogger(__name__)

# Global model runner instance
model_runner: Optional[ModelRunner] = None

# Pydantic models for API
class GenerateRequest(BaseModel):
    """Request model for text generation"""
    prompt: str = Field(..., description="Input prompt for generation", min_length=1, max_length=4000)
    max_new_tokens: int = Field(default=256, description="Maximum new tokens to generate", ge=1, le=2048)
    temperature: Optional[float] = Field(default=None, description="Sampling temperature", ge=0.1, le=2.0)
    top_p: Optional[float] = Field(default=None, description="Top-p sampling", ge=0.1, le=1.0)
    top_k: Optional[int] = Field(default=None, description="Top-k sampling", ge=1, le=100)
    do_sample: Optional[bool] = Field(default=None, description="Enable sampling")

class GenerateResponse(BaseModel):
    """Response model for text generation"""
    response: str
    generation_time: float
    gpu_status: Optional[Dict[str, Any]] = None
    memory_usage: Optional[Dict[str, float]] = None
    device: str
    conversation_length: int
    error: Optional[str] = None

class PersonaRequest(BaseModel):
    """Request model for persona switching"""
    persona: str = Field(..., description="AI persona name", min_length=1, max_length=100)

class PersonaResponse(BaseModel):
    """Response model for persona switching"""
    success: bool
    persona: str
    message: str

class HealthResponse(BaseModel):
    """Response model for health check"""
    status: str
    timestamp: float
    checks: Dict[str, Any]
    error: Optional[str] = None

class ModelInfoResponse(BaseModel):
    """Response model for model information"""
    model_name: str
    is_loaded: bool
    device: str
    current_persona: str
    conversation_length: int
    config: Dict[str, Any]
    gpu_status: Optional[Dict[str, Any]] = None
    parameters: Optional[Dict[str, Any]] = None
    system: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifespan - startup and shutdown events"""
    global model_runner
    
    # Startup
    logger.info("Starting AI Music Player Backend...")
    try:
        # Initialize model runner
        config = ModelConfig(
            model_name="microsoft/phi-2",
            max_length=2048,
            temperature=0.7,
            top_p=0.9,
            top_k=50,
            do_sample=True
        )
        
        model_runner = ModelRunner(config)
        logger.info("Model runner initialized")
        
        # Load model in background task to avoid blocking startup
        asyncio.create_task(load_model_async())
        
    except Exception as e:
        logger.error(f"Error during startup: {e}")
        logger.error(traceback.format_exc())
    
    yield
    
    # Shutdown
    logger.info("Shutting down AI Music Player Backend...")
    try:
        if model_runner:
            model_runner.cleanup()
        logger.info("Cleanup completed")
    except Exception as e:
        logger.error(f"Error during shutdown: {e}")

async def load_model_async():
    """Load model asynchronously"""
    global model_runner
    try:
        if model_runner:
            logger.info("Loading AI model...")
            success = model_runner.load_model()
            if success:
                logger.info("AI model loaded successfully")
            else:
                logger.error("Failed to load AI model")
    except Exception as e:
        logger.error(f"Error loading model asynchronously: {e}")

# Create FastAPI app with lifespan management
app = FastAPI(
    title="AI Music Player Backend",
    description="FastAPI backend with AI model integration for music analysis and generation",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "*"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom OpenAPI schema
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    openapi_schema = get_openapi(
        title="AI Music Player API",
        version="1.0.0",
        description="Complete AI-powered music player backend with GPU acceleration",
        routes=app.routes,
    )
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi

# Exception handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Handle HTTP exceptions"""
    logger.warning(f"HTTP {exc.status_code}: {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail, "status_code": exc.status_code}
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle general exceptions"""
    logger.error(f"Unhandled exception: {exc}")
    logger.error(traceback.format_exc())
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "detail": str(exc)}
    )

# API Routes

@app.get("/", response_model=Dict[str, str])
async def root():
    """Root endpoint with API information"""
    return {
        "message": "AI Music Player Backend",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health",
        "status": "running"
    }

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Comprehensive health check endpoint
    Returns system status, GPU information, and model health
    """
    try:
        if model_runner is None:
            raise HTTPException(
                status_code=503,
                detail="Model runner not initialized"
            )
        
        health_data = model_runner.health_check()
        
        # Determine HTTP status code based on health
        status_code = 200
        if health_data.get("status") == "degraded":
            status_code = 200  # Still OK, but with warnings
        elif health_data.get("status") == "unhealthy":
            status_code = 503  # Service unavailable
        
        return JSONResponse(
            status_code=status_code,
            content=health_data
        )
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return JSONResponse(
            status_code=500,
            content={
                "status": "unhealthy",
                "timestamp": time.time(),
                "error": str(e)
            }
        )

@app.get("/model/info", response_model=ModelInfoResponse)
async def get_model_info():
    """
    Get comprehensive model and system information
    Includes GPU status, model parameters, and configuration
    """
    try:
        if model_runner is None:
            raise HTTPException(
                status_code=503,
                detail="Model runner not initialized"
            )
        
        model_info = model_runner.get_model_info()
        
        if "error" in model_info:
            raise HTTPException(
                status_code=500,
                detail=model_info["error"]
            )
        
        return model_info
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting model info: {e}")
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

@app.post("/model/load")
async def load_model(background_tasks: BackgroundTasks):
    """
    Load or reload the AI model
    Can be used to reload the model if it fails or needs updating
    """
    try:
        if model_runner is None:
            raise HTTPException(
                status_code=503,
                detail="Model runner not initialized"
            )
        
        # Load model in background to avoid blocking
        background_tasks.add_task(load_model_async)
        
        return {
            "message": "Model loading initiated",
            "status": "loading",
            "check_endpoint": "/model/info"
        }
        
    except Exception as e:
        logger.error(f"Error initiating model load: {e}")
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

@app.post("/generate", response_model=GenerateResponse)
async def generate_text(request: GenerateRequest):
    """
    Generate text using the AI model
    Supports custom generation parameters and persona-based responses
    """
    try:
        if model_runner is None:
            raise HTTPException(
                status_code=503,
                detail="Model runner not initialized"
            )
        
        if not model_runner.is_loaded:
            raise HTTPException(
                status_code=503,
                detail="Model not loaded. Please wait for model loading to complete or call /model/load"
            )
        
        # Prepare generation parameters
        generation_kwargs = {}
        if request.temperature is not None:
            generation_kwargs["temperature"] = request.temperature
        if request.top_p is not None:
            generation_kwargs["top_p"] = request.top_p
        if request.top_k is not None:
            generation_kwargs["top_k"] = request.top_k
        if request.do_sample is not None:
            generation_kwargs["do_sample"] = request.do_sample
        
        # Generate response
        result = model_runner.generate_response(
            prompt=request.prompt,
            max_new_tokens=request.max_new_tokens,
            **generation_kwargs
        )
        
        if "error" in result:
            # Handle model-level errors
            if "out of memory" in result["error"].lower():
                raise HTTPException(
                    status_code=507,  # Insufficient Storage
                    detail=result["error"]
                )
            else:
                raise HTTPException(
                    status_code=500,
                    detail=result["error"]
                )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating text: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

@app.post("/persona", response_model=PersonaResponse)
async def set_persona(request: PersonaRequest):
    """
    Set the AI persona for responses
    Allows switching between different conversation styles
    """
    try:
        if model_runner is None:
            raise HTTPException(
                status_code=503,
                detail="Model runner not initialized"
            )
        
        success = model_runner.set_persona(request.persona)
        
        return {
            "success": success,
            "persona": request.persona,
            "message": f"Persona set to '{request.persona}'" if success else "Failed to set persona"
        }
        
    except Exception as e:
        logger.error(f"Error setting persona: {e}")
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

@app.delete("/conversation")
async def clear_conversation():
    """
    Clear conversation history and free memory
    Useful for starting fresh or managing memory usage
    """
    try:
        if model_runner is None:
            raise HTTPException(
                status_code=503,
                detail="Model runner not initialized"
            )
        
        success = model_runner.clear_conversation_history()
        
        return {
            "success": success,
            "message": "Conversation history cleared" if success else "Failed to clear conversation history"
        }
        
    except Exception as e:
        logger.error(f"Error clearing conversation: {e}")
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

@app.get("/conversation/history")
async def get_conversation_history():
    """
    Get current conversation history
    Returns the conversation history with metadata
    """
    try:
        if model_runner is None:
            raise HTTPException(
                status_code=503,
                detail="Model runner not initialized"
            )
        
        return {
            "conversation_history": model_runner.conversation_history,
            "length": len(model_runner.conversation_history),
            "current_persona": model_runner.current_persona
        }
        
    except Exception as e:
        logger.error(f"Error getting conversation history: {e}")
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

@app.get("/gpu/status")
async def get_gpu_status():
    """
    Get current GPU status and utilization
    Provides real-time GPU monitoring information
    """
    try:
        if model_runner is None:
            raise HTTPException(
                status_code=503,
                detail="Model runner not initialized"
            )
        
        model_runner._update_gpu_status()
        
        if model_runner.gpu_status is None:
            return {
                "available": False,
                "message": "GPU status not available"
            }
        
        return {
            "available": True,
            "status": model_runner.gpu_status.__dict__,
            "timestamp": time.time()
        }
        
    except Exception as e:
        logger.error(f"Error getting GPU status: {e}")
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

# Music-specific endpoints (placeholder for future implementation)
@app.post("/music/analyze")
async def analyze_music():
    """
    Placeholder for music analysis functionality
    Future implementation could include audio analysis, genre classification, etc.
    """
    return {
        "message": "Music analysis endpoint - to be implemented",
        "available_features": [
            "Genre classification",
            "Mood analysis",
            "Tempo detection",
            "Key detection",
            "Lyric analysis"
        ]
    }

@app.post("/music/recommend")
async def recommend_music():
    """
    Placeholder for music recommendation functionality
    Future implementation could include AI-powered recommendations
    """
    return {
        "message": "Music recommendation endpoint - to be implemented",
        "available_features": [
            "Collaborative filtering",
            "Content-based recommendations",
            "Hybrid recommendations",
            "Real-time preferences"
        ]
    }

@app.post("/music/generate")
async def generate_music_description(request: GenerateRequest):
    """
    Generate music-related descriptions or lyrics
    Uses the AI model to create music-related content
    """
    try:
        if model_runner is None:
            raise HTTPException(
                status_code=503,
                detail="Model runner not initialized"
            )
        
        if not model_runner.is_loaded:
            raise HTTPException(
                status_code=503,
                detail="Model not loaded"
            )
        
        # Add music context to the prompt
        music_prompt = f"As a music expert and creative assistant, {request.prompt}"
        
        # Set music-focused persona temporarily
        original_persona = model_runner.current_persona
        model_runner.set_persona("music_expert")
        
        try:
            result = model_runner.generate_response(
                prompt=music_prompt,
                max_new_tokens=request.max_new_tokens
            )
        finally:
            # Restore original persona
            model_runner.set_persona(original_persona)
        
        if "error" in result:
            raise HTTPException(
                status_code=500,
                detail=result["error"]
            )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating music content: {e}")
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

# Signal handlers for graceful shutdown
def signal_handler(signum, frame):
    """Handle shutdown signals"""
    logger.info(f"Received signal {signum}, shutting down...")
    sys.exit(0)

signal.signal(signal.SIGTERM, signal_handler)
signal.signal(signal.SIGINT, signal_handler)

if __name__ == "__main__":
    logger.info("Starting AI Music Player Backend server...")
    
    try:
        uvicorn.run(
            "main:app",
            host="0.0.0.0",
            port=8000,
            reload=False,  # Disable reload to prevent issues with model loading
            log_level="info",
            access_log=True,
            loop="asyncio"
        )
    except Exception as e:
        logger.error(f"Failed to start server: {e}")
        sys.exit(1)