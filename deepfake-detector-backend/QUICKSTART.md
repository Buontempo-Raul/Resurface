# Backend Quick Start Guide

Get your backend running in 5 minutes!

## ⚡ Super Quick Start

```bash
cd deepfake-detector-backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

Visit: http://localhost:8000/docs

## 📝 Step-by-Step Instructions

### Step 1: Setup Virtual Environment (2 minutes)

```bash
# Navigate to backend directory
cd deepfake-detector-backend

# Create virtual environment
python -m venv venv

# Activate it
# Windows:
venv\Scripts\activate

# macOS/Linux:
source venv/bin/activate

# You should see (venv) in your terminal prompt
```

### Step 2: Install Dependencies (1 minute)

```bash
pip install -r requirements.txt
```

Expected output:
```
Successfully installed fastapi-0.104.1 uvicorn-0.24.0 ...
```

### Step 3: Run the Server (30 seconds)

```bash
python main.py
```

You should see:
```
============================================================
🚀 Deepfake Detection API v1.0.0
============================================================
📝 Mode: MOCK
🌐 CORS: http://localhost:3000, ...
📊 Max file size: 10.0MB
📁 Allowed formats: .jpg, .jpeg, .png
🔍 Model version: MockModel v1.0
============================================================
📖 API Documentation: http://localhost:8000/docs
============================================================
```

### Step 4: Test the API (1 minute)

Open your browser to:
- **Interactive Docs**: http://localhost:8000/docs
- **Alternative Docs**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/api/health

## 🧪 Quick Test

### Using the Browser (Easiest)

1. Go to http://localhost:8000/docs
2. Click on "POST /api/analyze"
3. Click "Try it out"
4. Click "Choose File" and select an image
5. Click "Execute"
6. See the mock results!

### Using cURL (Command Line)

```bash
curl -X POST "http://localhost:8000/api/analyze" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "image=@path/to/your/image.jpg"
```

### Using Python

```python
import requests

with open('test_image.jpg', 'rb') as f:
    response = requests.post(
        'http://localhost:8000/api/analyze',
        files={'image': f}
    )
    print(response.json())
```

## 🔗 Connect with Frontend

### Option 1: Frontend Already Running

If your React frontend is running on port 3000:
1. Backend is already configured for CORS
2. In frontend's `src/services/api.js`, set: `let USE_MOCK = false`
3. Upload images in frontend - they'll use the real backend!

### Option 2: Start Both

Terminal 1 (Backend):
```bash
cd deepfake-detector-backend
python main.py
```

Terminal 2 (Frontend):
```bash
cd deepfake-detector-frontend
npm run dev
```

Now you have the full stack running! 🎉

## 📊 What You Get (Mock Mode)

The backend currently generates **realistic fake results**:
- ✅ Random verdicts (Real/Fake)
- ✅ Confidence scores (70-100%)
- ✅ Generation methods (GAN, Diffusion, Face Swap)
- ✅ Anomaly regions with scores
- ✅ Processing time simulation (0.5-2.5s)

This is perfect for:
- ✅ Testing the complete workflow
- ✅ Frontend development
- ✅ API contract validation
- ✅ Demonstrating to advisors

## 🎯 Next Steps

### Current Status
✅ Backend foundation complete  
✅ API fully functional with mock data  
✅ Ready for frontend integration  

### When AI Model is Ready
1. Create `app/services/real_detector.py`
2. Set `USE_MOCK_DETECTOR=False` in `.env`
3. Add model file to `models/` directory
4. Restart server

## 🐛 Troubleshooting

### "Port already in use"
```bash
# Change port in .env
PORT=8001

# Or kill the process
# Windows: netstat -ano | findstr :8000
# Linux/Mac: lsof -ti:8000 | xargs kill
```

### "Module not found"
```bash
# Make sure venv is activated
source venv/bin/activate  # or venv\Scripts\activate

# Reinstall dependencies
pip install -r requirements.txt
```

### "No module named 'app'"
```bash
# Run from the backend directory (where main.py is)
cd deepfake-detector-backend
python main.py
```

### CORS errors in frontend
```bash
# Make sure backend is running first
# Check app/core/config.py for CORS_ORIGINS
# Add your frontend URL if different
```

## 📁 Project Structure

```
deepfake-detector-backend/
├── app/
│   ├── api/endpoints.py          # ← API routes
│   ├── core/
│   │   ├── config.py            # ← Settings
│   │   └── image_utils.py       # ← Validation
│   ├── models/schemas.py        # ← Data models
│   └── services/
│       ├── detector.py          # ← Base class
│       └── mock_detector.py     # ← Mock implementation
├── main.py                      # ← Start here!
├── requirements.txt             # ← Dependencies
└── .env.example                 # ← Configuration template
```

## 🔧 Configuration

Create `.env` file (optional):
```bash
cp .env.example .env
```

Key settings:
```env
PORT=8000
DEBUG=True
USE_MOCK_DETECTOR=True
MAX_FILE_SIZE=10485760  # 10MB
```

## ✅ Checklist

- [ ] Virtual environment created and activated
- [ ] Dependencies installed
- [ ] Server runs without errors
- [ ] Can access http://localhost:8000/docs
- [ ] Health check returns success
- [ ] Can upload and analyze an image
- [ ] Results show mock data

## 🎓 For Your Thesis

You can now demonstrate:
- ✅ Complete RESTful API
- ✅ Proper architecture (modular, extensible)
- ✅ Full request/response workflow
- ✅ Image validation and processing
- ✅ Professional API documentation

**Even without the AI model**, this shows:
- Strong software engineering skills
- Production-ready code structure
- API design best practices
- Security considerations

## 📚 Learn More

- **API Docs**: http://localhost:8000/docs (when running)
- **README**: Full documentation in README.md
- **Code**: Well-commented, easy to follow

## 🚀 Ready for AI Integration

The backend is designed for easy model integration:

```python
# Just implement detect() method
class YourDetector(BaseDetector):
    def detect(self, image):
        # Your model inference here
        return {
            'is_fake': prediction,
            'confidence': score,
            # ... etc
        }
```

Then switch: `USE_MOCK_DETECTOR=False`

---

**Time to Complete**: ~5 minutes  
**Status**: ✅ Phase 1 Backend Complete  
**Compatible with**: Frontend v1.0.0  
**Next**: AI Model Training (Phase 2-3)

Happy coding! 🎉
