/**
 * Utility functions for file validation and handling
 */

// Allowed file types and size limits
export const ALLOWED_FORMATS = ['image/jpeg', 'image/jpg', 'image/png'];
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

/**
 * Validates if a file is an allowed image format
 * @param {File} file - File to validate
 * @returns {boolean}
 */
export const isValidImageFormat = (file) => {
  return ALLOWED_FORMATS.includes(file.type.toLowerCase());
};

/**
 * Validates if a file is within the size limit
 * @param {File} file - File to validate
 * @returns {boolean}
 */
export const isValidFileSize = (file) => {
  return file.size <= MAX_FILE_SIZE;
};

/**
 * Validates a file for both format and size
 * @param {File} file - File to validate
 * @returns {{valid: boolean, error: string|null}}
 */
export const validateFile = (file) => {
  if (!isValidImageFormat(file)) {
    return {
      valid: false,
      error: `Invalid format. Only JPG, JPEG, and PNG are allowed.`
    };
  }
  
  if (!isValidFileSize(file)) {
    return {
      valid: false,
      error: `File too large. Maximum size is 10MB.`
    };
  }
  
  return { valid: true, error: null };
};

/**
 * Formats file size to human-readable string
 * @param {number} bytes - Size in bytes
 * @returns {string}
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Creates a data URL preview from a file
 * @param {File} file - Image file
 * @returns {Promise<string>}
 */
export const createFilePreview = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Generates a unique ID
 * @returns {string}
 */
export const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Formats confidence score to percentage string
 * @param {number} confidence - Confidence score (0-100)
 * @returns {string}
 */
export const formatConfidence = (confidence) => {
  return `${confidence.toFixed(1)}%`;
};

/**
 * Gets verdict color based on result
 * @param {boolean} isFake - Whether image is fake
 * @param {number} confidence - Confidence score
 * @returns {string} - Tailwind color class
 */
export const getVerdictColor = (isFake, confidence) => {
  if (isFake) {
    return confidence > 80 ? 'text-red-600' : 'text-orange-600';
  }
  return confidence > 80 ? 'text-green-600' : 'text-yellow-600';
};

/**
 * Gets verdict background color based on result
 * @param {boolean} isFake - Whether image is fake
 * @param {number} confidence - Confidence score
 * @returns {string} - Tailwind background color class
 */
export const getVerdictBgColor = (isFake, confidence) => {
  if (isFake) {
    return confidence > 80 ? 'bg-red-50' : 'bg-orange-50';
  }
  return confidence > 80 ? 'bg-green-50' : 'bg-yellow-50';
};
