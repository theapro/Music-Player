"""
AI Music Player Backend Package
Provides AI-powered music analysis and generation capabilities with GPU acceleration.
"""

__version__ = "1.0.0"
__author__ = "Music Player AI Team"

from .runner import ModelRunner

__all__ = ["ModelRunner"]