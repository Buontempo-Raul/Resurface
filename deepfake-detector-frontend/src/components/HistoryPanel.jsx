import { useState, useEffect, useCallback } from 'react';
import {
  ChevronDown, ChevronUp, Search, Clock, X,
  Image as ImageIcon, Trash2,
} from 'lucide-react';
import { formatFileSize } from '../utils/fileUtils';
import { ResultDisplay } from './ImageCard';

const FAMILY_COLORS = {
  faceswap:    'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  diffusion:   'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  gan:         'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  reenactment: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  talking:     'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
};

const DetailModal = ({ entry, onClose }) => {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative aspect-square bg-gray-100 dark:bg-gray-700">
          {entry.thumbnail ? (
            <img src={entry.thumbnail} alt={entry.filename} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="w-16 h-16 text-gray-300 dark:text-gray-600" />
            </div>
          )}
          <button
            onClick={onClose}
            className="absolute top-2 right-2 p-1.5 bg-white dark:bg-gray-800 rounded-full shadow-md hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-gray-600 dark:text-gray-300" />
          </button>
        </div>
        <div className="p-4">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate" title={entry.filename}>
            {entry.filename}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            {formatFileSize(entry.fileSize)} · {new Date(entry.timestamp).toLocaleString()}
          </p>
          {entry.status === 'error' ? (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-800 dark:text-red-400">
              <strong>Error:</strong> {entry.error}
            </div>
          ) : (
            <ResultDisplay result={entry.result} />
          )}
        </div>
      </div>
    </div>
  );
};

const fakeLabel = (ir) => {
  if (!ir?.isFake) return null;
  if (ir.isUnknownMethod) return `Unknown method${ir.family ? ` (${ir.family})` : ''}`;
  const parts = [ir.family, ir.method].filter(Boolean);
  return parts.join(' / ');
};

const HistoryRow = ({ entry, onClick }) => {
  const ir = entry.result?.imageResult;
  const label = fakeLabel(ir);
  const familyColorClass = ir?.family ? (FAMILY_COLORS[ir.family] ?? '') : '';

  return (
    <button
      onClick={() => onClick(entry)}
      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
    >
      <div className="w-10 h-10 rounded overflow-hidden shrink-0 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
        {entry.thumbnail ? (
          <img src={entry.thumbnail} alt="" className="w-full h-full object-cover" />
        ) : (
          <ImageIcon className="w-4 h-4 text-gray-300 dark:text-gray-600" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{entry.filename}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          {formatFileSize(entry.fileSize)} · {new Date(entry.timestamp).toLocaleString()}
        </p>
      </div>

      <div className="shrink-0 text-right min-w-[90px]">
        {entry.status === 'completed' && ir && (
          <>
            <span className={`text-sm font-bold ${ir.isFake ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
              {ir.isFake ? 'FAKE' : 'REAL'}
            </span>
            {ir.isFake && ir.family && (
              <p className={`text-xs px-1.5 py-0.5 rounded-full inline-block mt-0.5 capitalize ${familyColorClass}`}>
                {ir.isUnknownMethod ? `? (${ir.family})` : ir.family}
              </p>
            )}
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {Math.round((ir.isFake ? ir.fakeProbability : 1 - ir.fakeProbability) * 100)}%
            </p>
          </>
        )}
        {entry.status === 'error' && (
          <span className="text-xs text-red-500">Error</span>
        )}
      </div>
    </button>
  );
};

export const HistoryPanel = ({ history, onClearHistory }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  const closeModal = useCallback(() => setSelected(null), []);

  if (history.length === 0) return null;

  const filtered = search.trim()
    ? history.filter((e) => e.filename.toLowerCase().includes(search.toLowerCase()))
    : history;

  return (
    <>
      <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setIsOpen((v) => !v)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors rounded-lg"
        >
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <span className="font-semibold text-gray-900 dark:text-white">Upload History</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              ({history.length} file{history.length !== 1 ? 's' : ''})
            </span>
          </div>
          {isOpen
            ? <ChevronUp className="w-5 h-5 text-gray-400 dark:text-gray-500" />
            : <ChevronDown className="w-5 h-5 text-gray-400 dark:text-gray-500" />}
        </button>

        {isOpen && (
          <div className="border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-700">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  placeholder="Search by filename…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={onClearHistory}
                title="Clear history"
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-72 overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-6">
                  No files match &quot;{search}&quot;
                </p>
              ) : (
                filtered.map((entry) => (
                  <HistoryRow key={entry.id} entry={entry} onClick={setSelected} />
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {selected && <DetailModal entry={selected} onClose={closeModal} />}
    </>
  );
};
