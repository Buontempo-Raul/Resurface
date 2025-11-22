"""
Pydantic models for request/response validation

These models define the structure of data exchanged between
the frontend and backend, ensuring type safety and validation.
"""

from pydantic import BaseModel, Field
from typing import List, Optional


class AnomalyRegion(BaseModel):
    """Detected anomaly in a specific facial region"""
    region: str = Field(..., description="Name of the facial region (e.g., 'Eyes', 'Mouth')")
    score: float = Field(..., ge=0, le=100, description="Anomaly score for this region (0-100)")


class AnalysisDetails(BaseModel):
    """Detailed analysis information"""
    processing_time: float = Field(..., description="Processing time in milliseconds")
    model_version: str = Field(..., description="Version of the detection model used")
    anomalies: List[AnomalyRegion] = Field(default_factory=list, description="List of detected anomalies")


class AnalysisResult(BaseModel):
    """Analysis result for a single image"""
    is_fake: bool = Field(..., description="True if image is detected as deepfake")
    confidence: float = Field(..., ge=0, le=100, description="Confidence score (0-100)")
    generation_method: Optional[str] = Field(None, description="Detected generation method (GAN, Diffusion, Face Swap)")
    heatmap_url: Optional[str] = Field(None, description="URL to heatmap visualization")
    details: AnalysisDetails = Field(..., description="Additional analysis details")


class AnalysisResponse(BaseModel):
    """API response for image analysis"""
    success: bool = Field(..., description="Whether the analysis was successful")
    data: Optional[AnalysisResult] = Field(None, description="Analysis result data")
    error: Optional[str] = Field(None, description="Error message if analysis failed")
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "data": {
                    "is_fake": True,
                    "confidence": 87.5,
                    "generation_method": "GAN",
                    "heatmap_url": None,
                    "details": {
                        "processing_time": 1234.56,
                        "model_version": "MockModel v1.0",
                        "anomalies": [
                            {"region": "Eyes", "score": 78.3},
                            {"region": "Mouth", "score": 65.2}
                        ]
                    }
                },
                "error": None
            }
        }


class HealthResponse(BaseModel):
    """API health check response"""
    status: str = Field(..., description="API status")
    version: str = Field(..., description="API version")
    model_loaded: bool = Field(..., description="Whether the detection model is loaded")
    model_version: str = Field(..., description="Version of the loaded model")
