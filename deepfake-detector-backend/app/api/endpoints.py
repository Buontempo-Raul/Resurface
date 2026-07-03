import time

from fastapi import APIRouter, UploadFile, File, HTTPException, Query

from app.models.schemas import (
    AnalysisResponse, AnalysisResult, ImageCascadeResult,
    VideoAnalysisResponse, VideoAnalysisResult,
    FaceDetectResponse, FaceDetectResult, FaceInfo,
    MetadataAnalysisResponse, MetadataAnalysisResult, MetadataMarker, MetadataSummary,
    HealthResponse,
)
from app.core.image_utils import ImageValidator, ImageProcessor
from app.core.config import settings
from app.services.image_cascade_detector import ImageCascadeDetector
from app.services.face_utils import detect_all_faces
from app.services.video_utils import extract_frames, aggregate_family_classifications
from app.services.metadata_analyzer import analyze_metadata
from app.services.video_metadata_analyzer import analyze_video_metadata

router = APIRouter(prefix="/api", tags=["detection"])

detector = ImageCascadeDetector()
detector.load_model()


@router.post("/detect-faces", response_model=FaceDetectResponse)
async def detect_faces(image: UploadFile = File(...)):
    """Detect all faces in an image and return their bounding boxes (no classification)."""
    try:
        pil_image, _ = await ImageValidator.load_image_from_upload(image)
        pil_image = ImageProcessor.preprocess_for_detection(pil_image)

        boxes, W, H = detect_all_faces(pil_image, detector.mtcnn)

        return FaceDetectResponse(
            success=True,
            data=FaceDetectResult(
                faces=[FaceInfo(bbox_px=b) for b in boxes],
                face_count=len(boxes),
                image_width=W,
                image_height=H,
            ),
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Face detection failed: {e}")
        return FaceDetectResponse(success=False, data=None, error=f"Face detection failed: {e}")


@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_image(
    image: UploadFile = File(...),
    face_index: int = Query(default=0, ge=0, description="Which detected face to analyze (0 = largest)"),
):
    try:
        pil_image, _ = await ImageValidator.load_image_from_upload(image)
        pil_image = ImageProcessor.preprocess_for_detection(pil_image)

        result = detector.detect(pil_image, face_index=face_index)

        return AnalysisResponse(
            success=True,
            data=AnalysisResult(
                image_result=ImageCascadeResult(
                    is_fake=result['is_fake'],
                    fake_probability=result['fake_probability'],
                    family=result['family'],
                    method=result['method'],
                    is_unknown_method=result['is_unknown_method'],
                    family_entropy=result['family_entropy'],
                    face_source=result['face_source'],
                    face_bbox=result['face_bbox'],
                ),
                processing_time_ms=result['processing_time_ms'],
            ),
            error=None,
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Analysis failed: {e}")
        return AnalysisResponse(success=False, data=None, error=f"Analysis failed: {e}")


@router.post("/analyze-metadata", response_model=MetadataAnalysisResponse)
async def analyze_metadata_endpoint(image: UploadFile = File(...)):
    """Extract image metadata (EXIF/PNG text/XMP) and flag known AI-generation
    tool markers. Independent of the DINOv2/Swin cascade — no probability
    score, three-state result only (see app/services/metadata_analyzer.py).
    """
    try:
        pil_image, _ = await ImageValidator.load_image_from_upload(image)
        await image.seek(0)
        raw_bytes = await image.read()

        result = analyze_metadata(pil_image, raw_bytes)

        return MetadataAnalysisResponse(
            success=True,
            data=MetadataAnalysisResult(
                status=result['status'],
                markers_found=[MetadataMarker(**m) for m in result['markers_found']],
                metadata_summary=MetadataSummary(**result['metadata_summary']),
            ),
            error=None,
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Metadata analysis failed: {e}")
        return MetadataAnalysisResponse(success=False, data=None, error=f"Metadata analysis failed: {e}")


ALLOWED_VIDEO_EXTENSIONS = {'.mp4', '.mov', '.avi', '.webm', '.mkv'}
ALLOWED_VIDEO_MIME_PREFIXES = ('video/',)


@router.post("/analyze-video", response_model=VideoAnalysisResponse)
async def analyze_video(video: UploadFile = File(...)):
    """Analyze a video with AltFreezing (I3D + TimeTransformer).
    When the video is FAKE, Swin-37 classifies the deepfake family/method.
    """
    try:
        ext = '.' + video.filename.rsplit('.', 1)[-1].lower() if '.' in video.filename else ''
        is_valid_ext = ext in ALLOWED_VIDEO_EXTENSIONS
        is_valid_mime = any(video.content_type.startswith(p) for p in ALLOWED_VIDEO_MIME_PREFIXES)
        if not is_valid_ext and not is_valid_mime:
            return VideoAnalysisResponse(
                success=False, data=None,
                error=f"Unsupported format. Allowed: {', '.join(ALLOWED_VIDEO_EXTENSIONS)}",
            )

        contents = await video.read()
        if len(contents) > settings.VIDEO_MAX_FILE_SIZE:
            max_mb = settings.VIDEO_MAX_FILE_SIZE // (1024 * 1024)
            return VideoAnalysisResponse(
                success=False, data=None,
                error=f"Video too large. Maximum size is {max_mb} MB.",
            )

        t0 = time.time()
        from app.services.altfreezing_detector import get_detector as get_af
        af = get_af()
        r = af.detect(contents)

        if r['clips_analyzed'] == 0:
            return VideoAnalysisResponse(
                success=False, data=None,
                error="Video too short for analysis (need at least 8 frames at 0.1s intervals).",
            )

        family = method = None
        is_unknown_method = False
        family_entropy = 0.0

        if r['is_fake']:
            try:
                cascade_frames, _ = extract_frames(contents, n_frames=settings.VIDEO_N_FRAMES)
                if cascade_frames:
                    cls_results = [detector.classify_family(f) for f in cascade_frames]
                    cls_agg = aggregate_family_classifications(cls_results)
                    family            = cls_agg['family']
                    method            = cls_agg['method']
                    is_unknown_method = cls_agg['is_unknown_method']
                    family_entropy    = cls_agg['family_entropy']
            except Exception as ce:
                print(f"[WARN] Family classification failed: {ce}")

        fake_clips = sum(1 for p in r['clip_scores'] if p >= 0.5)
        return VideoAnalysisResponse(
            success=True,
            data=VideoAnalysisResult(
                image_result=ImageCascadeResult(
                    is_fake=r['is_fake'],
                    fake_probability=r['fake_probability'],
                    family=family,
                    method=method,
                    is_unknown_method=is_unknown_method,
                    family_entropy=family_entropy,
                    face_source='altfreezing',
                    face_bbox=None,
                ),
                processing_time_ms=(time.time() - t0) * 1000,
                frames_analyzed=r['clips_analyzed'],
                fake_frames=fake_clips,
                frame_p_fakes=r['clip_scores'],
                model_used='altfreezing',
            ),
            error=None,
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Video analysis failed: {e}")
        return VideoAnalysisResponse(success=False, data=None, error=f"Analysis failed: {e}")


@router.post("/analyze-video-metadata", response_model=MetadataAnalysisResponse)
async def analyze_video_metadata_endpoint(video: UploadFile = File(...)):
    """Extract video container metadata (MP4/MOV/AVI/WebM/MKV tags via ffprobe)
    and flag known AI-generation tool markers. Independent of AltFreezing/the
    cascade — no probability score, three-state result only (see
    app/services/video_metadata_analyzer.py).
    """
    try:
        ext = '.' + video.filename.rsplit('.', 1)[-1].lower() if '.' in video.filename else ''
        is_valid_ext = ext in ALLOWED_VIDEO_EXTENSIONS
        is_valid_mime = any(video.content_type.startswith(p) for p in ALLOWED_VIDEO_MIME_PREFIXES)
        if not is_valid_ext and not is_valid_mime:
            return MetadataAnalysisResponse(
                success=False, data=None,
                error=f"Unsupported format. Allowed: {', '.join(ALLOWED_VIDEO_EXTENSIONS)}",
            )

        contents = await video.read()
        if len(contents) > settings.VIDEO_MAX_FILE_SIZE:
            max_mb = settings.VIDEO_MAX_FILE_SIZE // (1024 * 1024)
            return MetadataAnalysisResponse(
                success=False, data=None,
                error=f"Video too large. Maximum size is {max_mb} MB.",
            )

        result = analyze_video_metadata(contents)

        return MetadataAnalysisResponse(
            success=True,
            data=MetadataAnalysisResult(
                status=result['status'],
                markers_found=[MetadataMarker(**m) for m in result['markers_found']],
                metadata_summary=MetadataSummary(**result['metadata_summary']),
            ),
            error=None,
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Video metadata analysis failed: {e}")
        return MetadataAnalysisResponse(success=False, data=None, error=f"Metadata analysis failed: {e}")


@router.get("/health", response_model=HealthResponse)
async def health_check():
    info = detector.get_model_info()
    return HealthResponse(
        status="healthy",
        version=settings.API_VERSION,
        model_loaded=info['is_loaded'],
        model_version=info['version'],
    )


@router.get("/")
async def root():
    return {
        "name": settings.API_TITLE,
        "version": settings.API_VERSION,
        "endpoints": {
            "detect-faces": "/api/detect-faces (POST)",
            "analyze":      "/api/analyze (POST, ?face_index=0)",
            "analyze-video": "/api/analyze-video (POST)",
            "analyze-metadata": "/api/analyze-metadata (POST)",
            "analyze-video-metadata": "/api/analyze-video-metadata (POST)",
            "health":       "/api/health (GET)",
        },
    }
