import { useCallback, useState } from 'react';
import { Upload, AlertCircle } from 'lucide-react';

export const UploadZone = ({ onFilesAdded, disabled }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled) return;
    const files = e.dataTransfer.files;
    if (files && files.length > 0) onFilesAdded(files);
  }, [disabled, onFilesAdded]);

  const handleFileInput = useCallback((e) => {
    const files = e.target.files;
    if (files && files.length > 0) onFilesAdded(files);
    e.target.value = '';
  }, [onFilesAdded]);

  return (
    <div
      className={`
        relative border-2 border-dashed rounded-lg p-12 text-center transition-all
        ${isDragging
          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
          : 'border-gray-300 dark:border-gray-600 bg-white/40 dark:bg-white/5 backdrop-blur-md hover:border-gray-400 dark:hover:border-gray-500'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <input
        type="file"
        multiple
        accept=".jpg,.jpeg,.png,.mp4,.mov,.avi,.webm,.mkv"
        onChange={handleFileInput}
        disabled={disabled}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        aria-label="Upload images or videos"
      />

      <div className="flex flex-col items-center gap-4">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isDragging ? 'bg-primary-100 dark:bg-primary-900/40' : 'bg-gray-100 dark:bg-gray-700'}`}>
          <Upload className={`w-8 h-8 ${isDragging ? 'text-primary-600' : 'text-gray-400 dark:text-gray-500'}`} />
        </div>

        <div>
          <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
            {isDragging ? 'Drop images here' : 'Drag & drop images here'}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            or click to browse — or paste from clipboard (Ctrl / ⌘ + V)
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
          <AlertCircle className="w-4 h-4" />
          <span>Images: JPG, PNG (10 MB) • Videos: MP4, MOV, AVI, WebM (200 MB)</span>
        </div>
      </div>
    </div>
  );
};
