/**
 * Type definitions for the Resurface application
 */

/**
 * @typedef {Object} ImageFile
 * @property {string} id - Unique identifier
 * @property {File} file - The actual File object
 * @property {string} preview - Data URL for preview
 * @property {string} status - 'pending' | 'analyzing' | 'completed' | 'error'
 * @property {AnalysisResult|null} result - Analysis result if completed
 */

/**
 * @typedef {Object} ImageCascadeResult
 * @property {boolean} isFake - Whether the image is detected as deepfake
 * @property {number} fakeProbability - DINOv2 fake probability (0–1)
 * @property {string|null} family - Deepfake family (gan, diffusion, faceswap, reenactment, talking), or null
 * @property {string|null} method - Specific deepfake method, or null if real or OOD
 * @property {boolean} isUnknownMethod - True when generation method is OOD (entropy > threshold)
 * @property {number} familyEntropy - Swin family distribution entropy
 */

/**
 * @typedef {Object} AnalysisResult
 * @property {ImageCascadeResult} imageResult - Cascade detection result
 * @property {number} processingTimeMs - Time taken in milliseconds
 */

/**
 * @typedef {Object} ApiAnalysisResponse
 * @property {boolean} success - Whether the request was successful
 * @property {AnalysisResult|null} data - Analysis result data
 * @property {string|null} error - Error message if failed
 */

export { };
