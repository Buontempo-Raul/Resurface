import { X, RefreshCw, AlertTriangle, CheckCircle, Loader2, XCircle } from 'lucide-react';
import { formatFileSize, formatConfidence, getVerdictColor, getVerdictBgColor } from '../utils/fileUtils';

/**
 * StatusBadge - Shows the current status of an image analysis
 */
const StatusBadge = ({ status }) => {
  const statusConfig = {
    pending: {
      icon: AlertTriangle,
      label: 'Pending',
      className: 'bg-gray-100 text-gray-600',
    },
    analyzing: {
      icon: Loader2,
      label: 'Analyzing...',
      className: 'bg-blue-100 text-blue-600',
      animate: true,
    },
    completed: {
      icon: CheckCircle,
      label: 'Completed',
      className: 'bg-green-100 text-green-600',
    },
    error: {
      icon: XCircle,
      label: 'Error',
      className: 'bg-red-100 text-red-600',
    },
  };

  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
      <Icon className={`w-3.5 h-3.5 ${config.animate ? 'animate-spin' : ''}`} />
      <span>{config.label}</span>
    </div>
  );
};

/**
 * ResultDisplay - Shows the analysis result details
 */
const ResultDisplay = ({ result }) => {
  if (!result) return null;

  if (result.error) {
    return (
      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-sm text-red-800">
          <strong>Error:</strong> {result.error}
        </p>
      </div>
    );
  }

  const { isFake, confidence, generationMethod, details } = result;

  return (
    <div className="mt-3 space-y-3">
      {/* Verdict */}
      <div className={`p-3 rounded-lg ${getVerdictBgColor(isFake, confidence)}`}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Verdict:</span>
          <span className={`text-lg font-bold ${getVerdictColor(isFake, confidence)}`}>
            {isFake ? 'FAKE' : 'REAL'}
          </span>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-sm font-medium text-gray-700">Confidence:</span>
          <span className="text-lg font-semibold text-gray-900">
            {formatConfidence(confidence)}
          </span>
        </div>
      </div>

      {/* Generation Method */}
      {generationMethod && (
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Method:</span>
            <span className="text-sm font-semibold text-gray-900">
              {generationMethod}
            </span>
          </div>
        </div>
      )}

      {/* Anomaly Regions */}
      {details?.anomalies && details.anomalies.length > 0 && (
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-700 mb-2">Anomaly Analysis:</p>
          <div className="space-y-2">
            {details.anomalies.slice(0, 3).map((anomaly, idx) => (
              <div key={idx}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-600">{anomaly.region}</span>
                  <span className="font-medium text-gray-900">
                    {anomaly.score.toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full ${
                      anomaly.score > 70 ? 'bg-red-500' :
                      anomaly.score > 40 ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}
                    style={{ width: `${anomaly.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Processing Time */}
      {details?.processingTime && (
        <div className="text-xs text-gray-500 text-center">
          Processed in {(details.processingTime / 1000).toFixed(2)}s
        </div>
      )}
    </div>
  );
};

/**
 * ImageCard - Displays an image with its analysis status and results
 */
export const ImageCard = ({ image, onRemove, onReanalyze }) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow">
      {/* Image Preview */}
      <div className="relative aspect-square bg-gray-100">
        <img
          src={image.preview}
          alt={image.file.name}
          className="w-full h-full object-cover"
        />
        
        {/* Remove Button */}
        <button
          onClick={() => onRemove(image.id)}
          className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow-md hover:bg-red-50 transition-colors"
          aria-label="Remove image"
        >
          <X className="w-4 h-4 text-gray-600 hover:text-red-600" />
        </button>

        {/* Status Badge Overlay */}
        <div className="absolute bottom-2 left-2">
          <StatusBadge status={image.status} />
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4">
        {/* File Info */}
        <div className="mb-3">
          <p className="text-sm font-medium text-gray-900 truncate" title={image.file.name}>
            {image.file.name}
          </p>
          <p className="text-xs text-gray-500">
            {formatFileSize(image.file.size)}
          </p>
        </div>

        {/* Result Display */}
        <ResultDisplay result={image.result} />

        {/* Re-analyze Button */}
        {(image.status === 'completed' || image.status === 'error') && (
          <button
            onClick={() => onReanalyze(image.id)}
            className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Re-analyze
          </button>
        )}
      </div>
    </div>
  );
};
