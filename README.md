# AI-Powered Music Player

A modern music player application with AI integration, featuring GPU-accelerated text generation, music analysis capabilities, and a responsive React frontend.

## Features

### Frontend (React + Vite)
- 🎵 Audio playback with full controls
- 🎨 Beautiful, responsive UI with dark/light themes
- 📱 Mobile-friendly design
- 🎵 Playlist management
- 🔍 Voice search capabilities
- 🎧 Offline and online player modes

### AI Backend (FastAPI + PyTorch)
- 🚀 **GPU-Accelerated AI Model** - Phi-2 model with CUDA optimization
- 💬 **Intelligent Text Generation** - Context-aware responses
- 🎭 **Persona Switching** - Multiple AI personalities
- 📊 **Real-time GPU Monitoring** - Memory usage and performance tracking
- 🔧 **Comprehensive Error Handling** - Robust fallbacks and recovery
- 💾 **Memory Management** - Automatic cleanup and optimization
- 🏥 **Health Monitoring** - System status and performance checks

## Quick Start

### Prerequisites

- **Python 3.8+** with pip
- **Node.js 16+** with npm
- **CUDA-compatible GPU** (optional, but recommended for best performance)
- **Git**

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/theapro/Music-Player.git
   cd Music-Player
   ```

2. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Start the AI backend**
   ```bash
   python main.py
   ```
   
   The backend will be available at `http://localhost:8000`

### Frontend Setup

1. **Install Node.js dependencies**
   ```bash
   npm install
   ```

2. **Start the development server**
   ```bash
   npm run dev
   ```
   
   The frontend will be available at `http://localhost:5173`

## API Documentation

Once the backend is running, visit:
- **Interactive API Docs**: `http://localhost:8000/docs`
- **ReDoc Documentation**: `http://localhost:8000/redoc`

### Key Endpoints

#### AI Model Endpoints
- `GET /health` - System health check with GPU status
- `GET /model/info` - Model information and configuration
- `POST /model/load` - Load/reload the AI model
- `POST /generate` - Generate AI responses
- `POST /persona` - Switch AI personality
- `DELETE /conversation` - Clear conversation history

#### Monitoring Endpoints
- `GET /gpu/status` - Real-time GPU status
- `GET /conversation/history` - Conversation history

#### Music Endpoints (Planned)
- `POST /music/analyze` - Music analysis
- `POST /music/recommend` - AI-powered recommendations
- `POST /music/generate` - Generate music descriptions/lyrics

## GPU Configuration

### CUDA Setup
The application automatically detects and utilizes CUDA-compatible GPUs:

```python
# Automatic GPU detection and optimization
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
```

### Memory Management
- **Automatic quantization** for GPU memory optimization
- **Dynamic memory cleanup** after generation
- **Real-time memory monitoring**
- **Out-of-memory protection** with graceful fallbacks

### Performance Features
- **Mixed precision training** with CUDA AMP
- **4-bit quantization** for memory efficiency
- **Optimized model loading** with device mapping
- **Batch processing support**

## Configuration

### Model Configuration
Edit the model settings in `main.py`:

```python
config = ModelConfig(
    model_name="microsoft/phi-2",  # AI model to use
    max_length=2048,               # Maximum context length
    temperature=0.7,               # Creativity level (0.1-2.0)
    top_p=0.9,                     # Nucleus sampling
    top_k=50,                      # Top-k sampling
    do_sample=True                 # Enable sampling
)
```

### GPU Settings
The application automatically optimizes GPU usage:
- **Device selection**: Chooses GPU with most memory
- **Memory optimization**: Uses quantization when possible
- **Fallback support**: Falls back to CPU if GPU unavailable

## Performance Monitoring

### Health Checks
```bash
curl http://localhost:8000/health
```

Response includes:
- Model loading status
- GPU utilization
- Memory usage
- Temperature monitoring
- Performance benchmarks

### GPU Status
```bash
curl http://localhost:8000/gpu/status
```

Monitor:
- Memory usage (total/used/free)
- GPU utilization percentage
- Temperature readings
- Device information

## Usage Examples

### Generate AI Response
```bash
curl -X POST "http://localhost:8000/generate" \
     -H "Content-Type: application/json" \
     -d '{
       "prompt": "Tell me about jazz music",
       "max_new_tokens": 256,
       "temperature": 0.8
     }'
```

### Switch AI Persona
```bash
curl -X POST "http://localhost:8000/persona" \
     -H "Content-Type: application/json" \
     -d '{
       "persona": "music_expert"
     }'
```

### Check System Health
```bash
curl http://localhost:8000/health
```

## Development

### Frontend Development
```bash
npm run dev    # Start development server
npm run build  # Build for production
npm run lint   # Run ESLint
```

### Backend Development
```bash
python main.py                    # Start development server
pip install -r requirements.txt  # Install dependencies
```

### Testing GPU Performance
1. Start the backend
2. Check GPU status: `GET /gpu/status`
3. Run health check: `GET /health`
4. Generate test response: `POST /generate`

## Troubleshooting

### Common Issues

**GPU Not Detected**
```bash
# Check CUDA availability
python -c "import torch; print(torch.cuda.is_available())"
```

**Memory Issues**
- Reduce `max_new_tokens` in generation requests
- Clear conversation history: `DELETE /conversation`
- Restart the backend to clear GPU memory

**Model Loading Errors**
- Ensure stable internet connection for initial model download
- Check available disk space (models can be several GB)
- Verify GPU memory availability

### Performance Tips

1. **GPU Memory**: Ensure at least 4GB GPU memory for optimal performance
2. **Batch Size**: Use smaller batch sizes if experiencing memory issues
3. **Quantization**: 4-bit quantization is enabled by default for memory efficiency
4. **Cleanup**: Regularly clear conversation history for memory management

## Architecture

```
Music-Player/
├── src/                    # React frontend
│   ├── components/         # React components
│   ├── assets/            # Static assets
│   └── ...
├── app/                   # Python AI backend
│   ├── __init__.py        # Package initialization
│   └── runner.py          # AI model runner
├── main.py                # FastAPI application
├── requirements.txt       # Python dependencies
├── package.json          # Node.js dependencies
└── README.md             # This file
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly (frontend and backend)
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

For issues and questions:
- Open an issue on GitHub
- Check the API documentation at `/docs`
- Review the health check endpoint for system status
