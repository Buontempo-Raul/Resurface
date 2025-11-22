# Component Architecture & Data Flow

## 📊 Component Hierarchy

```
App.jsx (Main Container)
│
├── Header.jsx
│   └── InfoModal (internal)
│
├── UploadZone.jsx
│   └── <input type="file" /> (HTML5 File API)
│
├── NotificationBanner (internal)
│   └── Upload results display
│
├── StatsPanel.jsx
│   └── StatCard × 6 (internal)
│       ├── Total Images
│       ├── Pending
│       ├── Analyzing
│       ├── Completed
│       ├── Real
│       └── Fake
│
├── ActionBar (internal)
│   ├── "Analyze All" button
│   └── "Clear All" button
│
├── ImageCard.jsx × N
│   ├── Image Preview
│   ├── StatusBadge (internal)
│   ├── ResultDisplay (internal)
│   │   ├── Verdict card
│   │   ├── Generation method
│   │   └── Anomaly regions
│   └── Re-analyze button
│
└── EmptyState (internal)
```

## 🔄 Data Flow

### 1. Image Upload Flow

```
User Action
    ↓
UploadZone (drag/drop or click)
    ↓
handleFilesAdded()
    ↓
useImageAnalysis.addImages()
    ↓
    ├─→ validateFile() for each file
    ├─→ createFilePreview() for valid files
    └─→ Update images state
    ↓
NotificationBanner shows results
    ↓
Images displayed in grid
```

### 2. Analysis Flow

```
User clicks "Analyze All"
    ↓
analyzeAllImages() in useImageAnalysis
    ↓
For each pending image:
    ├─→ Update status to "analyzing"
    ├─→ api.analyzeImage(file)
    │       ├─→ (Mock Mode) generateMockResult()
    │       └─→ (Real Mode) POST to /api/analyze
    ├─→ Update status to "completed"
    └─→ Store result in image.result
    ↓
ImageCard displays results
    ↓
StatsPanel updates statistics
```

### 3. State Management Flow

```
useImageAnalysis Hook (Custom Hook)
    │
    ├── images: ImageFile[]
    ├── isAnalyzing: boolean
    ├── progress: { current, total }
    │
    ├── Actions:
    │   ├── addImages(files)
    │   ├── removeImage(id)
    │   ├── clearAllImages()
    │   ├── analyzeAllImages()
    │   ├── reanalyzeImage(id)
    │   └── getStats()
    │
    └── Updates trigger React re-renders
            ↓
        Components re-render with new data
```

## 📡 API Communication

### Request Flow

```
Component
    ↓
api.analyzeImage(file)
    ↓
if (USE_MOCK)
    ↓
    generateMockResult()
    - Simulate 1-3s delay
    - Random fake/real verdict
    - Random confidence 70-100%
    - Return mock response
else
    ↓
    axios.post('/api/analyze', formData)
    - Upload image via multipart/form-data
    - Track upload progress
    - Receive analysis result
    ↓
Return to component
    ↓
Update state
    ↓
Re-render UI
```

### Response Structure

```javascript
{
  success: boolean,
  data: {
    isFake: boolean,               // True if deepfake detected
    confidence: number,            // 0-100 percentage
    generationMethod: string|null, // "GAN", "Diffusion", "Face Swap", or null
    heatmapUrl: string|null,      // URL to heatmap image
    details: {
      processingTime: number,      // Milliseconds
      modelVersion: string,        // e.g., "v1.0"
      anomalies: [                // Detected anomaly regions
        {
          region: string,          // e.g., "Eyes", "Mouth"
          score: number           // 0-100 anomaly score
        }
      ]
    }
  },
  error: string|null              // Error message if failed
}
```

## 🎯 Key Design Patterns

### 1. Container/Presentational Pattern

**Container Components** (Logic):
- `App.jsx` - Orchestrates all functionality
- Manages state via custom hooks
- Handles user interactions
- Passes data to presentational components

**Presentational Components** (UI):
- `Header`, `UploadZone`, `ImageCard`, `StatsPanel`
- Receive props from container
- Focus on rendering and styling
- No business logic

### 2. Custom Hook Pattern

**useImageAnalysis** encapsulates:
- State management (images, isAnalyzing, progress)
- Business logic (add, remove, analyze)
- Derived data (getStats)

Benefits:
- Reusable across components
- Testable in isolation
- Separates concerns
- Clean component code

### 3. Service Layer Pattern

**api.js** provides:
- Centralized API communication
- Mock/Real mode switching
- Error handling
- Response transformation

Benefits:
- Single source of truth for API calls
- Easy to mock for testing
- Consistent error handling
- Backend agnostic components

## 🔧 State Updates

### Adding Images

```javascript
State Before:
images = []

User uploads 2 files
    ↓
addImages([file1, file2])
    ↓
Validate each file
Create previews
Generate IDs
    ↓
State After:
images = [
  {
    id: "1234-abc",
    file: File,
    preview: "data:image/jpeg;base64,...",
    status: "pending",
    result: null
  },
  {
    id: "5678-def",
    file: File,
    preview: "data:image/jpeg;base64,...",
    status: "pending",
    result: null
  }
]
```

### Analyzing Images

```javascript
State During Analysis:
images = [
  {
    id: "1234-abc",
    status: "analyzing",  // Changed from "pending"
    result: null
  },
  {
    id: "5678-def",
    status: "pending",
    result: null
  }
]

After Analysis Completes:
images = [
  {
    id: "1234-abc",
    status: "completed",  // Changed from "analyzing"
    result: {
      isFake: true,
      confidence: 87.5,
      generationMethod: "GAN",
      details: {...}
    }
  },
  {
    id: "5678-def",
    status: "analyzing",  // Now processing
    result: null
  }
]
```

## 🎨 Styling Architecture

### Utility-First with Tailwind

```javascript
// Component styles are composed from Tailwind utilities
<div className="flex items-center gap-2 p-4 bg-white rounded-lg shadow-md">

// Responsive design with breakpoints
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">

// Conditional styles
<div className={`p-4 ${isFake ? 'bg-red-50' : 'bg-green-50'}`}>

// State-based styles
<button className="hover:bg-blue-700 disabled:opacity-50">
```

### Color Coding System

**Status Colors:**
- Gray: Pending/Neutral
- Blue: Processing/Analyzing
- Green: Completed/Real
- Red: Error/Fake
- Yellow: Warning/Medium confidence

**Confidence-Based Colors:**
```javascript
// High confidence + Real → Green
// High confidence + Fake → Red
// Medium confidence → Yellow/Orange
// Low confidence → Gray

getVerdictColor(isFake, confidence)
getVerdictBgColor(isFake, confidence)
```

## 🔍 Event Flow Examples

### Example 1: User Uploads 3 Images

```
1. User drags 3 files over UploadZone
   └→ isDragging = true (visual feedback)

2. User drops files
   └→ handleDrop() called
   └→ onFilesAdded(files) called
   └→ App.handleFilesAdded() called

3. App validates files
   └→ addImages() in useImageAnalysis
   └→ For each file:
       ├→ validateFile() → {valid: true}
       ├→ createFilePreview() → data URL
       └→ Add to images array

4. State update triggers re-render
   └→ 3 new ImageCard components appear
   └→ StatsPanel shows: Total: 3, Pending: 3

5. NotificationBanner shows "3 images added"
```

### Example 2: User Analyzes All Images

```
1. User clicks "Analyze All" button
   └→ analyzeAllImages() called
   └→ isAnalyzing = true (disables controls)

2. For each pending image (sequential):
   
   Image 1:
   ├→ Status changes to "analyzing"
   ├→ api.analyzeImage() called
   ├→ Mock delay 1-3 seconds
   ├→ Response received
   ├→ Status changes to "completed"
   └→ result stored
   
   Image 2:
   ├→ Status changes to "analyzing"
   └→ ... (repeat process)
   
   Image 3:
   ├→ Status changes to "analyzing"
   └→ ... (repeat process)

3. All images analyzed
   └→ isAnalyzing = false
   └→ Controls re-enabled
   └→ StatsPanel shows final counts
```

### Example 3: User Re-analyzes Single Image

```
1. User clicks "Re-analyze" on ImageCard
   └→ reanalyzeImage(imageId) called

2. Find image by ID
   └→ Reset status to "analyzing"
   └→ Clear previous result

3. Call API
   └→ api.analyzeImage()
   └→ New analysis performed

4. Update image
   └→ Status to "completed"
   └→ New result stored
   └→ ImageCard re-renders with new data
```

## 📊 Component Props Flow

```
App
 │
 ├─→ UploadZone
 │   └── Props: { onFilesAdded, disabled }
 │
 ├─→ StatsPanel
 │   └── Props: { stats: { total, pending, analyzing, ... } }
 │
 └─→ ImageCard (for each image)
     └── Props: {
           image: {
             id, file, preview, status, result
           },
           onRemove: (id) => void,
           onReanalyze: (id) => void
         }
```

## 🔐 Validation Flow

```
File Selected
    ↓
validateFile(file)
    ↓
Check Format
    ├─→ isValidImageFormat()
    │   └── Check MIME type against allowed list
    │       └── ['image/jpeg', 'image/jpg', 'image/png']
    │
    └─→ isValidFileSize()
        └── Check size <= 10MB
        
If Valid:
    └→ Add to images array
    └→ Create preview
    └→ Display in UI

If Invalid:
    └→ Add to rejected array
    └→ Show in NotificationBanner
    └→ Don't add to images
```

## 🚀 Performance Considerations

### 1. Sequential Processing
- Images analyzed one at a time
- Prevents backend overload
- Clear progress tracking
- Better error isolation

### 2. Lazy Rendering
- Only visible images rendered
- Virtual scrolling possible for many images
- React's efficient diff algorithm

### 3. State Optimization
- Minimal re-renders
- Targeted state updates
- No unnecessary component updates

### 4. File Handling
- Client-side validation
- Preview generation
- No upload until analysis
- Efficient memory usage

---

This architecture provides:
✅ Clear separation of concerns
✅ Maintainable codebase
✅ Scalable state management
✅ Testable components
✅ Responsive user experience
✅ Production-ready foundation
