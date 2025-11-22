import { useState } from 'react';
import { Play, Trash2, AlertCircle } from 'lucide-react';
import { Header } from './components/Header';
import { UploadZone } from './components/UploadZone';
import { ImageCard } from './components/ImageCard';
import { StatsPanel } from './components/StatsPanel';
import { useImageAnalysis } from './hooks/useImageAnalysis';

/**
 * NotificationBanner - Shows upload results and errors
 */
const NotificationBanner = ({ results, onDismiss }) => {
  if (!results) return null;

  const { added, rejected } = results;
  const hasRejections = rejected.length > 0;

  return (
    <div className={`mb-4 p-4 rounded-lg border ${hasRejections ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'
      }`}>
      <div className="flex items-start gap-3">
        <AlertCircle className={`w-5 h-5 mt-0.5 ${hasRejections ? 'text-yellow-600' : 'text-green-600'
          }`} />
        <div className="flex-1">
          {added > 0 && (
            <p className="text-sm font-medium text-gray-900">
              {added} image{added !== 1 ? 's' : ''} added successfully
            </p>
          )}
          {hasRejections && (
            <div className="mt-2">
              <p className="text-sm font-medium text-gray-900 mb-1">
                {rejected.length} file{rejected.length !== 1 ? 's' : ''} rejected:
              </p>
              <ul className="text-sm text-gray-700 space-y-1">
                {rejected.map((item, idx) => (
                  <li key={idx} className="ml-4">
                    <strong>{item.file}:</strong> {item.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <button
          onClick={onDismiss}
          className="text-gray-400 hover:text-gray-600"
          aria-label="Dismiss"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

/**
 * ActionBar - Control buttons for batch operations
 */
const ActionBar = ({
  hasPendingImages,
  isAnalyzing,
  hasImages,
  onAnalyze,
  onClearAll
}) => {
  if (!hasImages) return null;

  return (
    <div className="flex items-center justify-between gap-4 p-4 bg-white rounded-lg shadow-md border border-gray-200">
      <div className="flex items-center gap-3">
        <button
          onClick={onAnalyze}
          disabled={!hasPendingImages || isAnalyzing}
          className={`
            flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all
            ${hasPendingImages && !isAnalyzing
              ? 'bg-primary-600 hover:bg-primary-700 text-white shadow-md hover:shadow-lg'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }
          `}
        >
          <Play className="w-4 h-4" />
          {isAnalyzing ? 'Analyzing...' : 'Analyze All'}
        </button>

        {isAnalyzing && (
          <span className="text-sm text-gray-600 animate-pulse">
            Processing images...
          </span>
        )}
      </div>

      <button
        onClick={onClearAll}
        disabled={isAnalyzing}
        className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Trash2 className="w-4 h-4" />
        Clear All
      </button>
    </div>
  );
};

/**
 * EmptyState - Shown when no images are uploaded
 */
const EmptyState = () => (
  <div className="text-center py-12">
    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
      <Play className="w-10 h-10 text-gray-400" />
    </div>
    <h3 className="text-lg font-medium text-gray-900 mb-2">
      No images uploaded yet
    </h3>
    <p className="text-gray-500">
      Upload images above to start analyzing them for deepfakes
    </p>
  </div>
);

/**
 * Main App Component
 */
function App() {
  const {
    images,
    isAnalyzing,
    addImages,
    removeImage,
    clearAllImages,
    analyzeAllImages,
    reanalyzeImage,
    getStats,
  } = useImageAnalysis();

  const [notification, setNotification] = useState(null);

  const handleFilesAdded = async (files) => {
    const results = await addImages(files);

    if (results.added > 0 || results.rejected.length > 0) {
      setNotification(results);
      // Auto-dismiss after 5 seconds if no rejections
      if (results.rejected.length === 0) {
        setTimeout(() => setNotification(null), 5000);
      }
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all images?')) {
      clearAllImages();
      setNotification(null);
    }
  };

  const stats = getStats();
  const hasPendingImages = stats.pending > 0;
  const hasImages = images.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Upload Zone */}
        <div className="mb-6">
          <UploadZone
            onFilesAdded={handleFilesAdded}
            disabled={isAnalyzing}
          />
        </div>

        {/* Notification Banner */}
        {notification && (
          <NotificationBanner
            results={notification}
            onDismiss={() => setNotification(null)}
          />
        )}

        {/* Statistics Panel */}
        {hasImages && (
          <div className="mb-6">
            <StatsPanel stats={stats} />
          </div>
        )}

        {/* Action Bar */}
        <ActionBar
          hasPendingImages={hasPendingImages}
          isAnalyzing={isAnalyzing}
          hasImages={hasImages}
          onAnalyze={analyzeAllImages}
          onClearAll={handleClearAll}
        />

        {/* Images Grid */}
        {hasImages ? (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {images.map((image) => (
              <ImageCard
                key={image.id}
                image={image}
                onRemove={removeImage}
                onReanalyze={reanalyzeImage}
              />
            ))}
          </div>
        ) : (
          <div className="mt-6">
            <EmptyState />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-12 py-6 border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            Resurface © 2025 • License Thesis Project • AI-Powered Image Analysis
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
