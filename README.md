# Resurface

AI-powered deepfake image detection system built for detecting AI-generated and manipulated images.

## Overview

Resurface is a full-stack application that uses machine learning to analyze images and detect whether they are authentic or AI-generated deepfakes. The system identifies the generation method (GAN, Diffusion models, Face Swap) and provides confidence scores with detailed anomaly analysis.

## Architecture

The project consists of two main components:

- **Frontend** (`deepfake-detector-frontend/`) - React web application with drag-and-drop upload interface
- **Backend** (`deepfake-detector-backend/`) - FastAPI REST API for image analysis

## Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+
- npm or yarn

### Running the Application

**1. Start the Backend:**

```bash
cd deepfake-detector-backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

Backend will run on `http://localhost:8000`

**2. Start the Frontend:**

```bash
cd deepfake-detector-frontend
npm install
npm run dev
```

Frontend will run on `http://localhost:3000`

**3. Open your browser and upload images to analyze!**

## Features

- Drag-and-drop image upload interface
- Real-time deepfake detection with confidence scores
- Generation method identification (GAN, Diffusion, Face Swap)
- Regional anomaly detection with visual breakdowns
- Batch processing support
- RESTful API with auto-generated documentation
- Mock mode for development and testing

## Documentation

- [Backend Documentation](deepfake-detector-backend/README.md) - API details, deployment, model integration
- [Frontend Documentation](deepfake-detector-frontend/README.md) - Component structure, customization, configuration

## Technology Stack

**Frontend:**
- React 18 with Hooks
- Vite for fast builds
- Tailwind CSS for styling
- Axios for API communication
- Lucide React for icons

**Backend:**
- FastAPI for REST API
- Pydantic for validation
- Pillow for image processing
- Uvicorn ASGI server

## Development Status

Currently in **Phase 1** - Foundation Complete
- Fully functional mock backend for testing
- Complete frontend interface
- Ready for AI model integration

## API Documentation

Once the backend is running, interactive API documentation is available at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Configuration

Both frontend and backend include `.env.example` files. Copy these to `.env` and customize as needed:

```bash
# Backend
cd deepfake-detector-backend
cp .env.example .env

# Frontend
cd deepfake-detector-frontend
cp .env.example .env
```

## License

This project is part of a bachelor's thesis on deepfake detection technology.
