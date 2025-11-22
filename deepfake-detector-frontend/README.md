# Resurface - Frontend

AI-powered web application for detecting deepfake images using advanced machine learning techniques.

## 🚀 Features

- **Drag & Drop Upload**: Easy image upload with drag-and-drop support
- **Batch Processing**: Analyze multiple images sequentially
- **Real-time Results**: Instant feedback with confidence scores
- **Visual Analysis**: Detailed anomaly detection with region-specific scoring
- **Generation Method Detection**: Identifies AI generation technique (GAN, Diffusion, Face Swap)
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## 📋 Prerequisites

- Node.js 18+ and npm/yarn
- Modern web browser with JavaScript enabled

## 🛠️ Installation

1. **Clone or navigate to the project directory**:
   ```bash
   cd deepfake-detector-frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment** (optional):
   Create a `.env` file in the root directory:
   ```env
   VITE_API_URL=http://localhost:8000/api
   ```

## 🏃 Running the Application

### Development Mode

Start the development server with hot reload:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Production Build

Build the application for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## 📁 Project Structure

```
deepfake-detector-frontend/
├── src/
│   ├── components/          # React components
│   │   ├── Header.jsx       # Application header
│   │   ├── UploadZone.jsx   # Drag & drop upload
│   │   ├── ImageCard.jsx    # Image display with results
│   │   └── StatsPanel.jsx   # Statistics dashboard
│   ├── hooks/               # Custom React hooks
│   │   └── useImageAnalysis.js  # Image analysis state management
│   ├── services/            # API and external services
│   │   └── api.js           # Backend API communication
│   ├── utils/               # Utility functions
│   │   └── fileUtils.js     # File validation and formatting
│   ├── types/               # Type definitions (JSDoc)
│   │   └── index.js         # Type definitions
│   ├── App.jsx              # Main application component
│   ├── main.jsx             # Application entry point
│   └── index.css            # Global styles with Tailwind
├── index.html               # HTML entry point
├── vite.config.js           # Vite configuration
├── tailwind.config.js       # Tailwind CSS configuration
└── package.json             # Project dependencies
```

## 🔧 Configuration

### Mock Mode

The application includes a mock mode for development without a backend:

- Located in `src/services/api.js`
- Set `USE_MOCK = true` to enable mock responses
- Set `USE_MOCK = false` when backend is ready

### Backend Integration

The frontend expects a FastAPI backend with the following endpoint:

**POST** `/api/analyze`
- **Content-Type**: `multipart/form-data`
- **Body**: `image` (file)
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "isFake": false,
      "confidence": 87.5,
      "generationMethod": null,
      "heatmapUrl": null,
      "details": {
        "processingTime": 1200,
        "modelVersion": "v1.0",
        "anomalies": [
          { "region": "Eyes", "score": 45.2 },
          { "region": "Mouth", "score": 32.8 }
        ]
      }
    },
    "error": null
  }
  ```

## 🎨 Customization

### Styling

The application uses Tailwind CSS for styling. Customize colors in `tailwind.config.js`:

```javascript
theme: {
  extend: {
    colors: {
      primary: {
        // Customize primary color palette
      }
    }
  }
}
```

### Validation Rules

Adjust file validation in `src/utils/fileUtils.js`:

```javascript
export const ALLOWED_FORMATS = ['image/jpeg', 'image/jpg', 'image/png'];
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
```

## 🧪 Testing

To add testing (optional):

```bash
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom
```

## 📦 Building for Production

1. Build the application:
   ```bash
   npm run build
   ```

2. The production-ready files will be in the `dist/` directory

3. Deploy the `dist/` directory to your hosting service (Netlify, Vercel, etc.)

## 🔒 Security Features

- Client-side file validation (format and size)
- MIME type verification
- XSS protection through React
- CORS configuration in Vite proxy

## 📱 Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## 🐛 Troubleshooting

### Port Already in Use

Change the port in `vite.config.js`:

```javascript
server: {
  port: 3001, // Change to available port
}
```

### Backend Connection Issues

1. Verify the backend is running on `http://localhost:8000`
2. Check CORS settings on the backend
3. Update `VITE_API_URL` in `.env` if using a different URL

### Images Not Uploading

1. Check file format (must be JPG, JPEG, or PNG)
2. Verify file size is under 10MB
3. Check browser console for errors

## 📝 License

This project is part of a bachelor's thesis on deepfake detection.

## 👨‍💻 Development Notes

- Uses React 18+ with hooks for state management
- Vite for fast development and optimized builds
- Tailwind CSS for utility-first styling
- Lucide React for consistent iconography
- Axios for HTTP requests

## 🚀 Next Steps

1. Integrate with actual AI model backend
2. Add heatmap visualization
3. Implement result export functionality
4. Add user authentication (optional)
5. Enhance with real-time WebSocket updates

---

For backend implementation, refer to `Implementation_Plan.md` in the project root.
