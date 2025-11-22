"""
API endpoints for deepfake detection

This module defines all API routes and their handlers.
"""

import time
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse

from app.models.schemas import AnalysisResponse, AnalysisResult, AnalysisDetails, AnomalyRegion, HealthResponse
from app.core.image_utils import ImageValidator, ImageProcessor
from app.core.config import settings

# Import the appropriate detector based on settings
if settings.USE_MOCK_DETECTOR:
    from app.services.mock_detector import MockDetector as Detector
else:
    # In the future, import the real detector here
    # from app.services.real_detector import RealDetector as Detector
    from app.services.mock_detector import MockDetector as Detector

# Initialize router
router = APIRouter(prefix="/api", tags=["detection"])

# Initialize detector (singleton pattern)
detector = Detector()
detector.load_model(settings.MODEL_PATH if not settings.USE_MOCK_DETECTOR else None)


@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_image(image: UploadFile = File(...)):
    """
    Analyze an image for deepfake detection
    
    Args:
        image: Uploaded image file (JPG, JPEG, or PNG)
        
    Returns:
        AnalysisResponse containing detection results
        
    Raises:
        HTTPException: If validation fails or processing errors occur
    """
    try:
        # Load and validate image
        pil_image, metadata = await ImageValidator.load_image_from_upload(image)
        
        # Preprocess image
        processed_image = ImageProcessor.preprocess_for_detection(pil_image)
        
        # Perform detection
        detection_result = detector.detect(processed_image)
        
        # Build response
        anomalies = [
            AnomalyRegion(region=a['region'], score=a['score'])
            for a in detection_result['anomalies']
        ]
        
        details = AnalysisDetails(
            processing_time=detection_result['processing_time'],
            model_version=detector.model_version,
            anomalies=anomalies
        )
        
        result = AnalysisResult(
            is_fake=detection_result['is_fake'],
            confidence=detection_result['confidence'],
            generation_method=detection_result.get('generation_method'),
            heatmap_url=None,  # Will be implemented later
            details=details
        )
        
        return AnalysisResponse(
            success=True,
            data=result,
            error=None
        )
        
    except HTTPException:
        # Re-raise HTTP exceptions (validation errors)
        raise
        
    except Exception as e:
        # Log the error (in production, use proper logging)
        print(f"[ERROR] Analysis failed: {str(e)}")
        
        return AnalysisResponse(
            success=False,
            data=None,
            error=f"Analysis failed: {str(e)}"
        )


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Health check endpoint
    
    Returns:
        HealthResponse with API status and model information
    """
    model_info = detector.get_model_info()
    
    return HealthResponse(
        status="healthy",
        version=settings.API_VERSION,
        model_loaded=model_info['is_loaded'],
        model_version=model_info['version']
    )


@router.get("/")
async def root():
    """
    Root endpoint with API information
    
    Returns:
        Dictionary with API details
    """
    return {
        "name": settings.API_TITLE,
        "version": settings.API_VERSION,
        "description": settings.API_DESCRIPTION,
        "endpoints": {
            "analyze": "/api/analyze (POST)",
            "health": "/api/health (GET)",
            "docs": "/docs (GET)"
        }
    }
