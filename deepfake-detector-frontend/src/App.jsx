import { useState, useEffect, useRef, useMemo } from 'react';
import { Play, Trash2, AlertCircle, Download } from 'lucide-react';
import { Header } from './components/Header';
import { UploadZone } from './components/UploadZone';
import { ImageCard } from './components/ImageCard';
import { StatsPanel } from './components/StatsPanel';
import { HistoryPanel } from './components/HistoryPanel';
import { useImageAnalysis } from './hooks/useImageAnalysis';
import { useHistory } from './hooks/useHistory';
import { generateThumbnail } from './utils/fileUtils';

const NotificationBanner = ({ results, onDismiss }) => {
  if (!results) return null;
  const { added, rejected } = results;
  const hasRejections = rejected.length > 0;

  return (
    <div className={`mb-4 p-4 rounded-lg border ${
      hasRejections
        ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
        : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
    }`}>
      <div className="flex items-start gap-3">
        <AlertCircle className={`w-5 h-5 mt-0.5 ${hasRejections ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'}`} />
        <div className="flex-1">
          {added > 0 && (
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {added} image{added !== 1 ? 's' : ''} added successfully
            </p>
          )}
          {hasRejections && (
            <div className="mt-2">
              <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                {rejected.length} file{rejected.length !== 1 ? 's' : ''} rejected:
              </p>
              <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                {rejected.map((item, idx) => (
                  <li key={idx} className="ml-4">
                    <strong>{item.file}:</strong> {item.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <button onClick={onDismiss} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

const ActionBar = ({ hasPendingImages, isAnalyzing, hasImages, hasCompleted, onAnalyze, onClearAll, onExport }) => {
  if (!hasImages) return null;

  return (
    <div className="glass flex flex-wrap items-center justify-between gap-3 p-4 rounded-lg">
      <div className="flex items-center gap-3">
        <button
          onClick={onAnalyze}
          disabled={!hasPendingImages || isAnalyzing}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all ${
            hasPendingImages && !isAnalyzing
              ? 'glass-btn-primary'
              : 'glass-chip text-gray-500 dark:text-gray-400 cursor-not-allowed'
          }`}
        >
          <Play className="w-4 h-4" />
          {isAnalyzing ? 'Analyzing…' : 'Analyze All'}
        </button>

        {isAnalyzing && (
          <span className="text-sm text-gray-600 dark:text-gray-400 animate-pulse">Processing images…</span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {hasCompleted && (
          <button
            onClick={onExport}
            className="glass-chip flex items-center gap-2 px-4 py-2 rounded-lg text-primary-600 dark:text-primary-400 transition-colors"
            title="Export results as CSV"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        )}
        <button
          onClick={onClearAll}
          disabled={isAnalyzing}
          className="glass-chip flex items-center gap-2 px-4 py-2 rounded-lg text-red-600 dark:text-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Trash2 className="w-4 h-4" />
          Clear All
        </button>
      </div>
    </div>
  );
};

const FilterBar = ({ filter, setFilter, sort, setSort, counts }) => (
  <div className="mt-4 flex flex-wrap items-center gap-3">
    <div className="flex flex-wrap gap-1.5">
      {[
        { key: 'all',     label: 'All' },
        { key: 'real',    label: 'Real' },
        { key: 'fake',    label: 'Fake' },
        { key: 'pending', label: 'Pending' },
      ].map(({ key, label }) => (
        <button
          key={key}
          onClick={() => setFilter(key)}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            filter === key
              ? 'glass-btn-primary'
              : 'glass-chip text-gray-600 dark:text-gray-300'
          }`}
        >
          {label}
          <span className={`ml-1.5 text-xs ${filter === key ? 'opacity-75' : 'text-gray-400 dark:text-gray-500'}`}>
            {counts[key]}
          </span>
        </button>
      ))}
    </div>
    <div className="ml-auto flex items-center gap-2">
      <span className="text-sm text-gray-500 dark:text-gray-400">Sort:</span>
      <select
        value={sort}
        onChange={(e) => setSort(e.target.value)}
        className="text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        <option value="added">Date added</option>
        <option value="confidence">Confidence</option>
        <option value="name">Name</option>
      </select>
    </div>
  </div>
);

const EmptyState = () => (
  <div className="text-center py-12">
    <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
      <Play className="w-10 h-10 text-gray-400 dark:text-gray-500" />
    </div>
    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No images uploaded yet</h3>
    <p className="text-gray-500 dark:text-gray-400">
      Upload images above to start analyzing them for deepfakes
    </p>
  </div>
);

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

  const { history, addEntry, clearHistory } = useHistory();
  const historizedIds = useRef(new Set());

  // Persist completed images to history
  useEffect(() => {
    images.forEach(async (img) => {
      if (
        (img.status === 'completed' || img.status === 'error') &&
        !historizedIds.current.has(img.id)
      ) {
        historizedIds.current.add(img.id);
        const thumbnail = await generateThumbnail(img.preview);
        addEntry({
          id: img.id,
          filename: img.file.name,
          fileSize: img.file.size,
          timestamp: Date.now(),
          thumbnail,
          status: img.status,
          result: img.result?.error ? null : img.result,
          error: img.result?.error || null,
        });
      }
    });
  }, [images]); // eslint-disable-line react-hooks/exhaustive-deps

  const [notification, setNotification] = useState(null);

  const handleFilesAdded = async (files) => {
    const results = await addImages(files);
    if (results.added > 0 || results.rejected.length > 0) {
      setNotification(results);
      if (results.rejected.length === 0) setTimeout(() => setNotification(null), 5000);
    }
  };

  // Clipboard paste
  const handleFilesAddedRef = useRef(null);
  handleFilesAddedRef.current = handleFilesAdded;
  useEffect(() => {
    const onPaste = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      const items = [...(e.clipboardData?.items || [])];
      const imageFiles = items
        .filter((item) => item.type.startsWith('image/'))
        .map((item) => item.getAsFile())
        .filter(Boolean);
      if (imageFiles.length > 0) handleFilesAddedRef.current(imageFiles);
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, []);

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all images?')) {
      clearAllImages();
      setNotification(null);
    }
  };

  // Filter + sort
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('added');

  const filterCounts = useMemo(() => ({
    all:     images.length,
    real:    images.filter((img) => img.status === 'completed' && img.result?.imageResult && !img.result.imageResult.isFake).length,
    fake:    images.filter((img) => img.status === 'completed' && img.result?.imageResult?.isFake).length,
    pending: images.filter((img) => img.status === 'pending').length,
  }), [images]);

  const filteredImages = useMemo(() => {
    let result = [...images];
    if (filter === 'real')    result = result.filter((img) => img.status === 'completed' && img.result?.imageResult && !img.result.imageResult.isFake);
    else if (filter === 'fake')    result = result.filter((img) => img.status === 'completed' && img.result?.imageResult?.isFake);
    else if (filter === 'pending') result = result.filter((img) => img.status === 'pending');

    if (sort === 'confidence') {
      const conf = (img) => img.result?.imageResult
        ? (img.result.imageResult.isFake ? img.result.imageResult.fakeProbability : 1 - img.result.imageResult.fakeProbability)
        : -1;
      result = [...result].sort((a, b) => conf(b) - conf(a));
    } else if (sort === 'name') {
      result = [...result].sort((a, b) => a.file.name.localeCompare(b.file.name));
    }
    return result;
  }, [images, filter, sort]);

  // CSV export
  const exportCSV = () => {
    const completed = images.filter((img) => img.status === 'completed' && img.result?.imageResult);
    if (!completed.length) return;
    const header = 'Filename,Size (KB),Verdict,Confidence (%),Family,Method,Unknown Method,Face Source,Processing Time (ms)';
    const rows = completed.map((img) => {
      const ir = img.result.imageResult;
      const confidence = Math.round((ir.isFake ? ir.fakeProbability : 1 - ir.fakeProbability) * 100);
      return [
        `"${img.file.name.replace(/"/g, '""')}"`,
        Math.round(img.file.size / 1024),
        ir.isFake ? 'FAKE' : 'REAL',
        confidence,
        ir.family || '',
        ir.method || '',
        ir.isUnknownMethod ? 'Yes' : 'No',
        ir.faceSource || '',
        Math.round(img.result.processingTimeMs),
      ].join(',');
    });
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resurface_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const stats = getStats();
  const hasPendingImages = stats.pending > 0;
  const hasImages = images.length > 0;
  const hasCompleted = images.some((img) => img.status === 'completed' && img.result?.imageResult);

  return (
    <div className="min-h-screen relative">
      <div className="app-background fixed inset-0 -z-10" aria-hidden="true" />
      <Header />

      <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <UploadZone onFilesAdded={handleFilesAdded} disabled={isAnalyzing} />
        </div>

        {notification && (
          <NotificationBanner results={notification} onDismiss={() => setNotification(null)} />
        )}

        {hasImages && (
          <div className="mb-6">
            <StatsPanel stats={stats} />
          </div>
        )}

        <ActionBar
          hasPendingImages={hasPendingImages}
          isAnalyzing={isAnalyzing}
          hasImages={hasImages}
          hasCompleted={hasCompleted}
          onAnalyze={analyzeAllImages}
          onClearAll={handleClearAll}
          onExport={exportCSV}
        />

        {hasImages && (
          <FilterBar
            filter={filter}
            setFilter={setFilter}
            sort={sort}
            setSort={setSort}
            counts={filterCounts}
          />
        )}

        {hasImages ? (
          <div className="mt-6 grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
            {filteredImages.length > 0 ? (
              filteredImages.map((image) => (
                <ImageCard
                  key={image.id}
                  image={image}
                  onRemove={removeImage}
                  onReanalyze={reanalyzeImage}
                  isAnalyzing={isAnalyzing}
                />
              ))
            ) : (
              <p className="col-span-full text-center py-10 text-gray-500 dark:text-gray-400">
                No images match the current filter.
              </p>
            )}
          </div>
        ) : (
          <div className="mt-6">
            <EmptyState />
          </div>
        )}

        <HistoryPanel history={history} onClearHistory={clearHistory} />
      </main>

      <footer className="glass mt-12 py-6">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            Resurface © 2026 • License Thesis Project • AI-Powered Image Analysis
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
