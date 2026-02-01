"""
EfficientNet-based deepfake detector implementation

Uses a pre-trained EfficientNet-B0 model fine-tuned on FaceForensics++ dataset
for detecting AI-generated and manipulated facial images.
"""

import time
from typing import Dict, Any, List, Optional
from pathlib import Path

import numpy as np
from PIL import Image

try:
    import torch
    import torch.nn as nn
    import torch.nn.functional as F
    from torchvision import transforms, models
    from huggingface_hub import hf_hub_download
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False

from .detector import BaseDetector


class EfficientNetDetector(BaseDetector):
    """
    EfficientNet-based deepfake detector
    
    Uses EfficientNet-B0 pre-trained on FaceForensics++ dataset from Hugging Face.
    Classifies images as real or fake with confidence scores.
    """
    
    # Hugging Face model info
    HF_REPO_ID = "Xicor9/efficientnet-b0-ffpp-c23"
    HF_FILENAME = "efficientnet_b0_ffpp_c23.pth"
    
    # Image preprocessing constants (ImageNet normalization)
    IMAGE_SIZE = 224
    MEAN = [0.485, 0.456, 0.406]
    STD = [0.229, 0.224, 0.225]
    
    # Detection thresholds
    FAKE_THRESHOLD = 0.5
    HIGH_CONFIDENCE_THRESHOLD = 0.85
    
    # Facial regions for anomaly analysis
    FACIAL_REGIONS = [
        "Eyes",
        "Mouth",
        "Nose",
        "Skin Texture",
        "Face Boundaries",
        "Lighting Consistency",
    ]
    
    def __init__(self):
        super().__init__()
        self.model_version = "EfficientNet-B0 (FaceForensics++ C23)"
        self.model = None
        self.device = None
        self.transform = None
        
        if not TORCH_AVAILABLE:
            raise ImportError(
                "PyTorch is required for EfficientNet detector. "
                "Install with: pip install torch torchvision timm huggingface-hub"
            )
    
    def load_model(self, model_path: Optional[str] = None) -> None:
        """
        Load the EfficientNet model
        
        Args:
            model_path: Optional path to local model weights. If None,
                       downloads from Hugging Face.
        """
        print(f"[EfficientNetDetector] Initializing device...")
        
        # Set device (GPU if available, else CPU)
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        print(f"[EfficientNetDetector] Using device: {self.device}")
        
        # Create image transform (no normalization - matching the Hugging Face model)
        self.transform = transforms.Compose([
            transforms.Resize((self.IMAGE_SIZE, self.IMAGE_SIZE)),
            transforms.ToTensor(),
        ])
        
        # Create EfficientNet-B0 model using torchvision
        print(f"[EfficientNetDetector] Creating EfficientNet-B0 model...")
        self.model = models.efficientnet_b0(weights=None)
        
        # Modify classifier for binary classification (Real/Fake)
        # The Hugging Face model uses: classifier[1] = Linear(in_features, 2)
        in_features = self.model.classifier[1].in_features
        self.model.classifier[1] = nn.Linear(in_features, 2)
        
        # Try to load fine-tuned weights from Hugging Face
        weights_path = self._get_weights_path(model_path)
        
        if weights_path and weights_path.exists():
            print(f"[EfficientNetDetector] Loading weights from: {weights_path}")
            try:
                state_dict = torch.load(weights_path, map_location=self.device, weights_only=True)
                self.model.load_state_dict(state_dict)
                print(f"[EfficientNetDetector] Loaded fine-tuned FaceForensics++ weights successfully")
            except Exception as e:
                print(f"[EfficientNetDetector] Warning: Could not load weights: {e}")
                print(f"[EfficientNetDetector] Using ImageNet pre-trained weights as fallback")
                self._load_imagenet_fallback()
        else:
            print(f"[EfficientNetDetector] No fine-tuned weights found, using ImageNet pre-trained")
            self._load_imagenet_fallback()
        
        # Move model to device and set to evaluation mode
        self.model = self.model.to(self.device)
        self.model.eval()
        
        self.is_loaded = True
        print(f"[EfficientNetDetector] Model loaded: {self.model_version}")
    
    def _load_imagenet_fallback(self) -> None:
        """Load ImageNet pre-trained weights as fallback"""
        self.model = models.efficientnet_b0(weights=models.EfficientNet_B0_Weights.IMAGENET1K_V1)
        in_features = self.model.classifier[1].in_features
        self.model.classifier[1] = nn.Linear(in_features, 2)
        self.model_version = "EfficientNet-B0 (ImageNet - Fallback)"
    
    def _get_weights_path(self, model_path: Optional[str]) -> Optional[Path]:
        """
        Get the path to model weights, downloading from HuggingFace if needed
        
        Args:
            model_path: Optional local path to weights
            
        Returns:
            Path to weights file, or None if not available
        """
        # Check local path first
        if model_path:
            local_path = Path(model_path)
            if local_path.exists():
                return local_path
        
        # Try to download from Hugging Face
        try:
            print(f"[EfficientNetDetector] Downloading weights from Hugging Face...")
            downloaded_path = hf_hub_download(
                repo_id=self.HF_REPO_ID,
                filename=self.HF_FILENAME,
            )
            return Path(downloaded_path)
        except Exception as e:
            print(f"[EfficientNetDetector] Could not download from HuggingFace: {e}")
            return None
    
    def detect(self, image: Image.Image) -> Dict[str, Any]:
        """
        Detect if an image is a deepfake
        
        Args:
            image: PIL Image object to analyze
            
        Returns:
            Dictionary containing detection results
        """
        if not self.is_loaded:
            raise RuntimeError("Model not loaded. Call load_model() first.")
        
        start_time = time.time()
        
        # Preprocess image
        image = self.preprocess_image(image)
        input_tensor = self.transform(image).unsqueeze(0).to(self.device)
        
        # Run inference
        with torch.no_grad():
            outputs = self.model(input_tensor)
            probabilities = F.softmax(outputs, dim=1)
            
            # Class 0: Real, Class 1: Fake
            fake_prob = probabilities[0, 1].item()
            real_prob = probabilities[0, 0].item()
        
        # Determine verdict
        is_fake = fake_prob > self.FAKE_THRESHOLD
        confidence = (fake_prob if is_fake else real_prob) * 100
        
        # Determine generation method based on patterns (simplified heuristic)
        generation_method = None
        if is_fake:
            generation_method = self._estimate_generation_method(fake_prob)
        
        # Generate anomaly scores based on model confidence
        anomalies = self._generate_anomalies(is_fake, fake_prob)
        
        # Calculate processing time
        processing_time = (time.time() - start_time) * 1000
        
        return {
            'is_fake': is_fake,
            'confidence': round(confidence, 1),
            'generation_method': generation_method,
            'processing_time': round(processing_time, 2),
            'anomalies': anomalies
        }
    
    def _estimate_generation_method(self, fake_prob: float) -> str:
        """
        Estimate the deepfake generation method based on confidence
        
        Note: This is a simplified heuristic. A more advanced model would
        have separate classification heads for generation method.
        
        Args:
            fake_prob: Probability that image is fake
            
        Returns:
            Estimated generation method string
        """
        # Simple heuristic based on confidence levels
        # In production, you'd want a multi-class model or additional analysis
        if fake_prob > 0.9:
            return "GAN"
        elif fake_prob > 0.75:
            return "Face Swap"
        else:
            return "Diffusion"
    
    def _generate_anomalies(self, is_fake: bool, fake_prob: float) -> List[Dict[str, Any]]:
        """
        Generate anomaly scores for different facial regions
        
        Note: This uses the model's overall confidence to generate region scores.
        A more sophisticated approach would use attention maps or GradCAM.
        
        Args:
            is_fake: Whether the image is classified as fake
            fake_prob: Probability that image is fake
            
        Returns:
            List of anomaly dictionaries sorted by score
        """
        anomalies = []
        base_score = fake_prob * 100 if is_fake else (1 - fake_prob) * 100
        
        # Generate region-specific scores with some variance
        np.random.seed(int(fake_prob * 1000))  # Reproducible for same image
        
        for region in self.FACIAL_REGIONS:
            # Add variance to base score for each region
            variance = np.random.uniform(-15, 15)
            score = max(5, min(95, base_score + variance))
            
            anomalies.append({
                'region': region,
                'score': round(score, 1)
            })
        
        # Sort by score (highest first)
        anomalies.sort(key=lambda x: x['score'], reverse=True)
        
        return anomalies
    
    def preprocess_image(self, image: Image.Image) -> Image.Image:
        """
        Preprocess image before detection
        
        Args:
            image: PIL Image object
            
        Returns:
            Preprocessed PIL Image object
        """
        # Convert to RGB if needed
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        return image
