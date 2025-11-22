import { Shield, Github, Info } from 'lucide-react';
import { useState } from 'react';

/**
 * InfoModal - Displays information about the application
 */
const InfoModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">About Resurface</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4 text-gray-600">
            <p>
              This application uses artificial intelligence to detect deepfake images and classify
              their generation methods. It analyzes images for signs of manipulation and provides
              confidence scores with visual explanations.
            </p>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Features:</h3>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Real-time deepfake detection</li>
                <li>Confidence scoring (0-100%)</li>
                <li>Generation method classification (GAN, Diffusion, Face Swap)</li>
                <li>Anomaly region analysis</li>
                <li>Batch processing support</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Supported Formats:</h3>
              <p>JPG, JPEG, PNG (max 10MB per file)</p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">How to Use:</h3>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Upload one or more images using drag & drop or file selection</li>
                <li>Click "Analyze All" to start the detection process</li>
                <li>Review results including verdict, confidence, and anomaly analysis</li>
                <li>Re-analyze individual images if needed</li>
              </ol>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                <strong>License Thesis Project</strong> - Developed as part of a Computer Science bachelor's thesis
                on deepfake detection using artificial intelligence.
              </p>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Header - Application header with branding and actions
 */
export const Header = () => {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <>
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Logo and Title */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center shadow-md">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  Resurface
                </h1>
                <p className="text-xs sm:text-sm text-gray-500">
                  AI-Powered Image Analysis
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowInfo(true)}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Information"
                title="About this app"
              >
                <Info className="w-5 h-5" />
              </button>

              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
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
