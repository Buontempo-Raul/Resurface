# Resurface Frontend - Setup & Architecture Guide

## 📖 Overview

This document provides a comprehensive guide to the Resurface frontend application, including architecture decisions, setup instructions, and development guidelines.

## 🏗️ Architecture

### Technology Stack

| Component | Technology | Justification |
|-----------|-----------|---------------|
| **Framework** | React 18+ | Modern, component-based, excellent ecosystem |
| **Build Tool** | Vite | Fast HMR, optimized builds, modern defaults |
| **Styling** | Tailwind CSS | Utility-first, rapid development, consistent design |
| **HTTP Client** | Axios | Promise-based, interceptors, better error handling |
| **Icons** | Lucide React | Consistent, tree-shakeable, comprehensive set |
| **State Management** | React Hooks | Built-in, no external dependencies, sufficient for app needs |

### Design Patterns

#### 1. **Component Structure**
```
├── Presentational Components (UI)
│   ├── Header.jsx           # Branding and navigation
│   ├── UploadZone.jsx       # File upload interface
│   ├── ImageCard.jsx        # Individual image display
│   └── StatsPanel.jsx       # Statistics dashboard
│
└── Container Components (Logic)
    └── App.jsx              # Main orchestrator
```

#### 2. **Custom Hooks Pattern**
- `useImageAnalysis` - Encapsulates all image management logic
- Separates business logic from UI components
- Makes state management reusable and testable

#### 3. **Service Layer**
- `api.js` - Centralized API communication
- Mock mode for independent frontend development
- Easy to swap between mock and real backend

#### 4. **Utility Layer**
- Pure functions for validation and formatting
- Reusable across components
- Easy to test

## 📂 Detailed File Structure

```
deepfake-detector-frontend/
│
├── public/                      # Static assets (add favicon here)
│
├── src/
│   ├── components/              # React components
│   │   ├── Header.jsx          # App header with info modal
│   │   ├── UploadZone.jsx      # Drag-drop upload area
│   │   ├── ImageCard.jsx       # Image + results display
│   │   └── StatsPanel.jsx      # Analysis statistics
│   │
│   ├── hooks/                   # Custom React hooks
│   │   └── useImageAnalysis.js # Image state management
│   │
│   ├── services/                # External services
│   │   └── api.js              # Backend API communication
│   │
│   ├── utils/                   # Utility functions
│   │   └── fileUtils.js        # Validation, formatting
│   │
│   ├── types/                   # Type definitions (JSDoc)
│   │   └── index.js            # Data structure types
│   │
│   ├── App.jsx                  # Main application
│   ├── main.jsx                 # React entry point
│   └── index.css                # Global styles + Tailwind
│
├── index.html                   # HTML entry point
├── vite.config.js              # Vite configuration
├── tailwind.config.js          # Tailwind configuration
├── postcss.config.js           # PostCSS for Tailwind
├── package.json                # Dependencies
├── .eslintrc.cjs              # ESLint configuration
├── .gitignore                  # Git ignore rules
├── .env.example                # Environment variables template
└── README.md                   # Documentation
```

## 🚀 Quick Start

### 1. Prerequisites

Ensure you have installed:
- **Node.js** 18+ ([Download here](https://nodejs.org/))
- **npm** (comes with Node.js)

Verify installation:
```bash
node --version  # Should be 18+
npm --version   # Should be 9+
```

### 2. Installation

Navigate to the project directory and install dependencies:

```bash
cd deepfake-detector-frontend
npm install
```

This will install:
- React 18.2.0
- Vite 5.0.8
- Tailwind CSS 3.3.6
- Axios 1.6.2
- Lucide React 0.294.0

### 3. Development

Start the development server:

```bash
npm run dev
```

Expected output:
```
VITE v5.0.8  ready in 500 ms

➜  Local:   http://localhost:3000/
➜  Network: use --host to expose
```

Open your browser to `http://localhost:3000`

### 4. Building for Production

Create an optimized production build:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
# Backend API URL
VITE_API_URL=http://localhost:8000/api

# Optional: Enable mock mode
# VITE_USE_MOCK=true
```

**Note**: Vite exposes only variables prefixed with `VITE_` to the client.

### Mock Mode

The application includes built-in mock responses for development without a backend.

**Location**: `src/services/api.js`

```javascript
const USE_MOCK = true;  // Set to false when backend is ready
```

Mock mode provides:
- Simulated processing delays (1-3 seconds)
- Random fake/real verdicts
- Random confidence scores (70-100%)
- Sample anomaly regions
- No network calls required

### Backend Integration

When ready to connect to the real backend, set `USE_MOCK = false` in `api.js`.

**Expected Backend Endpoint**:

```
POST http://localhost:8000/api/analyze
Content-Type: multipart/form-data

Body:
  - image: File

Response:
{
  "success": true,
  "data": {
    "isFake": boolean,
    "confidence": number (0-100),
    "generationMethod": string | null,
    "heatmapUrl": string | null,
    "details": {
      "processingTime": number (ms),
      "modelVersion": string,
      "anomalies": [
        { "region": string, "score": number }
      ]
    }
  },
  "error": string | null
}
```

## 💡 Key Features Implementation

### 1. Drag & Drop Upload

**Component**: `UploadZone.jsx`

Features:
- Visual feedback on drag enter/leave
- Multiple file selection
- File input fallback for click upload
- Validation before adding to queue

Implementation highlights:
```javascript
// Drag events handling
handleDragEnter, handleDragLeave, handleDragOver, handleDrop

// File validation
validateFile(file) // format + size check
```

### 2. Batch Processing

**Hook**: `useImageAnalysis.js`

Features:
- Sequential image processing
- Progress tracking
- Status management per image
- Error handling for individual failures

States:
- `pending` - Waiting to be analyzed
- `analyzing` - Currently processing
- `completed` - Analysis finished successfully
- `error` - Analysis failed

### 3. Results Visualization

**Component**: `ImageCard.jsx`

Features:
- Image preview
- Status badge
- Verdict display with color coding
- Confidence score visualization
- Anomaly regions with progress bars
- Re-analyze functionality

Color coding:
- **Green**: Real with high confidence (>80%)
- **Yellow**: Real/Fake with medium confidence (60-80%)
- **Orange**: Fake with medium confidence (60-80%)
- **Red**: Fake with high confidence (>80%)

### 4. Statistics Dashboard

**Component**: `StatsPanel.jsx`

Displays:
- Total images
- Processing status breakdown
- Real vs Fake detection counts
- Overall progress bar
- Completion percentage

## 🎨 Styling Guidelines

### Tailwind CSS Usage

The application uses Tailwind's utility-first approach:

```jsx
// Good: Utility classes
<div className="flex items-center gap-2 p-4 bg-white rounded-lg">

// Avoid: Inline styles
<div style={{ display: 'flex', padding: '16px' }}>
```

### Custom Color Palette

Defined in `tailwind.config.js`:

```javascript
colors: {
  primary: {
    50: '#f0f9ff',   // Lightest
    500: '#0ea5e9',  // Base
    700: '#0369a1',  // Dark
  }
}
```

Usage: `bg-primary-500`, `text-primary-700`, etc.

### Responsive Design

Mobile-first breakpoints:
- `sm:` - 640px and up (tablet)
- `md:` - 768px and up (small desktop)
- `lg:` - 1024px and up (desktop)
- `xl:` - 1280px and up (large desktop)

Example:
```jsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
```

## 🧪 Testing Strategy

### Manual Testing Checklist

- [ ] Upload single image (JPG, PNG)
- [ ] Upload multiple images via drag-drop
- [ ] Test file validation (wrong format, oversized)
- [ ] Analyze all pending images
- [ ] Re-analyze individual image
- [ ] Remove individual image
- [ ] Clear all images
- [ ] Check responsive design on mobile
- [ ] Verify statistics accuracy
- [ ] Test with mock backend
- [ ] Test with real backend

### Future Testing Setup

To add automated testing:

```bash
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom
```

Add test scripts to `package.json`:
```json
"scripts": {
  "test": "vitest",
  "test:ui": "vitest --ui"
}
```

## 🔒 Security Considerations

### Client-Side Validation

**Location**: `src/utils/fileUtils.js`

1. **Format Validation**
   - Only allows: JPG, JPEG, PNG
   - MIME type checking

2. **Size Validation**
   - Maximum: 10MB per file
   - Prevents large file uploads

3. **Preview Generation**
   - Uses FileReader API
   - Generates data URLs securely

### XSS Protection

- React automatically escapes content
- No `dangerouslySetInnerHTML` usage
- User input properly sanitized

### CORS Configuration

Vite proxy configuration in `vite.config.js`:
```javascript
proxy: {
  '/api': {
    target: 'http://localhost:8000',
    changeOrigin: true,
  }
}
```

## 📊 Performance Optimization

### Code Splitting

Vite automatically:
- Splits code by route
- Lazy loads components
- Tree-shakes unused code

### Image Optimization

- Preview generation on client
- No server upload until analysis
- Efficient data URL usage

### State Management

- Local state with hooks
- No prop drilling
- Minimal re-renders

## 🐛 Common Issues & Solutions

### Issue: Port 3000 Already in Use

**Solution**: Change port in `vite.config.js`:
```javascript
server: { port: 3001 }
```

### Issue: Images Not Displaying

**Causes**:
1. Invalid file format
2. File too large (>10MB)
3. FileReader API error

**Solution**: Check browser console for validation errors

### Issue: Backend Connection Failed

**Causes**:
1. Backend not running
2. CORS not configured
3. Wrong API URL

**Solution**: 
- Verify backend is running on port 8000
- Check CORS settings on backend
- Update `VITE_API_URL` in `.env`

### Issue: npm install Fails

**Causes**:
1. Node.js version too old
2. npm cache corruption
3. Network issues

**Solution**:
```bash
# Clear npm cache
npm cache clean --force

# Update npm
npm install -g npm@latest

# Retry installation
npm install
```

## 🚀 Deployment

### Option 1: Netlify (Recommended)

1. Build the project:
   ```bash
   npm run build
   ```

2. Deploy the `dist/` folder to Netlify

3. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`

### Option 2: Vercel

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Deploy:
   ```bash
   vercel
   ```

### Option 3: Traditional Hosting

1. Build the project:
   ```bash
   npm run build
   ```

2. Upload `dist/` contents to your web server

3. Configure server to serve `index.html` for all routes

## 📈 Future Enhancements

### Planned Features
- [ ] Heatmap visualization overlay
- [ ] Export analysis results (JSON, CSV)
- [ ] Comparison mode (side-by-side)
- [ ] User authentication
- [ ] Analysis history
- [ ] Real-time WebSocket updates
- [ ] Chrome extension integration
- [ ] Desktop app with Electron

### Integration with Backend
- [ ] Replace mock mode with real API
- [ ] Add heatmap fetching
- [ ] Implement error retry logic
- [ ] Add request cancellation
- [ ] Optimize image upload

### UI/UX Improvements
- [ ] Dark mode toggle
- [ ] Accessibility improvements
- [ ] Animation polish
- [ ] Loading state improvements
- [ ] Toast notifications

## 📚 Additional Resources

- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [Axios Documentation](https://axios-http.com/)

## 👥 Contributing

When making changes:

1. Keep components small and focused
2. Follow existing naming conventions
3. Add JSDoc comments for complex functions
4. Test on multiple browsers
5. Ensure responsive design works
6. Update README if adding new features

## 📝 License

This project is part of a bachelor's thesis on deepfake detection using AI.

---

**Last Updated**: October 27, 2025
**Version**: 1.0.0
**Status**: ✅ Phase 1 Complete (Frontend Foundation)
