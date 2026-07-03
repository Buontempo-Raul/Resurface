FROM python:3.11-slim

WORKDIR /app

# ffprobe (from ffmpeg) is used to read video container metadata (see
# app/services/video_metadata_analyzer.py) — no Python package provides this.
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Install PyTorch (CPU build for portability; for GPU use the cu121 index URL)
RUN pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu

# Install remaining dependencies
RUN pip install --no-cache-dir --timeout=300 -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
