import { Moon, Sun, Github, Info } from 'lucide-react';
import { useState, useEffect } from 'react';
import logoSrc from '../../icons/icon.png';

const FAMILY_INFO = [
  { name: 'Faceswap',     example: 'SimSwap, FaceShifter, DeepFakes', color: 'bg-orange-100 text-orange-700' },
  { name: 'Reenactment',  example: 'Face2Face, FSGAN',                 color: 'bg-yellow-100 text-yellow-700' },
  { name: 'Talking head', example: 'Wav2Lip, SadTalker',               color: 'bg-pink-100 text-pink-700' },
  { name: 'GAN',          example: 'StyleGAN, ProGAN',                 color: 'bg-purple-100 text-purple-700' },
  { name: 'Diffusion',    example: 'Stable Diffusion, DALL·E',         color: 'bg-blue-100 text-blue-700' },
];

const InfoModal = ({ isOpen, onClose }) => {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-3">
              <img src={logoSrc} alt="Resurface" className="w-10 h-10 rounded-lg object-contain" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">About Resurface</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">AI-Powered Deepfake Detection</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-5 text-gray-600 dark:text-gray-300">
            <p>
              Resurface is a deepfake detection system developed as a bachelor&apos;s thesis project.
              It uses a two-stage AI cascade to identify AI-generated or manipulated face images and
              classify their generation method.
            </p>

            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">How it works:</h3>
              <ol className="space-y-3">
                {[
                  {
                    step: '1', title: 'Face detection',
                    desc: 'MTCNN locates and crops the dominant face (224 × 224 px). If no face is found, the full image is used instead.',
                  },
                  {
                    step: '2', title: 'Binary classification',
                    desc: 'DINOv2, a vision transformer pre-trained by Meta AI, determines whether the face is real or AI-generated using a calibrated confidence threshold.',
                  },
                  {
                    step: '3', title: 'Method classification',
                    desc: 'When flagged as fake, a Swin Transformer identifies the generation method from 37 known techniques across 5 families.',
                  },
                  {
                    step: '4', title: 'OOD detection',
                    desc: 'An entropy-based out-of-distribution check flags generation methods the model has never seen during training.',
                  },
                ].map(({ step, title, desc }) => (
                  <li key={step} className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-400 text-sm font-bold flex items-center justify-center">
                      {step}
                    </span>
                    <div className="text-sm">
                      <span className="font-semibold text-gray-900 dark:text-white">{title}</span>
                      <span> — {desc}</span>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Detected fake families:</h3>
              <div className="flex flex-wrap gap-2">
                {FAMILY_INFO.map(({ name, example, color }) => (
                  <div key={name} className={`px-3 py-1.5 rounded-lg text-sm ${color}`}>
                    <span className="font-semibold">{name}</span>
                    <span className="opacity-70 ml-1 text-xs">({example})</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Features:</h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1 ml-1">
                {[
                  'Real-time image analysis',
                  'Calibrated confidence scores',
                  '37-method classification with OOD detection',
                  'Face detection indicator',
                  'Persistent history with search',
                  'Clipboard paste (Ctrl / ⌘ + V)',
                  'Batch processing with filter & sort',
                  'CSV export of results',
                  'Dark mode',
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-500 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Supported formats:</h3>
              <p className="text-sm">JPG, JPEG, PNG — max 10 MB per file</p>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-500">
                <strong className="text-gray-700 dark:text-gray-300">License Thesis Project</strong> — Bachelor&apos;s degree
                in Computer Science, 2025–2026.
              </p>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Header = () => {
  const [showInfo, setShowInfo] = useState(false);
  const [dark, setDark] = useState(() => {
    try {
      return localStorage.getItem('resurface-dark') === 'true';
    } catch (_) {
      return false;
    }
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    try { localStorage.setItem('resurface-dark', String(dark)); } catch (_) { /* */ }
  }, [dark]);

  return (
    <>
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={logoSrc} alt="Resurface logo" className="w-10 h-10 rounded-lg object-contain" />
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  Resurface
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  AI-Powered Image Analysis
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setDark((v) => !v)}
                className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                aria-label="Toggle dark mode"
                title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              <button
                onClick={() => setShowInfo(true)}
                className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                aria-label="About Resurface"
                title="About this app"
              >
                <Info className="w-5 h-5" />
              </button>

              <a
                href="https://github.com/Buontempo-Raul/Resurface"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                aria-label="GitHub Repository"
                title="View on GitHub"
              >
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </header>

      <InfoModal isOpen={showInfo} onClose={() => setShowInfo(false)} />
    </>
  );
};
