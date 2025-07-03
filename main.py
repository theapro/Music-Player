"""
FastAPI backend for Music Player with LLM model switching functionality.
Handles CORS configuration and model type management.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import logging
from typing import Optional

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Music Player Backend", version="1.0.0")

# Fix CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)

# Model configuration with correct types
MODELS_CONFIG = {
    "mistral": {
        "name": "Mistral-7B-Instruct-v0.1-Q4_K_M.gguf",
        "model_type": "mistral",
        "path": "./models/Mistral-7B-Instruct-v0.1-Q4_K_M.gguf"
    },
    "nemo": {
        "name": "Mistral-Nemo-Instruct-2407-Q4_K_M.gguf", 
        "model_type": "llama",  # Fixed: Nemo models use llama architecture
        "path": "./models/Mistral-Nemo-Instruct-2407-Q4_K_M.gguf"
    }
}

# Current model state
current_model = {
    "name": None,
    "type": None,
    "loaded": False
}

class ModelSwitchRequest(BaseModel):
    model_config = {"protected_namespaces": ()}
    model_name: str

class ModelResponse(BaseModel):
    model_config = {"protected_namespaces": ()}
    success: bool
    message: str
    model_name: Optional[str] = None
    model_type: Optional[str] = None

def create_llm(model_path: str, model_type: str):
    """
    Mock function to simulate LLM creation.
    In a real implementation, this would create the actual LLM instance.
    """
    if not os.path.exists(model_path):
        raise RuntimeError(f"Model file not found: {model_path}")
    
    logger.info(f"Creating LLM with model_type='{model_type}' from '{model_path}'")
    
    # Simulate model loading
    if model_type not in ["mistral", "llama"]:
        raise RuntimeError(f"Unsupported model type: {model_type}")
    
    return f"MockLLM({model_type})"

@app.get("/")
async def root():
    """Health check endpoint."""
    return {"message": "Music Player Backend is running", "status": "healthy"}

@app.get("/models")
async def list_models():
    """List available models."""
    return {
        "available_models": list(MODELS_CONFIG.keys()),
        "current_model": current_model
    }

@app.post("/switch-model", response_model=ModelResponse)
async def switch_model(request: ModelSwitchRequest):
    """
    Switch between different LLM models with proper error handling.
    """
    try:
        model_name = request.model_name.lower()
        
        if model_name not in MODELS_CONFIG:
            raise HTTPException(
                status_code=400, 
                detail=f"Model '{model_name}' not found. Available models: {list(MODELS_CONFIG.keys())}"
            )
        
        model_config = MODELS_CONFIG[model_name]
        model_path = model_config["path"]
        model_type = model_config["model_type"]
        
        logger.info(f"Switching to model: {model_name} (type: {model_type})")
        
        # Create the LLM with correct model type
        try:
            llm = create_llm(model_path, model_type)
            
            # Update current model state
            current_model.update({
                "name": model_name,
                "type": model_type,
                "loaded": True
            })
            
            logger.info(f"Successfully loaded model: {model_name}")
            
            return ModelResponse(
                success=True,
                message=f"Successfully switched to {model_name} model",
                model_name=model_name,
                model_type=model_type
            )
            
        except RuntimeError as e:
            logger.error(f"Failed to create LLM: {e}")
            raise HTTPException(status_code=500, detail=str(e))
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in switch_model: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/current-model")
async def get_current_model():
    """Get information about the currently loaded model."""
    return current_model

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")