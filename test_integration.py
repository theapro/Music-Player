"""
Example integration script showing how to use the AI Music Player backend
This demonstrates the complete API functionality
"""

import requests
import json
import time

# Backend URL
BASE_URL = "http://localhost:8000"

def test_api_integration():
    """Test the complete API integration"""
    print("🎵 AI Music Player Backend Integration Test")
    print("=" * 50)
    
    # Test 1: Root endpoint
    print("\n1. Testing root endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/")
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.json()}")
    except requests.exceptions.ConnectionError:
        print("   ❌ Backend not running. Start with: python main.py")
        return False
    
    # Test 2: Health check
    print("\n2. Testing health check...")
    response = requests.get(f"{BASE_URL}/health")
    health_data = response.json()
    print(f"   Status: {health_data['status']}")
    print(f"   Checks: {health_data['checks']}")
    
    # Test 3: Model info
    print("\n3. Testing model info...")
    response = requests.get(f"{BASE_URL}/model/info")
    model_info = response.json()
    print(f"   Model: {model_info.get('model_name', 'N/A')}")
    print(f"   Loaded: {model_info.get('is_loaded', False)}")
    print(f"   Device: {model_info.get('device', 'unknown')}")
    
    # Test 4: GPU status
    print("\n4. Testing GPU status...")
    response = requests.get(f"{BASE_URL}/gpu/status")
    gpu_data = response.json()
    print(f"   GPU Available: {gpu_data['available']}")
    if gpu_data['available']:
        gpu_status = gpu_data['status']
        print(f"   Device: {gpu_status['device_name']}")
        print(f"   Memory: {gpu_status['used_memory']:.1f}GB / {gpu_status['total_memory']:.1f}GB")
        print(f"   Utilization: {gpu_status['utilization']:.1f}%")
    else:
        print(f"   Message: {gpu_data['message']}")
    
    # Test 5: Text generation
    print("\n5. Testing text generation...")
    generation_request = {
        "prompt": "Tell me about the history of jazz music and its influence on modern music",
        "max_new_tokens": 150,
        "temperature": 0.8
    }
    
    response = requests.post(
        f"{BASE_URL}/generate",
        json=generation_request,
        headers={"Content-Type": "application/json"}
    )
    
    if response.status_code == 200:
        result = response.json()
        print(f"   Generation time: {result.get('generation_time', 0):.2f}s")
        print(f"   Response: {result['response'][:100]}...")
        if result.get('memory_usage'):
            memory = result['memory_usage']
            print(f"   Memory delta: {memory.get('delta', 0):.1f}GB")
    else:
        print(f"   Error: {response.status_code} - {response.json()}")
    
    # Test 6: Persona switching
    print("\n6. Testing persona switching...")
    persona_request = {"persona": "music_expert"}
    response = requests.post(
        f"{BASE_URL}/persona",
        json=persona_request,
        headers={"Content-Type": "application/json"}
    )
    persona_result = response.json()
    print(f"   Success: {persona_result['success']}")
    print(f"   Message: {persona_result['message']}")
    
    # Test 7: Music-specific generation
    print("\n7. Testing music-specific generation...")
    music_request = {
        "prompt": "Create a short song lyric about night time in the city",
        "max_new_tokens": 100
    }
    
    response = requests.post(
        f"{BASE_URL}/music/generate",
        json=music_request,
        headers={"Content-Type": "application/json"}
    )
    
    if response.status_code == 200:
        result = response.json()
        print(f"   Music response: {result['response'][:100]}...")
    else:
        print(f"   Error: {response.status_code} - {response.json()}")
    
    # Test 8: Conversation history
    print("\n8. Testing conversation history...")
    response = requests.get(f"{BASE_URL}/conversation/history")
    history = response.json()
    print(f"   Conversation length: {history['length']}")
    print(f"   Current persona: {history['current_persona']}")
    
    # Test 9: Clear conversation
    print("\n9. Testing conversation clear...")
    response = requests.delete(f"{BASE_URL}/conversation")
    clear_result = response.json()
    print(f"   Clear success: {clear_result['success']}")
    
    print("\n✅ Integration test completed!")
    print("\nTo use the backend with the React frontend:")
    print("1. Start backend: python main.py")
    print("2. Start frontend: npm run dev")
    print("3. Visit: http://localhost:5173")
    
    return True

def example_frontend_integration():
    """Example of how frontend JavaScript could interact with the backend"""
    
    js_example = """
// Example JavaScript code for React frontend integration

const API_BASE = 'http://localhost:8000';

// Health check
const checkBackendHealth = async () => {
  try {
    const response = await fetch(`${API_BASE}/health`);
    const health = await response.json();
    return health.status === 'healthy';
  } catch (error) {
    console.error('Backend health check failed:', error);
    return false;
  }
};

// Generate AI response for music queries
const generateMusicResponse = async (prompt, options = {}) => {
  try {
    const response = await fetch(`${API_BASE}/music/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        max_new_tokens: options.maxTokens || 150,
        temperature: options.temperature || 0.8
      })
    });
    
    const result = await response.json();
    return result.response;
  } catch (error) {
    console.error('AI generation failed:', error);
    return 'Sorry, AI is not available right now.';
  }
};

// Get GPU status for monitoring
const getGPUStatus = async () => {
  try {
    const response = await fetch(`${API_BASE}/gpu/status`);
    return await response.json();
  } catch (error) {
    console.error('GPU status check failed:', error);
    return { available: false };
  }
};

// Example usage in React component:
const MusicAIChat = () => {
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const handleAIQuery = async (userPrompt) => {
    setIsLoading(true);
    const aiResponse = await generateMusicResponse(userPrompt);
    setResponse(aiResponse);
    setIsLoading(false);
  };
  
  return (
    <div>
      <button onClick={() => handleAIQuery('Tell me about this song')}>
        Ask AI about music
      </button>
      {isLoading ? <p>AI is thinking...</p> : <p>{response}</p>}
    </div>
  );
};
"""
    
    print("\n📱 Frontend Integration Example")
    print("=" * 50)
    print(js_example)

if __name__ == "__main__":
    # Run the integration test
    success = test_api_integration()
    
    if success:
        # Show frontend integration example
        example_frontend_integration()
    
    print("\n🔗 API Documentation: http://localhost:8000/docs")
    print("🔗 Alternative docs: http://localhost:8000/redoc")