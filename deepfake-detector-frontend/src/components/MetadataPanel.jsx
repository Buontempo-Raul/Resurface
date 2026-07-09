import { useState } from 'react';
import { ShieldAlert, ShieldQuestion } from 'lucide-react';

const STATUS_CONFIG = {
  ai_markers_detected: {
    icon: ShieldAlert,
    label: 'AI generation markers detected',
    className: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-400',
    iconClassName: 'text-amber-500',
  },
  no_metadata: {
    icon: ShieldQuestion,
    label: 'Metadata absent',
    detail: 'No significance for authenticity — many platforms (WhatsApp, Instagram, Facebook) strip EXIF/container metadata on upload regardless of whether the file is real or fake.',
    className: 'bg-white/50 dark:bg-white/5 backdrop-blur-sm border-white/40 dark:border-white/10 text-gray-600 dark:text-gray-300',
    iconClassName: 'text-gray-400',
  },
  metadata_present_no_markers: {
    icon: ShieldQuestion,
    label: 'No known AI-generation markers found',
    detail: 'Metadata is present, but this is not proof the file is authentic.',
    className: 'bg-white/50 dark:bg-white/5 backdrop-blur-sm border-white/40 dark:border-white/10 text-gray-600 dark:text-gray-300',
    iconClassName: 'text-gray-400',
  },
};

/**
 * Independent metadata-marker panel — separate from the cascade verdict.
 * Never shows a score or a real/fake-style verdict, only one of three
 * neutral/warning states (see spec_analiza_metadate.md).
 */
export const MetadataPanel = ({ metadataResult }) => {
  const [expanded, setExpanded] = useState(false);

  if (!metadataResult) return null;

  const config = STATUS_CONFIG[metadataResult.status] || STATUS_CONFIG.no_metadata;
  const Icon = config.icon;
  const markers = metadataResult.markersFound || [];

  return (
    <div className={`mt-3 p-3 rounded-lg border ${config.className}`}>
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <Icon className={`w-4 h-4 shrink-0 ${config.iconClassName}`} />
          <span className="text-sm font-medium">{config.label}</span>
        </div>
        {markers.length > 0 && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-xs underline opacity-75 hover:opacity-100 shrink-0"
          >
            {expanded ? 'Hide details' : 'Show details'}
          </button>
        )}
      </div>

      {config.detail && (
        <p className="mt-1 text-xs opacity-80">{config.detail}</p>
      )}

      {expanded && markers.length > 0 && (
        <ul className="mt-2 space-y-2 border-t border-current/10 pt-2">
          {markers.map((m, i) => (
            <li key={i} className="text-xs">
              <span className="font-semibold capitalize">{m.source}</span>
              {' · '}<span className="font-mono">{m.field}</span>
              {' → '}<span className="italic">&quot;{m.matched}&quot;</span>
              {m.rawExcerpt && (
                <div className="mt-0.5 opacity-70 break-words">{m.rawExcerpt}</div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
