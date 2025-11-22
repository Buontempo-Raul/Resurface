"""
Base detector interface

This module defines the abstract base class for all deepfake detectors.
This allows for easy swapping between mock and real implementations.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any
from PIL import Image


class BaseDetector(ABC):
    """
    Abstract base class for deepfake detectors
    
    All detector implementations must inherit from this class
    and implement the detect() method.
    """
    
    def __init__(self):
        """Initialize the detector"""
        self.model_version = "Unknown"
        self.is_loaded = False
    
    @abstractmethod
    def load_model(self, model_path: str = None) -> None:
        """
        Load the detection model
        
        Args:
            model_path: Path to the model file (optional)
        """
        pass
    
    @abstractmethod
    def detect(self, image: Image.Image) -> Dict[str, Any]:
        """
        Detect if an image is a deepfake
        
        Args:
            image: PIL Image object to analyze
            
        Returns:
            Dictionary containing detection results with the following structure:
            {
                'is_fake': bool,
                'confidence': float (0-100),
                'generation_method': str or None,
                'processing_time': float (milliseconds),
                'anomalies': List[Dict[str, Any]]
            }
        """
        pass
    
    def preprocess_image(self, image: Image.Image) -> Image.Image:
        """
        Preprocess image before detection (optional override)
        
        Args:
            image: PIL Image object
            
        Returns:
            Preprocessed PIL Image object
        """
        # Default implementation: convert to RGB if needed
        if image.mode != 'RGB':
            image = image.convert('RGB')
        return image
    
    def get_model_info(self) -> Dict[str, Any]:
        """
        Get information about the loaded model
        
        Returns:
            Dictionary with model information
        """
        return {
            'version': self.model_version,
            'is_loaded': self.is_loaded
        }
