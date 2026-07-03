"""
Video metadata analysis — extends the image metadata module
(metadata_analyzer.py) to video containers (MP4/MOV/AVI/WebM/MKV).

Video containers don't have EXIF/PNG-text/XMP; instead, AI video-generation
tools (RunwayML, Synthesia, HeyGen, DeepFaceLab, FaceSwap, ComfyUI video
workflows, etc.) tend to leave their name in container-level tags — MP4
`encoder`/`com.apple.quicktime.software`, RIFF/AVI `ISFT`, Matroska/WebM
`ENCODER`/`writing_application`. `ffprobe` (ffmpeg) reads all of these
uniformly as a JSON `format.tags` / per-stream `tags` dict, so we shell out
to it rather than hand-rolling four different container parsers.

Same independence and three-state contract as the image module: no
probability score, no influence on the cascade verdict.
"""

import json
import os
import subprocess
import tempfile
from typing import Optional

from app.services.ai_marker_matching import RAW_EXCERPT_MAX_LEN, match_tool_marker

FFPROBE_TIMEOUT = 15
SOFTWARE_TAG_KEYS = {
    "encoder", "software", "writing_application",
    "com.apple.quicktime.software", "creation_tool",
}


def _run_ffprobe(video_bytes: bytes) -> Optional[dict]:
    fd, tmp_path = tempfile.mkstemp(suffix=".bin")
    try:
        with os.fdopen(fd, "wb") as f:
            f.write(video_bytes)
        proc = subprocess.run(
            ["ffprobe", "-v", "quiet", "-print_format", "json", "-show_format", "-show_streams", tmp_path],
            capture_output=True, timeout=FFPROBE_TIMEOUT,
        )
        if proc.returncode != 0 or not proc.stdout:
            return None
        return json.loads(proc.stdout)
    except (FileNotFoundError, subprocess.TimeoutExpired, json.JSONDecodeError, OSError):
        # ffprobe missing, corrupt/unsupported file, or timeout — treated the
        # same as "no metadata available", not as an error (see spec §7).
        return None
    finally:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass


def _collect_tags(probe: dict) -> dict:
    tags = dict((probe.get("format") or {}).get("tags") or {})
    for stream in probe.get("streams") or []:
        for key, value in ((stream.get("tags") or {}).items()):
            tags.setdefault(key, value)
    return tags


def analyze_video_metadata(video_bytes: bytes) -> dict:
    """
    Analyze raw video file bytes for AI-generation/editing container-tag
    markers. Returns a dict matching the MetadataAnalysisResult schema.
    """
    probe = _run_ffprobe(video_bytes)

    if probe is None:
        return {
            "status": "no_metadata",
            "markers_found": [],
            "metadata_summary": {
                "has_exif": False,
                "has_png_text": False,
                "has_xmp": False,
                "has_container_tags": False,
                "software_tag": None,
                "timestamp_inconsistency": False,
            },
        }

    tags = _collect_tags(probe)
    has_container_tags = bool(tags)

    markers_found = []
    software_tag = None
    for key, value in tags.items():
        if not isinstance(value, str) or not value:
            continue
        if software_tag is None and key.lower() in SOFTWARE_TAG_KEYS:
            software_tag = value
        matched = match_tool_marker(value) or match_tool_marker(key)
        if matched:
            markers_found.append({
                "source": "container_tag",
                "field": key,
                "matched": matched,
                "raw_excerpt": value[:RAW_EXCERPT_MAX_LEN],
            })

    if markers_found:
        status = "ai_markers_detected"
    elif not has_container_tags:
        status = "no_metadata"
    else:
        status = "metadata_present_no_markers"

    return {
        "status": status,
        "markers_found": markers_found,
        "metadata_summary": {
            "has_exif": False,
            "has_png_text": False,
            "has_xmp": False,
            "has_container_tags": has_container_tags,
            "software_tag": software_tag,
            "timestamp_inconsistency": False,
        },
    }
