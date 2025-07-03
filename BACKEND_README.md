# Backend Setup and CORS/Model Type Fixes

## Issues Fixed

### 1. CORS Configuration
- **Problem**: Frontend (localhost:5173) couldn't access backend (localhost:8000) due to CORS policy
- **Solution**: Added proper CORS middleware to FastAPI backend with:
  - `allow_origins=["*"]` - Allows all origins for development
  - `allow_credentials=True` - Enables credentials
  - `allow_methods=["*"]` - Allows all HTTP methods
  - `allow_headers=["*"]` - Allows all headers

### 2. Model Type Configuration
- **Problem**: Nemo model was configured with `model_type="mistral"` but should be `model_type="llama"`
- **Solution**: Updated model configuration in `MODELS_CONFIG`:
  - Mistral models: `model_type="mistral"`
  - Nemo models: `model_type="llama"` (based on Llama architecture)

### 3. Error Handling
- **Added**: Comprehensive error handling in `/switch-model` endpoint
- **Added**: Proper HTTP status codes and error messages
- **Added**: Logging for debugging

## Backend Setup

### Prerequisites
- Python 3.8+
- Node.js 16+ (for frontend)

### Installation and Running

#### Backend
1. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Start the backend server:
   ```bash
   # Using the start script
   ./start_backend.sh
   
   # Or manually
   uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```

#### Frontend
1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

### API Endpoints

#### GET `/`
Health check endpoint.

#### GET `/models`
Lists available models and current model status.

#### POST `/switch-model`
Switches between available models.
```json
{
  "model_name": "mistral" | "nemo"
}
```

#### GET `/current-model`
Returns information about the currently loaded model.

### Model Configuration

The backend supports two models with correct type mappings:

```python
MODELS_CONFIG = {
    "mistral": {
        "name": "Mistral-7B-Instruct-v0.1-Q4_K_M.gguf",
        "model_type": "mistral",
        "path": "./models/Mistral-7B-Instruct-v0.1-Q4_K_M.gguf"
    },
    "nemo": {
        "name": "Mistral-Nemo-Instruct-2407-Q4_K_M.gguf", 
        "model_type": "llama",  # Fixed: Nemo uses llama architecture
        "path": "./models/Mistral-Nemo-Instruct-2407-Q4_K_M.gguf"
    }
}
```

### Testing the Fix

1. Start both backend (port 8000) and frontend (port 5173)
2. Navigate to `/models` route in the frontend
3. Test model switching functionality
4. Verify CORS errors are resolved

## Files Added/Modified

### New Files
- `main.py` - FastAPI backend with CORS and model switching
- `requirements.txt` - Python dependencies
- `.env.example` - Environment configuration template
- `start_backend.sh` - Backend startup script
- `src/components/ModelSwitcher.jsx` - Frontend component for testing

### Modified Files
- `src/App.jsx` - Added ModelSwitcher route

## Environment Variables

Copy `.env.example` to `.env` and modify as needed:

```env
DEFAULT_MISTRAL_TYPE=mistral
DEFAULT_NEMO_TYPE=llama
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
FRONTEND_URL=http://localhost:5173
```