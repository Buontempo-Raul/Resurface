import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

/**
 * Mock mode flag - set to false when backend is ready
 * In mock mode, returns simulated responses instead of making API calls
 */
let USE_MOCK = false;

/**
 * Generates a mock analysis result for development
 * @param {File} file - Image file
 * @returns {Promise<Object>}
 */
const generateMockResult = (file) => {
  return new Promise((resolve) => {
    // Simulate processing delay (1-3 seconds)
    const delay = Math.random() * 2000 + 1000;

    setTimeout(() => {
      const isFake = Math.random() > 0.5;
      const confidence = Math.random() * 30 + 70; // 70-100%

      const generationMethods = ['GAN', 'Diffusion', 'Face Swap', null];
      const generationMethod = isFake
        ? generationMethods[Math.floor(Math.random() * (generationMethods.length - 1))]
        : null;

      const anomalyRegions = [
        { region: 'Eyes', score: Math.random() * 100 },
        { region: 'Mouth', score: Math.random() * 100 },
        { region: 'Skin Texture', score: Math.random() * 100 },
        { region: 'Lighting', score: Math.random() * 100 },
      ].sort((a, b) => b.score - a.score);

      resolve({
        success: true,
        data: {
          isFake,
          confidence,
          generationMethod,
          heatmapUrl: null, // Will be populated later with actual heatmap
          details: {
            processingTime: delay,
            modelVersion: 'MockModel v1.0',
            anomalies: anomalyRegions,
          },
        },
        error: null,
      });
    }, delay);
  });
};

/**
 * Analyzes an image for deepfake detection
 * @param {File} file - Image file to analyze
 * @param {Function} onProgress - Optional progress callback
 * @returns {Promise<Object>}
 */
export const analyzeImage = async (file, onProgress = null) => {
  if (USE_MOCK) {
    console.log('[API Service] Using mock mode for image analysis');
    return generateMockResult(file);
  }

  try {
    const formData = new FormData();
    formData.append('image', file);

    const response = await apiClient.post('/analyze', formData, {
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      },
    });

    return response.data;
  } catch (error) {
    console.error('[API Service] Error analyzing image:', error);

    return {
      success: false,
      data: null,
      error: error.response?.data?.error || error.message || 'Analysis failed',
    };
  }
};

/**
 * Batch analyze multiple images
 * @param {File[]} files - Array of image files
 * @param {Function} onProgress - Progress callback with (index, total, result)
 * @returns {Promise<Object[]>}
 */
export const batchAnalyzeImages = async (files, onProgress = null) => {
  const results = [];

  for (let i = 0; i < files.length; i++) {
    const result = await analyzeImage(files[i]);
    results.push(result);

    if (onProgress) {
      onProgress(i + 1, files.length, result);
    }
  }

  return results;
};

/**
 * Fetches heatmap image for an analyzed result
 * @param {string} imageId - Image identifier
 * @returns {Promise<string>} - Heatmap image URL or data URL
 */
export const fetchHeatmap = async (imageId) => {
  if (USE_MOCK) {
    // Return a placeholder or null in mock mode
    return null;
  }

  try {
    const response = await apiClient.get(`/heatmap/${imageId}`, {
      responseType: 'blob',
    });

    return URL.createObjectURL(response.data);
  } catch (error) {
    console.error('[API Service] Error fetching heatmap:', error);
    return null;
  }
};

/**
 * Toggle mock mode
 * @param {boolean} enabled - Whether to enable mock mode
 */
export const setMockMode = (enabled) => {
  USE_MOCK = enabled;
  console.log(`[API Service] Mock mode ${enabled ? 'enabled' : 'disabled'}`);
};

export default {
  analyzeImage,
  batchAnalyzeImages,
  fetchHeatmap,
  setMockMode,
};
