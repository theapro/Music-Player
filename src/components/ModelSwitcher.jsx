import React, { useState, useEffect } from 'react';

const ModelSwitcher = () => {
  const [currentModel, setCurrentModel] = useState(null);
  const [availableModels, setAvailableModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const API_BASE_URL = 'http://localhost:8000';

  // Fetch available models and current model on component mount
  useEffect(() => {
    fetchModels();
    fetchCurrentModel();
  }, []);

  const fetchModels = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/models`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setAvailableModels(data.available_models);
      setCurrentModel(data.current_model);
    } catch (err) {
      setError(`Failed to fetch models: ${err.message}`);
      console.error('Error fetching models:', err);
    }
  };

  const fetchCurrentModel = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/current-model`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setCurrentModel(data);
    } catch (err) {
      setError(`Failed to fetch current model: ${err.message}`);
      console.error('Error fetching current model:', err);
    }
  };

  const switchModel = async (modelName) => {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch(`${API_BASE_URL}/switch-model`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model_name: modelName }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || `HTTP error! status: ${response.status}`);
      }

      if (data.success) {
        setMessage(data.message);
        setCurrentModel({
          name: data.model_name,
          type: data.model_type,
          loaded: true
        });
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      setError(`Failed to switch model: ${err.message}`);
      console.error('Error switching model:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Model Switcher</h2>
      
      {/* Current Model Display */}
      <div className="mb-4 p-3 bg-gray-100 rounded">
        <h3 className="font-semibold text-gray-700">Current Model:</h3>
        {currentModel && currentModel.loaded ? (
          <div>
            <p className="text-sm"><strong>Name:</strong> {currentModel.name}</p>
            <p className="text-sm"><strong>Type:</strong> {currentModel.type}</p>
            <p className="text-sm text-green-600"><strong>Status:</strong> Loaded</p>
          </div>
        ) : (
          <p className="text-sm text-gray-500">No model loaded</p>
        )}
      </div>

      {/* Available Models */}
      <div className="mb-4">
        <h3 className="font-semibold text-gray-700 mb-2">Available Models:</h3>
        <div className="space-y-2">
          {availableModels.map((model) => (
            <button
              key={model}
              onClick={() => switchModel(model)}
              disabled={loading || (currentModel && currentModel.name === model)}
              className={`w-full p-2 rounded border text-left ${
                currentModel && currentModel.name === model
                  ? 'bg-green-100 border-green-300 text-green-700'
                  : 'bg-gray-50 border-gray-300 hover:bg-gray-100'
              } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {model.charAt(0).toUpperCase() + model.slice(1)} Model
              {currentModel && currentModel.name === model && (
                <span className="text-xs text-green-600 ml-2">(Active)</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="mb-4 p-3 bg-blue-100 border border-blue-300 rounded">
          <p className="text-blue-700">Loading model...</p>
        </div>
      )}

      {/* Success Message */}
      {message && (
        <div className="mb-4 p-3 bg-green-100 border border-green-300 rounded">
          <p className="text-green-700">{message}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Refresh Button */}
      <button
        onClick={() => {
          fetchModels();
          fetchCurrentModel();
        }}
        className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
      >
        Refresh
      </button>
    </div>
  );
};

export default ModelSwitcher;