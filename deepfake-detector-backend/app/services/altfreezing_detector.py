"""
AltFreezing v3 detector wrapper.

Loads the I3D8x8 + TimeTransformer model trained on face-swap/reenactment data.
Pipeline (identical to the research evaluation script):
  video bytes → frames at Δt=0.1s → non-overlapping clips of 8 frames
  → MTCNN on clip[0] (strategy C: same box for all 8 frames)
  → I3D8x8 → sigmoid(logit) → mean(p_fake per clip)
"""

import os
import sys
import time
import tempfile
from typing import List

import cv2
import numpy as np
from PIL import Image

ALTFREEZING_DIR = os.path.expanduser('~/resurface_licenta/scripts/video/AltFreezing')
WEIGHTS_PATH    = os.path.expanduser('~/resurface_licenta/models_video/altfreezing_v3_best.pt')

IMG_SIZE   = 224
PAD_RATIO  = 0.40
DT_SECONDS = 0.1
N_FRAMES   = 8
THRESHOLD  = 0.5
MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32)
STD  = np.array([0.229, 0.224, 0.225], dtype=np.float32)


class AltFreezingDetector:

    def __init__(self):
        self.model     = None
        self.mtcnn     = None
        self.device    = None
        self.is_loaded = False

    @staticmethod
    def _inject_fvcore_stub() -> None:
        """Inject a minimal fvcore stub so the SlowFast submodule imports succeed.

        fvcore can't be pip-installed on Python ≥ 3.14 (uses legacy setuptools).
        None of the fvcore code paths are exercised during inference — they are
        only referenced at import time by training / logging utilities.
        """
        import types, time as _time, torch.nn as nn

        if 'fvcore' in sys.modules:
            return

        # ── helpers ──────────────────────────────────────────────────────────
        def _make(path: str) -> types.ModuleType:
            m = types.ModuleType(path)
            sys.modules[path] = m
            return m

        fvcore      = _make('fvcore')
        fc_common   = _make('fvcore.common')
        fc_nn       = _make('fvcore.nn')

        # fvcore.common.file_io.PathManager
        fc_file_io = _make('fvcore.common.file_io')
        class _PathManager:
            @staticmethod
            def open(p, mode='r'): return open(p, mode)
            @staticmethod
            def get_local_path(p, **kw): return p
        fc_file_io.PathManager = _PathManager()
        fc_common.file_io = fc_file_io

        # fvcore.common.registry.Registry
        fc_registry = _make('fvcore.common.registry')
        class _Registry(dict):
            def __init__(self, name): super().__init__(); self._name = name
            def register(self, name=None):
                def _deco(cls):
                    key = name if name is not None else cls.__name__
                    self[key] = cls
                    return cls
                return _deco
            def get(self, name): return self[name]  # type: ignore
        fc_registry.Registry = _Registry
        fc_common.registry = fc_registry

        # fvcore.common.config.CfgNode  (yacs CfgNode is compatible)
        fc_config = _make('fvcore.common.config')
        from yacs.config import CfgNode as _YacsCfg
        fc_config.CfgNode = _YacsCfg
        fc_common.config = fc_config

        # fvcore.common.timer.Timer
        fc_timer = _make('fvcore.common.timer')
        class _Timer:
            def __init__(self): self._t = _time.time()
            def reset(self): self._t = _time.time()
            def seconds(self): return _time.time() - self._t
            def avg_seconds(self): return self.seconds()
            def is_paused(self): return False
            def pause(self): pass
            def resume(self): pass
        fc_timer.Timer = _Timer
        fc_common.timer = fc_timer

        # fvcore.nn.weight_init.c2_msra_fill
        fc_wi = _make('fvcore.nn.weight_init')
        def _c2_msra_fill(module: nn.Module):
            if hasattr(module, 'weight') and module.weight is not None:
                nn.init.kaiming_normal_(module.weight, mode='fan_out', nonlinearity='relu')
            if hasattr(module, 'bias') and module.bias is not None:
                nn.init.zeros_(module.bias)
        fc_wi.c2_msra_fill = _c2_msra_fill
        fc_nn.weight_init = fc_wi

        # fvcore.nn.activation_count / flop_count  (unused stubs)
        fc_ac = _make('fvcore.nn.activation_count')
        fc_ac.activation_count = lambda m, i: ({}, {})
        fc_nn.activation_count = fc_ac
        fc_fc = _make('fvcore.nn.flop_count')
        fc_fc.flop_count = lambda m, i: ({}, {})
        fc_nn.flop_count = fc_fc

        fvcore.common = fc_common
        fvcore.nn     = fc_nn

    def load_model(self) -> None:
        import torch

        # AltFreezing uses a flat module structure — insert before importing its modules
        if ALTFREEZING_DIR not in sys.path:
            sys.path.insert(0, ALTFREEZING_DIR)

        # fvcore is not pip-installable on Python ≥ 3.14; inject a stub instead
        self._inject_fvcore_stub()

        # Config MUST be applied before the model class is imported
        from config import config as af_cfg
        af_cfg.clip_size                       = 8
        af_cfg.use_checkpoint                  = False
        af_cfg.model.inco.spatial_count        = 5
        af_cfg.model.inco.keep_stride_count    = 0
        af_cfg.model.inco.no_time_pool         = False
        af_cfg.model.inco.i3d_routine          = True
        af_cfg.model.inco.SOLVER               = None
        af_cfg.model.transformer.patch_type    = 'time'
        af_cfg.model.transformer.stop_point    = 6
        af_cfg.model.transformer.random_select = True
        af_cfg.model.transformer.k             = 8
        af_cfg.model.transformer.dim           = 512
        af_cfg.model.transformer.depth         = 2

        torch.backends.cudnn.enabled = False

        from model.classifier.i3d_temporal_var_fix_dropout_tt_cfg import I3D8x8
        from facenet_pytorch import MTCNN

        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        print(f"[ALTFREEZING] Loading on {self.device}")

        self.model = I3D8x8().to(self.device)
        ckpt = torch.load(WEIGHTS_PATH, map_location=self.device)

        state_dict = ckpt['model_state_dict']
        model_dict = self.model.state_dict()
        filtered   = {k: v for k, v in state_dict.items()
                      if k in model_dict and v.shape == model_dict[k].shape}
        self.model.load_state_dict(filtered, strict=False)
        self.model.eval()
        print(f"[ALTFREEZING] Loaded (val_AUC={ckpt.get('val_auc', float('nan')):.4f})")

        self.mtcnn     = MTCNN(keep_all=True, device=self.device, post_process=False)
        self.is_loaded = True

    # ── internal helpers ──────────────────────────────────────────────────────

    def _extract_frames(self, video_path: str, max_frames: int) -> List[np.ndarray]:
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            return []
        fps  = cap.get(cv2.CAP_PROP_FPS)
        fps  = fps if fps and fps > 0 and not np.isnan(fps) else 25.0
        step = max(1, int(round(fps * DT_SECONDS)))

        frames, idx = [], 0
        while True:
            ok = cap.grab()
            if not ok:
                break
            if idx % step == 0:
                ret, frame = cap.retrieve()
                if not ret:
                    break
                frames.append(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
                if len(frames) >= max_frames:
                    break
            idx += 1
        cap.release()
        return frames

    def _face_box(self, frame_rgb: np.ndarray):
        img = Image.fromarray(frame_rgb)
        w, h = img.size
        try:
            boxes, _ = self.mtcnn.detect(img)
        except Exception:
            return None
        if boxes is None or len(boxes) == 0:
            return None

        best, best_area = None, -1
        for box in boxes:
            x1, y1, x2, y2 = box
            a = (x2 - x1) * (y2 - y1)
            if a > best_area:
                best_area, best = a, box

        x1, y1, x2, y2 = best
        bw, bh = x2 - x1, y2 - y1
        return (
            max(0, int(x1 - bw * PAD_RATIO)),
            max(0, int(y1 - bh * PAD_RATIO)),
            min(w, int(x2 + bw * PAD_RATIO)),
            min(h, int(y2 + bh * PAD_RATIO)),
        )

    def _crop_clip(self, frames: List[np.ndarray], box) -> np.ndarray:
        out = []
        for fr in frames:
            if box is None:
                crop = cv2.resize(fr, (IMG_SIZE, IMG_SIZE), interpolation=cv2.INTER_LINEAR)
            else:
                x1, y1, x2, y2 = box
                sub  = fr[y1:y2, x1:x2]
                crop = cv2.resize(sub if sub.size else fr, (IMG_SIZE, IMG_SIZE),
                                  interpolation=cv2.INTER_LINEAR)
            out.append(crop)
        return np.stack(out, axis=0)   # (8, H, W, 3)

    def _to_tensor(self, clip: np.ndarray):
        import torch
        x = clip.astype(np.float32) / 255.0
        x = (x - MEAN) / STD
        x = x.transpose(3, 0, 1, 2)   # (C, T, H, W)
        return torch.from_numpy(np.ascontiguousarray(x)).unsqueeze(0)

    # ── public API ────────────────────────────────────────────────────────────

    def detect(self, video_bytes: bytes, max_clips: int = 8) -> dict:
        import torch
        t0 = time.time()

        with tempfile.NamedTemporaryFile(suffix='.mp4', delete=False) as f:
            f.write(video_bytes)
            tmp = f.name

        try:
            frames = self._extract_frames(tmp, max_frames=max_clips * N_FRAMES)
        finally:
            try:
                os.unlink(tmp)
            except OSError:
                pass

        if len(frames) < N_FRAMES:
            return {
                'is_fake': False, 'fake_probability': 0.0,
                'clips_analyzed': 0, 'clip_scores': [],
                'processing_time_ms': (time.time() - t0) * 1000,
            }

        n_clips      = min(max_clips, len(frames) // N_FRAMES)
        clip_scores  = []

        with torch.no_grad():
            for c in range(n_clips):
                seg   = frames[c * N_FRAMES:(c + 1) * N_FRAMES]
                box   = self._face_box(seg[0])
                clip  = self._crop_clip(seg, box)
                t     = self._to_tensor(clip).to(self.device)
                out   = self.model(t)
                logit = out['final_output'].view(-1)[0]
                clip_scores.append(torch.sigmoid(logit.float()).item())

        arr      = np.array(clip_scores)
        mean_p   = float(arr.mean())

        return {
            'is_fake':            mean_p >= THRESHOLD,
            'fake_probability':   mean_p,
            'clips_analyzed':     n_clips,
            'clip_scores':        clip_scores,
            'processing_time_ms': (time.time() - t0) * 1000,
        }


# Lazy singleton — loaded on first use so startup is not affected.
# If load_model() throws, is_loaded stays False so the next request retries.
_instance: 'AltFreezingDetector | None' = None


def get_detector() -> AltFreezingDetector:
    global _instance
    if _instance is None or not _instance.is_loaded:
        _instance = AltFreezingDetector()
        _instance.load_model()  # raises on error — caller handles it
    return _instance
