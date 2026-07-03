import os
import tempfile
from collections import Counter
from typing import List, Tuple

import cv2
import numpy as np
from PIL import Image


def extract_frames(video_bytes: bytes, n_frames: int = 8) -> Tuple[List[Image.Image], int]:
    """
    Extract n_frames evenly-spaced frames from raw video bytes.
    Returns (list_of_PIL_RGB_images, total_frame_count).
    Falls back to fewer frames if the video is shorter than n_frames.
    """
    with tempfile.NamedTemporaryFile(suffix='.mp4', delete=False) as f:
        f.write(video_bytes)
        tmp_path = f.name

    frames: List[Image.Image] = []
    total = 0
    try:
        cap = cv2.VideoCapture(tmp_path)
        total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

        if total > 0:
            n = min(n_frames, total)
            indices = [int(round(i * (total - 1) / max(n - 1, 1))) for i in range(n)]
            for idx in sorted(set(indices)):
                cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
                ret, frame = cap.read()
                if ret:
                    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                    frames.append(Image.fromarray(rgb))
        cap.release()
    finally:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass

    return frames, total


def aggregate_family_classifications(classifications: List[dict]) -> dict:
    """Majority-vote family/method from a list of classify_family() results.

    Used by the AltFreezing hybrid path where we skip the DINOv2 binary gate
    and run Swin-37 on every frame unconditionally.
    """
    if not classifications:
        return {'family': None, 'method': None, 'is_unknown_method': False, 'family_entropy': 0.0}

    family_counts = Counter(c['family'] for c in classifications if c.get('family'))
    family = family_counts.most_common(1)[0][0] if family_counts else None

    known = [c for c in classifications if not c['is_unknown_method'] and c.get('method')]
    if known:
        method = Counter(c['method'] for c in known).most_common(1)[0][0]
        is_unknown_method = False
    else:
        method = None
        is_unknown_method = True

    family_entropy = float(np.mean([c['family_entropy'] for c in classifications]))

    return {
        'family': family,
        'method': method,
        'is_unknown_method': is_unknown_method,
        'family_entropy': family_entropy,
    }


def aggregate_frame_results(frame_results: List[dict], binary_threshold: float) -> dict:
    """
    Aggregate per-frame cascade results into a single video verdict.
    Strategy: mean(p_fake) as the overall score; majority vote for family/method.
    """
    if not frame_results:
        return {
            'is_fake': False,
            'fake_probability': 0.0,
            'family': None,
            'method': None,
            'is_unknown_method': False,
            'family_entropy': 0.0,
            'face_source': 'aggregated',
            'fake_frames': 0,
            'frame_p_fakes': [],
        }

    p_fakes = [r['fake_probability'] for r in frame_results]
    mean_p_fake = float(np.mean(p_fakes))
    is_fake = mean_p_fake >= binary_threshold
    fake_count = sum(1 for r in frame_results if r['is_fake'])

    family = None
    method = None
    is_unknown_method = False
    mean_entropy = 0.0

    if is_fake:
        fake_frames = [r for r in frame_results if r['is_fake']]
        source = fake_frames if fake_frames else frame_results

        family_counts = Counter(r['family'] for r in source if r['family'])
        if family_counts:
            family = family_counts.most_common(1)[0][0]

        known = [r for r in source if not r['is_unknown_method'] and r['method']]
        if known:
            method = Counter(r['method'] for r in known).most_common(1)[0][0]
            is_unknown_method = False
        else:
            is_unknown_method = True

        mean_entropy = float(np.mean([r['family_entropy'] for r in source]))

    return {
        'is_fake': is_fake,
        'fake_probability': mean_p_fake,
        'family': family,
        'method': method,
        'is_unknown_method': is_unknown_method,
        'family_entropy': mean_entropy,
        'face_source': 'aggregated',
        'fake_frames': fake_count,
        'frame_p_fakes': p_fakes,
    }
