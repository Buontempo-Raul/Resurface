/**
 * Utility functions for file validation and handling
 */

/**
 * Generates a JPEG thumbnail data-URL from an existing data-URL.
 * Scales down so the longest dimension is at most maxSize, preserving aspect ratio.
 * @param {string} dataUrl
 * @param {number} maxSize
 * @returns {Promise<string|null>}
 */
export const generateThumbnail = (dataUrl, maxSize = 400) =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', 0.75));
    };
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });

// Image constraints
export const ALLOWED_FORMATS = ['image/jpeg', 'image/jpg', 'image/png'];
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

// Video constraints
export const ALLOWED_VIDEO_FORMATS = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm', 'video/x-matroska'];
export const MAX_VIDEO_SIZE = 200 * 1024 * 1024; // 200 MB

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
 * Validates a video file for format and size.
 * Falls back to extension check when the browser doesn't set a MIME type.
 * @param {File} file
 * @returns {{valid: boolean, error: string|null}}
 */
export const validateVideoFile = (file) => {
  const byMime = ALLOWED_VIDEO_FORMATS.includes(file.type.toLowerCase());
  const byExt = /\.(mp4|mov|avi|webm|mkv)$/i.test(file.name);
  if (!byMime && !byExt) {
    return { valid: false, error: 'Invalid format. Supported video formats: MP4, MOV, AVI, WebM, MKV.' };
  }
  if (file.size > MAX_VIDEO_SIZE) {
    return { valid: false, error: 'Video too large. Maximum size is 200 MB.' };
  }
  return { valid: true, error: null };
};

/**
 * Generates a JPEG thumbnail from a video File by seeking to 25% of duration.
 * @param {File} file
 * @returns {Promise<string|null>}
 */
export const generateVideoThumbnail = (file) =>
  new Promise((resolve) => {
    const video = document.createElement('video');
    const url = URL.createObjectURL(file);
    let settled = false;

    const finish = (result) => {
      if (settled) return;
      settled = true;
      try { URL.revokeObjectURL(url); } catch (_) {}
      resolve(result);
    };

    video.muted = true;
    video.preload = 'metadata';
    video.playsInline = true;

    video.addEventListener('loadedmetadata', () => {
      video.currentTime = Math.min(1, (video.duration || 4) * 0.25);
    });

    video.addEventListener('seeked', () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 320;
        canvas.height = video.videoHeight || 240;
        canvas.getContext('2d').drawImage(video, 0, 0);
        finish(canvas.toDataURL('image/jpeg', 0.8));
      } catch (_) {
        finish(null);
      }
    });

    video.addEventListener('error', () => finish(null));
    setTimeout(() => finish(null), 8000);

    video.src = url;
  });

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
    return confidence > 80
      ? 'text-red-600 dark:text-red-400'
      : 'text-orange-600 dark:text-orange-400';
  }
  return confidence > 80
    ? 'text-green-600 dark:text-green-400'
    : 'text-yellow-600 dark:text-yellow-400';
};

/**
 * Gets verdict background color based on result
 * @param {boolean} isFake - Whether image is fake
 * @param {number} confidence - Confidence score
 * @returns {string} - Tailwind background color class
 */
export const getVerdictBgColor = (isFake, confidence) => {
  if (isFake) {
    return confidence > 80
      ? 'bg-red-50 dark:bg-red-900/20'
      : 'bg-orange-50 dark:bg-orange-900/20';
  }
  return confidence > 80
    ? 'bg-green-50 dark:bg-green-900/20'
    : 'bg-yellow-50 dark:bg-yellow-900/20';
};
