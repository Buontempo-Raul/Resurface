"""
Shared AI-tool marker list and matching helper, used by both the image
metadata module (metadata_analyzer.py) and the video metadata module
(video_metadata_analyzer.py). The marker list lives in a config file
(app/core/ai_markers.json), not hardcoded here, so it can be extended
without touching either module's parsing logic.
"""

import json
from pathlib import Path
from typing import Optional

MARKERS_CONFIG_PATH = Path(__file__).resolve().parent.parent / "core" / "ai_markers.json"
RAW_EXCERPT_MAX_LEN = 300


def _load_markers() -> dict:
    with open(MARKERS_CONFIG_PATH, encoding="utf-8") as f:
        return json.load(f)


_MARKERS = _load_markers()
TOOL_MARKERS = [m.lower() for m in _MARKERS["tool_markers"]]
DIGITAL_SOURCE_MARKERS = [m.lower() for m in _MARKERS["digital_source_type_markers"]]


def match_tool_marker(text: str) -> Optional[str]:
    if not text:
        return None
    lowered = text.lower()
    for marker in TOOL_MARKERS:
        if marker in lowered:
            return marker
    return None
