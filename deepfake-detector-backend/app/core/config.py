from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    API_TITLE: str = "Resurface Deepfake Detection API"
    API_VERSION: str = "1.0.0"
    API_DESCRIPTION: str = "Deepfake image detection using the Resurface cascade (DINOv2 + Swin)"

    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = True

    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
    ]

    MAX_FILE_SIZE: int = 20 * 1024 * 1024  # 20 MB
    ALLOWED_EXTENSIONS: List[str] = [".jpg", ".jpeg", ".png", ".webp"]
    ALLOWED_MIME_TYPES: List[str] = ["image/jpeg", "image/png", "image/webp"]

    VIDEO_MAX_FILE_SIZE: int = 200 * 1024 * 1024  # 200 MB
    VIDEO_N_FRAMES: int = 8  # frames sampled evenly from the video

    # Resurface cascade — model paths
    DINOV2_MODEL_PATH: str = "models/dinov2_binary.pt"
    SWIN_CLF_MODEL_PATH: str = "models/swin_base_classifier37_method.pt"

    # Resurface cascade — calibrated thresholds
    BINARY_THRESHOLD: float = 0.523   # Youden optimum, DINOv2 binary
    OOD_ENTROPY_THRESHOLD: float = 0.365  # P99_image, Swin family entropy

    INFERENCE_TIMEOUT: int = 30
    RATE_LIMIT: int = 60

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
