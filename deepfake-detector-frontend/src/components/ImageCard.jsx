import { useState, useEffect } from 'react';
import { X, RefreshCw, AlertTriangle, CheckCircle, Loader2, XCircle, Play } from 'lucide-react';
import { formatFileSize, getVerdictColor, getVerdictBgColor } from '../utils/fileUtils';
import { MetadataPanel } from './MetadataPanel';

const FAMILY_COLORS = {
  faceswap:    'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  diffusion:   'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  gan:         'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  reenactment: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  talking:     'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
};

const StatusBadge = ({ status }) => {
  const statusConfig = {
    pending:   { icon: AlertTriangle, label: 'Pending',      className: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400' },
    analyzing: { icon: Loader2,       label: 'Analyzing...', className: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400', animate: true },
    completed: { icon: CheckCircle,   label: 'Completed',    className: 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400' },
    error:     { icon: XCircle,       label: 'Error',        className: 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400' },
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

export const ResultDisplay = ({ result }) => {
  // Hooks must be unconditional — compute values even if result is null
  const imageResult = result?.imageResult;
  const isFake = imageResult?.isFake ?? false;
  const fakeProbability = imageResult?.fakeProbability ?? 0;
  const confidencePct = imageResult
    ? (isFake ? fakeProbability * 100 : (1 - fakeProbability) * 100).toFixed(1)
    : '0';

  const [barWidth, setBarWidth] = useState(0);
  useEffect(() => {
    if (!imageResult) return;
    setBarWidth(0);
    const id = setTimeout(() => setBarWidth(+confidencePct), 60);
    return () => clearTimeout(id);
  }, [confidencePct]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!result) return null;

  if (result.error) {
    return (
      <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <p className="text-sm text-red-800 dark:text-red-400"><strong>Error:</strong> {result.error}</p>
      </div>
    );
  }

  if (!imageResult) return null;

  const { family, method, isUnknownMethod, faceSource } = imageResult;
  const { processingTimeMs, modelUsed } = result;
  const isAltFreezing = modelUsed === 'altfreezing';
  const familyColorClass = FAMILY_COLORS[family] ?? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400';

  return (
    <div className="mt-3 space-y-3">
      {/* Verdict + confidence bar */}
      <div className={`p-3 rounded-lg ${getVerdictBgColor(isFake, fakeProbability * 100)}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Verdict:</span>
          <span className={`text-lg font-bold ${getVerdictColor(isFake, fakeProbability * 100)}`}>
            {isFake ? 'FAKE' : 'REAL'}
          </span>
        </div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Confidence:</span>
          <span className="text-base font-semibold text-gray-900 dark:text-white">{confidencePct}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-1.5 rounded-full transition-all duration-700 ease-out ${isFake ? 'bg-red-500' : 'bg-green-500'}`}
            style={{ width: `${barWidth}%` }}
          />
        </div>
      </div>

      {/* AltFreezing model badge */}
      {isAltFreezing && (
        <div className="flex items-center gap-1.5">
          <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs font-semibold rounded-full">
            AltFreezing
          </span>
          <span className="text-xs text-gray-400 dark:text-gray-500">I3D + TimeTransformer</span>
        </div>
      )}

      {/* Family / method — shown when cascade has classified the fake (including AltFreezing+cascade hybrid) */}
      {isFake && (family || method || isUnknownMethod) && (
        <div className="p-3 bg-gray-50 dark:bg-gray-700/60 rounded-lg space-y-1.5">
          {isUnknownMethod ? (
            <div className="flex items-center gap-2 flex-wrap">
              <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Unknown method</span>
              {family && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${familyColorClass}`}>
                  closest: {family}
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center flex-wrap gap-2">
              {family && (
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${familyColorClass}`}>
                  {family}
                </span>
              )}
              {method && (
                <span className="text-sm text-gray-600 dark:text-gray-400">{method}</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Frame probability bar (video only) */}
      {result.framePFakes?.length > 0 && (
        <div className="p-2.5 bg-gray-50 dark:bg-gray-700/60 rounded-lg">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1.5">
            <span>
              {isAltFreezing ? 'Clips' : 'Frames'}: {result.fakeFrames} / {result.framesAnalyzed} fake
            </span>
          </div>
          <div className="flex gap-0.5 h-5 items-end">
            {result.framePFakes.map((p, i) => (
              <div
                key={i}
                title={`${isAltFreezing ? 'Clip' : 'Frame'} ${i + 1}: ${(p * 100).toFixed(0)}% fake`}
                className={`flex-1 rounded-sm transition-all ${p >= 0.5 ? 'bg-red-500' : 'bg-green-500'}`}
                style={{ height: `${Math.max(20, p * 100)}%` }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Face source / aggregated label + processing time */}
      <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
        {faceSource === 'altfreezing' ? (
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-400" />
            <span>
              AltFreezing · {result.framesAnalyzed} clips
              {isFake && family && ' · Cascade classified'}
            </span>
          </div>
        ) : faceSource === 'aggregated' ? (
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            <span>{result.framesAnalyzed} frames analyzed</span>
          </div>
        ) : faceSource !== undefined ? (
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${faceSource === 'face' ? 'bg-green-400' : 'bg-amber-400'}`} />
            <span>{faceSource === 'face' ? 'Face detected' : 'Full image used'}</span>
          </div>
        ) : null}
        {processingTimeMs != null && (
          <span className="ml-auto">{(processingTimeMs / 1000).toFixed(2)}s</span>
        )}
      </div>

      {/* Metadata markers — independent of the cascade verdict above */}
      <MetadataPanel metadataResult={result.metadataResult} />
    </div>
  );
};

export const ImageCard = ({ image, onRemove, onReanalyze, isAnalyzing }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
      <div className="relative aspect-square bg-gray-100 dark:bg-gray-700">
        <img
          src={image.preview}
          alt={image.file.name}
          className="w-full h-full object-cover"
        />
        {/* Video play overlay */}
        {image.fileType === 'video' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-10 h-10 bg-black/50 rounded-full flex items-center justify-center">
              <Play className="w-5 h-5 text-white ml-0.5" />
            </div>
          </div>
        )}
        <button
          onClick={() => onRemove(image.id)}
          className="absolute top-2 right-2 p-1.5 bg-white dark:bg-gray-800 rounded-full shadow-md hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
          aria-label="Remove image"
        >
          <X className="w-4 h-4 text-gray-600 dark:text-gray-300 hover:text-red-600" />
        </button>
        <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
          <StatusBadge status={image.status} />
          {image.fileType === 'video' && (
            <span className="px-1.5 py-0.5 bg-black/50 text-white text-xs rounded font-medium">VIDEO</span>
          )}
        </div>
      </div>

      <div className="p-4">
        <div className="mb-3">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate" title={image.file.name}>
            {image.file.name}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{formatFileSize(image.file.size)}</p>
        </div>

        <ResultDisplay result={image.result} />

        {image.status === 'pending' && (
          <button
            onClick={() => onReanalyze(image.id)}
            disabled={isAnalyzing}
            className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Analyze
          </button>
        )}

        {(image.status === 'completed' || image.status === 'error') && (
          <button
            onClick={() => onReanalyze(image.id)}
            disabled={isAnalyzing}
            className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Re-analyze
          </button>
        )}
      </div>
    </div>
  );
};
