"""
Mock detector implementation for development and testing

This detector generates realistic fake results without requiring
a trained AI model, allowing frontend development to proceed
independently of model training.
"""

import random
import time
from typing import Dict, Any, List
from PIL import Image

from .detector import BaseDetector


class MockDetector(BaseDetector):
    """
    Mock deepfake detector for development and testing
    
    Generates realistic detection results with random variations
    to simulate actual model behavior.
    """
    
    def __init__(self):
        super().__init__()
        self.model_version = "MockModel v1.0"
        self.generation_methods = ["GAN", "Diffusion", "Face Swap"]
        self.facial_regions = [
            "Eyes",
            "Mouth", 
            "Nose",
            "Skin Texture",
            "Lighting",
            "Hair",
            "Face Boundaries",
            "Background Consistency"
        ]
    
    def load_model(self, model_path: str = None) -> None:
        """
        Simulate model loading
        
        Args:
            model_path: Not used in mock implementation
        """
        # Simulate loading delay
        time.sleep(0.1)
        self.is_loaded = True
        print(f"[MockDetector] Mock model loaded: {self.model_version}")
    
    def detect(self, image: Image.Image) -> Dict[str, Any]:
        """
        Generate mock detection results
        
        Args:
            image: PIL Image object to "analyze"
            
        Returns:
            Dictionary with mock detection results
        """
        start_time = time.time()
        
        # Simulate processing delay (0.5 to 2.5 seconds)
        processing_delay = random.uniform(0.5, 2.5)
        time.sleep(processing_delay)
        
        # Generate random verdict and confidence
        is_fake = random.random() > 0.5
        
        # Higher confidence for clear cases, lower for ambiguous
        if random.random() > 0.3:
            confidence = random.uniform(75, 98)  # High confidence
        else:
            confidence = random.uniform(60, 75)  # Medium confidence
        
        # Generate generation method (only if fake)
        generation_method = None
        if is_fake:
            # 80% chance of detecting method
            if random.random() > 0.2:
                generation_method = random.choice(self.generation_methods)
        
        # Generate anomaly scores for different regions
        anomalies = self._generate_anomalies(is_fake)
        
        # Calculate actual processing time
        processing_time = (time.time() - start_time) * 1000  # Convert to milliseconds
        
        return {
            'is_fake': is_fake,
            'confidence': round(confidence, 1),
            'generation_method': generation_method,
            'processing_time': round(processing_time, 2),
            'anomalies': anomalies
        }
    
    def _generate_anomalies(self, is_fake: bool) -> List[Dict[str, Any]]:
        """
        Generate anomaly scores for different facial regions
        
        Args:
            is_fake: Whether the image is classified as fake
            
        Returns:
            List of anomaly dictionaries sorted by score (descending)
        """
        anomalies = []
        
        # Select 4-6 random regions to analyze
        num_regions = random.randint(4, 6)
        selected_regions = random.sample(self.facial_regions, num_regions)
        
        for region in selected_regions:
            if is_fake:
                # Fake images have higher anomaly scores
                score = random.uniform(40, 95)
            else:
                # Real images have lower anomaly scores
                score = random.uniform(5, 45)
            
            anomalies.append({
                'region': region,
                'score': round(score, 1)
            })
        
        # Sort by score (highest first)
        anomalies.sort(key=lambda x: x['score'], reverse=True)
        
        return anomalies
    
    def preprocess_image(self, image: Image.Image) -> Image.Image:
        """
        Mock preprocessing (just converts to RGB)
        
        Args:
            image: PIL Image object
            
        Returns:
            Preprocessed image
        """
        if image.mode != 'RGB':
            image = image.convert('RGB')
        return image
