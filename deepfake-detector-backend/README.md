# Deepfake Detector - Backend API

FastAPI-based backend service for deepfake image detection using AI.

## 🚀 Features

- **RESTful API**: Clean, well-documented API endpoints
- **Mock Mode**: Development mode with simulated detection results
- **Modular Design**: Easy to swap mock detector with real AI model
- **Image Validation**: Comprehensive file validation and preprocessing
- **CORS Support**: Configured for frontend integration
- **Error Handling**: Robust error handling and validation
- **Auto-Documentation**: Interactive API docs with Swagger UI
- **Type Safety**: Pydantic models for request/response validation

## 📋 Prerequisites

- Python 3.10 or higher
- pip (Python package manager)

## 🛠️ Installation

### 1. Navigate to Backend Directory

```bash
cd deepfake-detector-backend
```

### 2. Create Virtual Environment (Recommended)

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Environment (Optional)

Copy the example environment file and customize if needed:

```bash
cp .env.example .env
```

Edit `.env` to change settings like port, CORS origins, etc.

## 🏃 Running the Server

### Development Mode (with auto-reload)

```bash
python main.py
```

Or using uvicorn directly:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Production Mode

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

The server will start on `http://localhost:8000`

## 📖 API Documentation

Once the server is running, access the interactive API documentation:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🔌 API Endpoints

### POST /api/analyze

Analyze an image for deepfake detection.

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body: `image` (file) - Image file (JPG, JPEG, PNG, max 10MB)

**Response:**
```json
{
  "success": true,
  "data": {
    "is_fake": true,
    "confidence": 87.5,
    "generation_method": "GAN",
    "heatmap_url": null,
    "details": {
      "processing_time": 1234.56,
      "model_version": "MockModel v1.0",
      "anomalies": [
        {"region": "Eyes", "score": 78.3},
        {"region": "Mouth", "score": 65.2}
      ]
    }
  },
  "error": null
}
```

**cURL Example:**
```bash
curl -X POST "http://localhost:8000/api/analyze" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "image=@/path/to/image.jpg"
```

### GET /api/health

Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "model_loaded": true,
  "model_version": "MockModel v1.0"
}
```

### GET /api/

API information endpoint.

### GET /

Root endpoint with welcome message.

## 📁 Project Structure

```
deepfake-detector-backend/
├── app/
│   ├── api/
│   │   ├── __init__.py
│   │   └── endpoints.py          # API route handlers
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py             # Application settings
│   │   └── image_utils.py        # Image validation & processing
│   ├── models/
│   │   ├── __init__.py
│   │   └── schemas.py            # Pydantic models
│   └── services/
│       ├── __init__.py
│       ├── detector.py           # Base detector interface
│       └── mock_detector.py      # Mock detector implementation
├── tests/                        # Unit tests (future)
├── main.py                       # Application entry point
├── requirements.txt              # Python dependencies
├── .env.example                  # Example environment variables
├── .gitignore                    # Git ignore rules
└── README.md                     # This file
```

## ⚙️ Configuration

Configuration is managed through environment variables. Key settings:

| Variable | Default | Description |
|----------|---------|-------------|
| `API_TITLE` | Deepfake Detection API | API title |
| `API_VERSION` | 1.0.0 | API version |
| `HOST` | 0.0.0.0 | Server host |
| `PORT` | 8000 | Server port |
| `DEBUG` | True | Debug mode |
| `USE_MOCK_DETECTOR` | True | Use mock detector |
| `MAX_FILE_SIZE` | 10485760 | Max upload size (bytes) |
| `ALLOWED_EXTENSIONS` | .jpg,.jpeg,.png | Allowed file types |

## 🔧 Development

### Mock Mode

The backend currently runs in **mock mode**, which generates simulated detection results. This allows:
- Frontend development to proceed independently
- Testing of the entire workflow
- API contract validation

To use mock mode (default):
```python
# In .env or config.py
USE_MOCK_DETECTOR=True
```

### Integrating Real AI Model

When your AI model is ready, follow these steps:

#### 1. Create Real Detector Class

Create `app/services/real_detector.py`:

```python
from app.services.detector import BaseDetector
from PIL import Image
import torch  # or tensorflow

class RealDetector(BaseDetector):
    def __init__(self):
        super().__init__()
        self.model_version = "YourModel v1.0"
        self.model = None
    
    def load_model(self, model_path: str):
        # Load your trained model
        self.model = torch.load(model_path)
        self.model.eval()
        self.is_loaded = True
    
    def detect(self, image: Image.Image):
        # Implement your detection logic
        # Process image through your model
        # Return results in the expected format
        pass
```

#### 2. Update Configuration

```python
# In .env
USE_MOCK_DETECTOR=False
MODEL_PATH=models/your_model.pth
```

#### 3. Update Endpoints

In `app/api/endpoints.py`, the import will automatically switch:

```python
if settings.USE_MOCK_DETECTOR:
    from app.services.mock_detector import MockDetector as Detector
else:
    from app.services.real_detector import RealDetector as Detector
```

## 🧪 Testing

### Manual Testing with cURL

```bash
# Analyze an image
curl -X POST "http://localhost:8000/api/analyze" \
  -F "image=@test_image.jpg"

# Health check
curl http://localhost:8000/api/health
```

### Testing with Python

```python
import requests

# Analyze image
with open('test_image.jpg', 'rb') as f:
    files = {'image': f}
    response = requests.post('http://localhost:8000/api/analyze', files=files)
    print(response.json())
```

### Unit Tests (Future)

```bash
# Install pytest
pip install pytest pytest-asyncio

# Run tests
pytest tests/
```

## 🐛 Troubleshooting

### Port Already in Use

Change the port in `.env`:
```
PORT=8001
```

### CORS Issues

Add your frontend URL to CORS origins in `app/core/config.py`:
```python
CORS_ORIGINS: List[str] = [
    "http://localhost:3000",
    "http://your-frontend-url.com",
]
```

### Import Errors

Make sure you're in the virtual environment:
```bash
source venv/bin/activate  # macOS/Linux
venv\Scripts\activate     # Windows
```

### Image Upload Fails

Check:
1. File format is JPG, JPEG, or PNG
2. File size is under 10MB
3. MIME type is correct

## 🔒 Security Considerations

Current security measures:
- ✅ File type validation (extension + MIME)
- ✅ File size limits
- ✅ Image verification
- ✅ CORS configuration
- ✅ Error message sanitization

For production, consider adding:
- [ ] Rate limiting (e.g., with slowapi)
- [ ] Authentication/API keys
- [ ] Request logging
- [ ] Input sanitization
- [ ] HTTPS enforcement

## 📊 Performance

Current performance (mock mode):
- **Processing time**: 0.5-2.5 seconds (simulated)
- **Concurrent requests**: Limited by uvicorn workers
- **Memory usage**: Minimal (no model loaded)

With real AI model:
- Processing time will depend on model size
- Consider GPU acceleration for better performance
- May need request queuing for high load

## 🚀 Deployment

### Development

Already configured for local development with auto-reload.

### Production

1. **Set production settings**:
   ```bash
   DEBUG=False
   USE_MOCK_DETECTOR=False
   ```

2. **Use multiple workers**:
   ```bash
   uvicorn main:app --workers 4 --host 0.0.0.0 --port 8000
   ```

3. **Use a process manager** (e.g., Supervisor, systemd):
   ```ini
   [program:deepfake-api]
   command=/path/to/venv/bin/uvicorn main:app --workers 4
   directory=/path/to/backend
   ```

4. **Use reverse proxy** (nginx, Apache):
   ```nginx
   location /api {
       proxy_pass http://localhost:8000;
   }
   ```

## 📝 Next Steps

- [x] Basic API structure
- [x] Mock detector implementation
- [x] Image validation
- [x] CORS configuration
- [ ] Real AI model integration (Phase 3)
- [ ] Heatmap generation
- [ ] Batch processing
- [ ] Rate limiting
- [ ] Caching
- [ ] Advanced logging
- [ ] Unit tests
- [ ] Performance monitoring

## 🤝 Integration with Frontend

The backend is designed to work seamlessly with the React frontend:

1. **Start backend**: `python main.py` (port 8000)
2. **Start frontend**: `npm run dev` (port 3000)
3. **Update frontend**: Set `USE_MOCK = false` in frontend's `api.js`
4. **Test**: Upload images and see real backend responses

## 📚 Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Pydantic Documentation](https://docs.pydantic.dev/)
- [Uvicorn Documentation](https://www.uvicorn.org/)
- [PIL/Pillow Documentation](https://pillow.readthedocs.io/)

## 📞 Support

For issues or questions:
1. Check the API documentation at `/docs`
2. Review error messages in console
3. Verify configuration in `.env`
4. Check this README

---

**Status**: Phase 1 Complete - Backend Foundation Ready ✅  
**Next Phase**: AI Model Integration (Phase 2-3)  
**Compatible with**: Frontend v1.0.0
