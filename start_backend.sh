#!/bin/bash

# Start script for Music Player Backend
echo "Starting Music Player Backend..."

# Create models directory if it doesn't exist
mkdir -p models

# Install Python dependencies
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

echo "Activating virtual environment..."
source venv/bin/activate

echo "Installing dependencies..."
pip install -r requirements.txt

echo "Starting FastAPI server on port 8000..."
uvicorn main:app --host 0.0.0.0 --port 8000 --reload