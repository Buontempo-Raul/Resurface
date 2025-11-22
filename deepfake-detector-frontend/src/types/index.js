/**
 * Type definitions for the Resurface application
 * These are JSDoc types for JavaScript (not TypeScript)
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
 * @typedef {Object} AnalysisResult
 * @property {boolean} isFake - Whether the image is detected as fake
 * @property {number} confidence - Confidence score (0-100)
 * @property {string|null} generationMethod - Detected generation method (GAN, Diffusion, Face Swap, etc.)
 * @property {string|null} heatmapUrl - URL to heatmap visualization
 * @property {AnalysisDetails} details - Additional analysis details
 */

/**
 * @typedef {Object} AnalysisDetails
 * @property {number} processingTime - Time taken in milliseconds
 * @property {string} modelVersion - Version of the detection model used
 * @property {AnomalyRegion[]} anomalies - Detected anomaly regions
 */

/**
 * @typedef {Object} AnomalyRegion
 * @property {string} region - Region name (eyes, mouth, skin, etc.)
 * @property {number} score - Anomaly score for this region (0-100)
 */

/**
 * @typedef {Object} ApiAnalysisRequest
 * @property {File} image - Image file to analyze
 */

/**
 * @typedef {Object} ApiAnalysisResponse
 * @property {boolean} success - Whether the request was successful
 * @property {AnalysisResult|null} data - Analysis result data
 * @property {string|null} error - Error message if failed
 */

export { };
