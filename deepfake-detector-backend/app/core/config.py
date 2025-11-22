"""
Configuration module for the Deepfake Detection API

This module manages all application settings using pydantic-settings
for environment variable management.
"""

from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings with environment variable support"""
    
    # API Settings
    API_TITLE: str = "Deepfake Detection API"
    API_VERSION: str = "1.0.0"
    API_DESCRIPTION: str = "AI-powered deepfake image detection service"
    
    # Server Settings
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = True
    
    # CORS Settings
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
    ]
    
    # File Upload Settings
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB in bytes
    ALLOWED_EXTENSIONS: List[str] = [".jpg", ".jpeg", ".png"]
    ALLOWED_MIME_TYPES: List[str] = ["image/jpeg", "image/png"]
    
    # Detection Settings
    USE_MOCK_DETECTOR: bool = True  # Set to False when real model is ready
    MODEL_PATH: str = "models/detector_model.pth"  # Path to trained model
    MODEL_VERSION: str = "MockModel v1.0"
    
    # Processing Settings
    INFERENCE_TIMEOUT: int = 30  # seconds
    BATCH_SIZE: int = 1  # For future batch processing
    
    # Rate Limiting (requests per minute)
    RATE_LIMIT: int = 60
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Global settings instance
settings = Settings()
