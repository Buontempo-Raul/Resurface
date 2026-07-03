"""
Metadata analysis module — detects markers left by AI generation/editing tools
in image metadata (EXIF, PNG text chunks, XMP/IPTC, C2PA manifest presence).

Independent of the DINOv2 + Swin cascade: produces no probability score and
does not influence the cascade verdict. Absence of metadata is NOT treated as
a sign of manipulation (most social platforms strip EXIF on upload regardless
of authenticity) — only explicit, recognized AI-tool markers are reported as
positive findings.
"""

import re
from typing import Optional

from PIL import Image
from PIL.ExifTags import TAGS

from app.services.ai_marker_matching import DIGITAL_SOURCE_MARKERS, RAW_EXCERPT_MAX_LEN, match_tool_marker

EXIF_TEXT_FIELDS = ["Software", "UserComment", "ImageDescription", "Artist"]
EXIF_IFD_POINTER = 0x8769  # "Exif IFD" — holds UserComment, DateTimeOriginal, DateTimeDigitized

# PNG tEXt/iTXt keys that are, by themselves, tool-specific markers regardless
# of their (often large, freeform) value content.
PNG_SPECIAL_KEYS = {
    "parameters": "stable diffusion (automatic1111/webui)",
    "prompt": "comfyui",
    "workflow": "comfyui",
}


def _decode_exif_value(value) -> Optional[str]:
    if value is None:
        return None
    if isinstance(value, bytes):
        # EXIF UserComment is prefixed with an 8-byte character-code header
        # (UNICODE\x00, ASCII\x00\x00\x00, JIS\x00\x00\x00\x00\x00, or all-zero = undefined).
        if value.startswith(b"UNICODE\x00"):
            try:
                return value[8:].decode("utf-16-le", errors="ignore").strip("\x00")
            except Exception:
                return None
        if value.startswith(b"ASCII\x00\x00\x00"):
            value = value[8:]
        try:
            return value.decode("utf-8", errors="ignore").strip("\x00").strip()
        except Exception:
            return None
    return str(value).strip() or None


def _extract_exif(image: Image.Image) -> dict:
    result = {
        "has_exif": False,
        "software_tag": None,
        "timestamp_inconsistency": False,
        "markers": [],
    }

    try:
        exif = image.getexif()
    except Exception:
        return result

    if not exif or len(exif) == 0:
        return result

    base_tags = {TAGS.get(k, k): v for k, v in exif.items()}
    try:
        exif_ifd = exif.get_ifd(EXIF_IFD_POINTER)
        sub_tags = {TAGS.get(k, k): v for k, v in exif_ifd.items()}
    except Exception:
        sub_tags = {}

    all_tags = {**base_tags, **sub_tags}
    if not all_tags:
        return result

    result["has_exif"] = True

    for field in EXIF_TEXT_FIELDS:
        raw_value = all_tags.get(field)
        value = _decode_exif_value(raw_value)
        if not value:
            continue
        if field == "Software":
            result["software_tag"] = value
        matched = match_tool_marker(value)
        if matched:
            result["markers"].append({
                "source": "exif",
                "field": field,
                "matched": matched,
                "raw_excerpt": value[:RAW_EXCERPT_MAX_LEN],
            })

    timestamps = [
        _decode_exif_value(all_tags.get("DateTimeOriginal")),
        _decode_exif_value(all_tags.get("DateTimeDigitized")),
        _decode_exif_value(all_tags.get("DateTime")),
    ]
    present = [t for t in timestamps if t]
    if len(present) > 1 and len(set(present)) > 1:
        result["timestamp_inconsistency"] = True

    return result


def _extract_png_text(image: Image.Image) -> dict:
    result = {"has_png_text": False, "markers": []}

    if image.format != "PNG":
        return result

    info = image.info or {}
    for key, value in info.items():
        if key in ("xmp", "XML:com.adobe.xmp", "exif", "icc_profile"):
            continue
        if not isinstance(value, str):
            continue

        result["has_png_text"] = True
        key_lower = key.lower()

        if key_lower in PNG_SPECIAL_KEYS:
            result["markers"].append({
                "source": "png_text",
                "field": key,
                "matched": PNG_SPECIAL_KEYS[key_lower],
                "raw_excerpt": value[:RAW_EXCERPT_MAX_LEN],
            })
            continue

        matched = match_tool_marker(value) or match_tool_marker(key)
        if matched:
            result["markers"].append({
                "source": "png_text",
                "field": key,
                "matched": matched,
                "raw_excerpt": value[:RAW_EXCERPT_MAX_LEN],
            })

    return result


def _xmp_field(xmp_str: str, field_name: str) -> Optional[str]:
    m = re.search(rf'{field_name}\s*=\s*"([^"]*)"', xmp_str, re.IGNORECASE)
    if m:
        return m.group(1)
    m = re.search(rf'<[\w]+:{field_name}[^>]*>([^<]*)</[\w]+:{field_name}>', xmp_str, re.IGNORECASE)
    if m:
        return m.group(1)
    return None


def _extract_xmp(image: Image.Image) -> dict:
    result = {"has_xmp": False, "markers": []}

    xmp_raw = (image.info or {}).get("xmp")
    if not xmp_raw and image.format == "PNG":
        xmp_raw = (image.info or {}).get("XML:com.adobe.xmp")
    if not xmp_raw:
        return result

    if isinstance(xmp_raw, bytes):
        xmp_str = xmp_raw.decode("utf-8", errors="ignore")
    else:
        xmp_str = str(xmp_raw)

    if not xmp_str.strip():
        return result

    result["has_xmp"] = True

    creator_tool = _xmp_field(xmp_str, "CreatorTool")
    if creator_tool:
        matched = match_tool_marker(creator_tool)
        if matched:
            result["markers"].append({
                "source": "xmp",
                "field": "CreatorTool",
                "matched": matched,
                "raw_excerpt": creator_tool[:RAW_EXCERPT_MAX_LEN],
            })

    digital_source_type = _xmp_field(xmp_str, "DigitalSourceType")
    if digital_source_type:
        lowered = digital_source_type.lower()
        matched = next((m for m in DIGITAL_SOURCE_MARKERS if m in lowered), None)
        if matched:
            result["markers"].append({
                "source": "xmp",
                "field": "digitalSourceType",
                "matched": matched,
                "raw_excerpt": digital_source_type[:RAW_EXCERPT_MAX_LEN],
            })

    return result


def _detect_c2pa(raw_bytes: bytes) -> bool:
    return b"c2pa" in raw_bytes.lower()


def analyze_metadata(image: Image.Image, raw_bytes: bytes) -> dict:
    """
    Analyze an already-opened PIL image (and its raw file bytes, for the C2PA
    presence check) for AI-generation/editing metadata markers.

    Returns a dict matching the MetadataAnalysisResult schema.
    """
    exif_info = _extract_exif(image)
    png_info = _extract_png_text(image)
    xmp_info = _extract_xmp(image)

    markers_found = [*exif_info["markers"], *png_info["markers"], *xmp_info["markers"]]

    if _detect_c2pa(raw_bytes):
        markers_found.append({
            "source": "c2pa",
            "field": "manifest",
            "matched": "c2pa manifest detected",
            "raw_excerpt": "C2PA provenance manifest detected in the file "
                           "(presence flagged only; cryptographic signature is not validated in v1).",
        })

    has_exif = exif_info["has_exif"]
    has_png_text = png_info["has_png_text"]
    has_xmp = xmp_info["has_xmp"]

    if markers_found:
        status = "ai_markers_detected"
    elif not has_exif and not has_png_text and not has_xmp:
        status = "no_metadata"
    else:
        status = "metadata_present_no_markers"

    return {
        "status": status,
        "markers_found": markers_found,
        "metadata_summary": {
            "has_exif": has_exif,
            "has_png_text": has_png_text,
            "has_xmp": has_xmp,
            "has_container_tags": False,
            "software_tag": exif_info["software_tag"],
            "timestamp_inconsistency": exif_info["timestamp_inconsistency"],
        },
    }
