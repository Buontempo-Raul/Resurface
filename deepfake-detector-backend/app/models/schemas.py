from pydantic import BaseModel, Field
from typing import Optional, List


class ImageCascadeResult(BaseModel):
    is_fake: bool
    fake_probability: float = Field(..., ge=0.0, le=1.0)
    family: Optional[str] = None
    method: Optional[str] = None
    is_unknown_method: bool
    family_entropy: float
    face_source: str = "face"           # 'face' | 'fallback'
    face_bbox: Optional[List[int]] = None  # [x1, y1, x2, y2] raw MTCNN pixels, None on fallback


class AnalysisResult(BaseModel):
    image_result: ImageCascadeResult
    processing_time_ms: float


class AnalysisResponse(BaseModel):
    success: bool
    data: Optional[AnalysisResult] = None
    error: Optional[str] = None


class VideoAnalysisResult(BaseModel):
    image_result: ImageCascadeResult
    processing_time_ms: float
    frames_analyzed: int
    fake_frames: int
    frame_p_fakes: List[float]
    model_used: str = "cascade"


class VideoAnalysisResponse(BaseModel):
    success: bool
    data: Optional[VideoAnalysisResult] = None
    error: Optional[str] = None


class FaceInfo(BaseModel):
    bbox_px: List[int]   # [x1, y1, x2, y2] raw MTCNN pixels


class FaceDetectResult(BaseModel):
    faces: List[FaceInfo]
    face_count: int
    image_width: int
    image_height: int


class FaceDetectResponse(BaseModel):
    success: bool
    data: Optional[FaceDetectResult] = None
    error: Optional[str] = None


class HealthResponse(BaseModel):
    status: str
    version: str
    model_loaded: bool
    model_version: str


class MetadataMarker(BaseModel):
    source: str          # 'exif' | 'png_text' | 'xmp' | 'c2pa'
    field: str
    matched: str
    raw_excerpt: str


class MetadataSummary(BaseModel):
    has_exif: bool
    has_png_text: bool
    has_xmp: bool
    has_container_tags: bool = False   # video only (MP4/MOV/AVI/WebM/MKV container tags)
    software_tag: Optional[str] = None
    timestamp_inconsistency: bool = False


class MetadataAnalysisResult(BaseModel):
    status: str          # 'ai_markers_detected' | 'no_metadata' | 'metadata_present_no_markers'
    markers_found: List[MetadataMarker]
    metadata_summary: MetadataSummary


class MetadataAnalysisResponse(BaseModel):
    success: bool
    data: Optional[MetadataAnalysisResult] = None
    error: Optional[str] = None
