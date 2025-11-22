"""
Image validation and processing utilities

This module handles image validation, file type checking,
and preprocessing operations.
"""

import io
from pathlib import Path
from typing import Tuple, Optional
from PIL import Image
from fastapi import UploadFile, HTTPException

from app.core.config import settings


class ImageValidator:
    """Validates uploaded images"""
    
    @staticmethod
    def validate_file_extension(filename: str) -> bool:
        """
        Check if file has an allowed extension
        
        Args:
            filename: Name of the uploaded file
            
        Returns:
            True if extension is allowed, False otherwise
        """
        file_ext = Path(filename).suffix.lower()
        return file_ext in settings.ALLOWED_EXTENSIONS
    
    @staticmethod
    def validate_mime_type(content_type: str) -> bool:
        """
        Check if MIME type is allowed
        
        Args:
            content_type: MIME type of the uploaded file
            
        Returns:
            True if MIME type is allowed, False otherwise
        """
        return content_type.lower() in settings.ALLOWED_MIME_TYPES
    
    @staticmethod
    async def validate_file_size(file: UploadFile) -> bool:
        """
        Check if file size is within limits
        
        Args:
            file: Uploaded file object
            
        Returns:
            True if size is valid, False otherwise
        """
        # Read file to check size
        contents = await file.read()
        file_size = len(contents)
        
        # Reset file pointer
        await file.seek(0)
        
        return file_size <= settings.MAX_FILE_SIZE
    
    @staticmethod
    async def load_image_from_upload(file: UploadFile) -> Tuple[Image.Image, dict]:
        """
        Load and validate an image from upload
        
        Args:
            file: Uploaded file object
            
        Returns:
            Tuple of (PIL Image object, metadata dict)
            
        Raises:
            HTTPException: If validation fails
        """
        # Validate extension
        if not ImageValidator.validate_file_extension(file.filename):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file format. Allowed formats: {', '.join(settings.ALLOWED_EXTENSIONS)}"
            )
        
        # Validate MIME type
        if not ImageValidator.validate_mime_type(file.content_type):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid MIME type. Allowed types: {', '.join(settings.ALLOWED_MIME_TYPES)}"
            )
        
        # Validate file size
        if not await ImageValidator.validate_file_size(file):
            max_size_mb = settings.MAX_FILE_SIZE / (1024 * 1024)
            raise HTTPException(
                status_code=400,
                detail=f"File too large. Maximum size: {max_size_mb}MB"
            )
        
        # Read and validate image
        try:
            contents = await file.read()
            image = Image.open(io.BytesIO(contents))
            
            # Verify it's actually an image
            image.verify()
            
            # Reopen for actual use (verify() closes the file)
            image = Image.open(io.BytesIO(contents))
            
            # Get image metadata
            metadata = {
                'filename': file.filename,
                'format': image.format,
                'size': image.size,
                'mode': image.mode,
                'file_size': len(contents)
            }
            
            return image, metadata
            
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid image file: {str(e)}"
            )
        finally:
            await file.seek(0)


class ImageProcessor:
    """Processes images for detection"""
    
    @staticmethod
    def preprocess_for_detection(image: Image.Image) -> Image.Image:
        """
        Preprocess image for deepfake detection
        
        Args:
            image: PIL Image object
            
        Returns:
            Preprocessed image
        """
        # Convert to RGB if needed
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Future preprocessing steps can be added here:
        # - Resizing to model input size
        # - Normalization
        # - Face detection and cropping
        # - etc.
        
        return image
    
    @staticmethod
    def resize_image(image: Image.Image, max_size: Tuple[int, int] = (1024, 1024)) -> Image.Image:
        """
        Resize image while maintaining aspect ratio
        
        Args:
            image: PIL Image object
            max_size: Maximum dimensions (width, height)
            
        Returns:
            Resized image
        """
        image.thumbnail(max_size, Image.Resampling.LANCZOS)
        return image
