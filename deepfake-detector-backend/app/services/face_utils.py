import numpy as np
from PIL import Image, ImageOps
from typing import List, Optional, Tuple

MTCNN_PAD = 0.40
IMG_SIZE = 224


def detect_all_faces(image: Image.Image, mtcnn) -> Tuple[List[List[int]], int, int]:
    """
    Detect all faces and return their raw MTCNN bboxes sorted by area (largest first).
    Returns (list of [x1, y1, x2, y2] pixel coords, image_width, image_height).
    """
    image = ImageOps.exif_transpose(image.convert('RGB'))
    W, H = image.size

    try:
        boxes, _ = mtcnn.detect(image)
    except Exception:
        boxes = None

    if boxes is None or len(boxes) == 0:
        return [], W, H

    areas = [(b[2] - b[0]) * (b[3] - b[1]) for b in boxes]
    order = np.argsort(areas)[::-1]
    sorted_boxes = [[int(boxes[i][0]), int(boxes[i][1]), int(boxes[i][2]), int(boxes[i][3])] for i in order]
    return sorted_boxes, W, H


def crop_face(
    image: Image.Image,
    mtcnn,
    face_index: int = 0,
) -> Tuple[np.ndarray, str, Optional[List[int]]]:
    """
    Detect the face at face_index (0 = largest) in a PIL image and return a 224x224 padded crop.
    Falls back to a full-image resize when no face is detected.
    Returns (array HxWx3 uint8, source: 'face'|'fallback', raw_bbox [x1,y1,x2,y2] or None).
    """
    image = ImageOps.exif_transpose(image.convert('RGB'))
    W, H = image.size

    try:
        boxes, _ = mtcnn.detect(image)
    except Exception:
        boxes = None

    if boxes is not None and len(boxes) > 0:
        areas = [(b[2] - b[0]) * (b[3] - b[1]) for b in boxes]
        order = np.argsort(areas)[::-1]
        fi = min(face_index, len(order) - 1)
        x1, y1, x2, y2 = boxes[order[fi]]
        raw_bbox = [int(x1), int(y1), int(x2), int(y2)]

        bw, bh = x2 - x1, y2 - y1
        px1 = max(0, int(x1 - MTCNN_PAD * bw))
        py1 = max(0, int(y1 - MTCNN_PAD * bh))
        px2 = min(W, int(x2 + MTCNN_PAD * bw))
        py2 = min(H, int(y2 + MTCNN_PAD * bh))

        crop = image.crop((px1, py1, px2, py2)).resize((IMG_SIZE, IMG_SIZE), Image.BILINEAR)
        return np.array(crop, dtype=np.uint8), 'face', raw_bbox
    else:
        crop = image.resize((IMG_SIZE, IMG_SIZE), Image.BILINEAR)
        return np.array(crop, dtype=np.uint8), 'fallback', None
