import time
import numpy as np
from PIL import Image

from app.services.detector import BaseDetector
from app.services.face_utils import crop_face
from app.core.config import settings

IMAGENET_MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32).reshape(1, 1, 3)
IMAGENET_STD = np.array([0.229, 0.224, 0.225], dtype=np.float32).reshape(1, 1, 3)

FAMILIES = ['faceswap', 'reenactment', 'talking', 'gan', 'diffusion']


def _entropy(probs: np.ndarray, eps: float = 1e-12) -> float:
    p = np.clip(probs, eps, 1.0)
    return float(-np.sum(p * np.log(p)))


class ImageCascadeDetector(BaseDetector):
    """Resurface cascade: DINOv2 binary detector → Swin 37-class method classifier."""

    def __init__(self):
        super().__init__()
        self.model_version = "Resurface Cascade v1 (DINOv2 + Swin-37)"
        self.binary = None
        self.classifier = None
        self.mtcnn = None
        self.idx_to_method = None
        self.method_to_family = None
        self.agg = None
        self.device = None

    def load_model(self, model_path: str = None) -> None:
        import torch
        import torch.nn as nn
        import timm
        from facenet_pytorch import MTCNN

        self.device = 'cuda' if torch.cuda.is_available() else 'cpu'
        print(f"[CASCADE] Loading on {self.device}")

        # ── DINOv2 binary (real/fake) ──
        class DINOv2Binary(nn.Module):
            def __init__(s):
                super().__init__()
                s.backbone = timm.create_model(
                    'vit_base_patch14_dinov2.lvd142m',
                    pretrained=False, num_classes=0, img_size=224,
                )
                s.classifier = nn.Sequential(
                    nn.Dropout(0.3), nn.Linear(s.backbone.num_features, 256),
                    nn.GELU(), nn.Dropout(0.2), nn.Linear(256, 1),
                )
            def forward(s, x):
                return s.classifier(s.backbone(x)).squeeze(1)

        dino_ckpt = torch.load(settings.DINOV2_MODEL_PATH, map_location=self.device)
        self.binary = DINOv2Binary().to(self.device)
        self.binary.load_state_dict(dino_ckpt['model_state_dict'])
        self.binary.eval()
        print(f"[CASCADE] DINOv2 binary loaded (val_auc={dino_ckpt.get('val_auc', '?')})")

        # ── Swin classifier (37 methods) ──
        swin_ckpt = torch.load(settings.SWIN_CLF_MODEL_PATH, map_location=self.device)
        idx_raw = swin_ckpt['idx_to_method']
        self.idx_to_method = (
            {int(k): v for k, v in idx_raw.items()}
            if isinstance(list(idx_raw.keys())[0], str) else idx_raw
        )
        self.method_to_family = swin_ckpt['method_to_family']
        n_classes = swin_ckpt['n_classes']

        fam_to_fidx = {f: i for i, f in enumerate(FAMILIES)}
        self.agg = np.zeros((n_classes, len(FAMILIES)), dtype=np.float32)
        for m_idx in range(n_classes):
            fam = self.method_to_family[self.idx_to_method[m_idx]]
            self.agg[m_idx, fam_to_fidx[fam]] = 1.0

        class SwinClassifier(nn.Module):
            def __init__(s, nc):
                super().__init__()
                s.backbone = timm.create_model(
                    'swin_base_patch4_window7_224',
                    pretrained=False, num_classes=0,
                )
                s.classifier = nn.Sequential(
                    nn.Dropout(0.3), nn.Linear(s.backbone.num_features, 512),
                    nn.GELU(), nn.Dropout(0.2), nn.Linear(512, nc),
                )
            def forward(s, x):
                return s.classifier(s.backbone(x))

        self.classifier = SwinClassifier(n_classes).to(self.device)
        self.classifier.load_state_dict(swin_ckpt['model_state_dict'])
        self.classifier.eval()
        print(f"[CASCADE] Swin classifier loaded ({n_classes} methods)")

        self.mtcnn = MTCNN(keep_all=True, device=self.device, post_process=False)
        self.is_loaded = True

    def _to_tensor(self, img_uint8: np.ndarray):
        import torch
        x = img_uint8.astype(np.float32) / 255.0
        x = (x - IMAGENET_MEAN) / IMAGENET_STD
        return torch.from_numpy(x.transpose(2, 0, 1)[None].copy()).to(self.device)

    def detect(self, image: Image.Image, face_index: int = 0) -> dict:
        import torch
        t0 = time.time()

        img_arr, face_source, face_bbox = crop_face(image, self.mtcnn, face_index)
        tensor = self._to_tensor(img_arr)

        use_amp = self.device == 'cuda'
        with torch.no_grad():
            if use_amp:
                with torch.cuda.amp.autocast():
                    p_fake = torch.sigmoid(self.binary(tensor).float()).item()
            else:
                p_fake = torch.sigmoid(self.binary(tensor).float()).item()

        is_fake = p_fake >= settings.BINARY_THRESHOLD
        family = None
        method = None
        is_unknown_method = False
        family_entropy = 0.0

        if is_fake:
            with torch.no_grad():
                if use_amp:
                    with torch.cuda.amp.autocast():
                        probs_m = torch.softmax(self.classifier(tensor).float(), dim=1).cpu().numpy()[0]
                else:
                    probs_m = torch.softmax(self.classifier(tensor).float(), dim=1).cpu().numpy()[0]

            probs_f = probs_m @ self.agg
            family_entropy = _entropy(probs_f)
            family = FAMILIES[int(probs_f.argmax())]

            if family_entropy > settings.OOD_ENTROPY_THRESHOLD:
                is_unknown_method = True
                method = None
            else:
                is_unknown_method = False
                method = self.idx_to_method[int(probs_m.argmax())]

        return {
            'is_fake': is_fake,
            'fake_probability': float(p_fake),
            'family': family,
            'method': method,
            'is_unknown_method': is_unknown_method,
            'family_entropy': float(family_entropy),
            'processing_time_ms': (time.time() - t0) * 1000,
            'face_source': face_source,
            'face_bbox': face_bbox,
        }

    def classify_family(self, image: Image.Image) -> dict:
        """Run ONLY Swin-37, skipping the DINOv2 binary gate.

        Used by the AltFreezing hybrid path: AltFreezing has already determined
        the video is fake, so we just need the deepfake type classification.
        """
        import torch
        img_arr, _, _ = crop_face(image, self.mtcnn)
        tensor = self._to_tensor(img_arr)
        use_amp = self.device == 'cuda'

        with torch.no_grad():
            if use_amp:
                with torch.cuda.amp.autocast():
                    probs_m = torch.softmax(self.classifier(tensor).float(), dim=1).cpu().numpy()[0]
            else:
                probs_m = torch.softmax(self.classifier(tensor).float(), dim=1).cpu().numpy()[0]

        probs_f = probs_m @ self.agg
        family_entropy = _entropy(probs_f)
        family = FAMILIES[int(probs_f.argmax())]

        if family_entropy > settings.OOD_ENTROPY_THRESHOLD:
            return {'family': family, 'method': None, 'is_unknown_method': True,
                    'family_entropy': float(family_entropy)}
        return {
            'family': family,
            'method': self.idx_to_method[int(probs_m.argmax())],
            'is_unknown_method': False,
            'family_entropy': float(family_entropy),
        }
