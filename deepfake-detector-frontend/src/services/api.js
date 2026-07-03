import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

/**
 * Analyzes an image for deepfake detection.
 * @param {File} file
 * @param {Function} [onProgress]
 * @returns {Promise<{success: boolean, data: import('../types/index').AnalysisResult|null, error: string|null}>}
 */
export const analyzeImage = async (file, onProgress = null) => {
  try {
    const formData = new FormData();
    formData.append('image', file);

    const response = await apiClient.post('/analyze', formData, {
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(pct);
        }
      },
    });

    const apiData = response.data;
    if (apiData.success && apiData.data) {
      const d = apiData.data;
      const ir = d.image_result;
      return {
        success: true,
        data: {
          imageResult: {
            isFake: ir.is_fake,
            fakeProbability: ir.fake_probability,
            family: ir.family,
            method: ir.method,
            isUnknownMethod: ir.is_unknown_method,
            familyEntropy: ir.family_entropy,
            faceSource: ir.face_source || 'face',
          },
          processingTimeMs: d.processing_time_ms,
        },
        error: null,
      };
    }

    return apiData;
  } catch (error) {
    console.error('[API] Error analyzing image:', error);
    return {
      success: false,
      data: null,
      error: error.response?.data?.error || error.message || 'Analysis failed',
    };
  }
};

/**
 * Batch analyze multiple images sequentially.
 * @param {File[]} files
 * @param {Function} [onProgress]
 * @returns {Promise<Object[]>}
 */
export const batchAnalyzeImages = async (files, onProgress = null) => {
  const results = [];
  for (let i = 0; i < files.length; i++) {
    const result = await analyzeImage(files[i]);
    results.push(result);
    if (onProgress) onProgress(i + 1, files.length, result);
  }
  return results;
};

/**
 * Analyzes a video with AltFreezing + Swin-37 family classification.
 * @param {File} file
 * @param {Function} [onProgress]
 * @returns {Promise<{success: boolean, data: Object|null, error: string|null}>}
 */
export const analyzeVideo = async (file, onProgress = null) => {
  try {
    const formData = new FormData();
    formData.append('video', file);

    const response = await apiClient.post('/analyze-video', formData, {
      timeout: 180000, // 3 min — video takes longer
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(pct);
        }
      },
    });

    const apiData = response.data;
    if (apiData.success && apiData.data) {
      const d = apiData.data;
      const ir = d.image_result;
      return {
        success: true,
        data: {
          imageResult: {
            isFake: ir.is_fake,
            fakeProbability: ir.fake_probability,
            family: ir.family,
            method: ir.method,
            isUnknownMethod: ir.is_unknown_method,
            familyEntropy: ir.family_entropy,
            faceSource: ir.face_source || 'aggregated',
          },
          processingTimeMs: d.processing_time_ms,
          framesAnalyzed: d.frames_analyzed,
          fakeFrames: d.fake_frames,
          framePFakes: d.frame_p_fakes,
          modelUsed: d.model_used || 'cascade',
        },
        error: null,
      };
    }
    return apiData;
  } catch (error) {
    console.error('[API] Error analyzing video:', error);
    return {
      success: false,
      data: null,
      error: error.response?.data?.error || error.message || 'Video analysis failed',
    };
  }
};

const _mapMetadataResult = (d) => ({
  status: d.status,
  markersFound: (d.markers_found || []).map((m) => ({
    source: m.source,
    field: m.field,
    matched: m.matched,
    rawExcerpt: m.raw_excerpt,
  })),
  summary: {
    hasExif: d.metadata_summary.has_exif,
    hasPngText: d.metadata_summary.has_png_text,
    hasXmp: d.metadata_summary.has_xmp,
    hasContainerTags: d.metadata_summary.has_container_tags,
    softwareTag: d.metadata_summary.software_tag,
    timestampInconsistency: d.metadata_summary.timestamp_inconsistency,
  },
});

/**
 * Analyzes image metadata (EXIF/PNG text/XMP) for known AI-generation tool
 * markers. Independent of the cascade — no probability score, no verdict.
 * @param {File} file
 * @returns {Promise<{success: boolean, data: Object|null, error: string|null}>}
 */
export const analyzeMetadata = async (file) => {
  try {
    const formData = new FormData();
    formData.append('image', file);

    const response = await apiClient.post('/analyze-metadata', formData);

    const apiData = response.data;
    if (apiData.success && apiData.data) {
      return { success: true, data: _mapMetadataResult(apiData.data), error: null };
    }

    return apiData;
  } catch (error) {
    console.error('[API] Error analyzing metadata:', error);
    return {
      success: false,
      data: null,
      error: error.response?.data?.error || error.message || 'Metadata analysis failed',
    };
  }
};

/**
 * Analyzes video container metadata (MP4/MOV/AVI/WebM/MKV tags) for known
 * AI-generation tool markers. Independent of AltFreezing/the cascade — no
 * probability score, no verdict.
 * @param {File} file
 * @returns {Promise<{success: boolean, data: Object|null, error: string|null}>}
 */
export const analyzeVideoMetadata = async (file) => {
  try {
    const formData = new FormData();
    formData.append('video', file);

    const response = await apiClient.post('/analyze-video-metadata', formData, {
      timeout: 60000,
    });

    const apiData = response.data;
    if (apiData.success && apiData.data) {
      return { success: true, data: _mapMetadataResult(apiData.data), error: null };
    }

    return apiData;
  } catch (error) {
    console.error('[API] Error analyzing video metadata:', error);
    return {
      success: false,
      data: null,
      error: error.response?.data?.error || error.message || 'Metadata analysis failed',
    };
  }
};

export default { analyzeImage, analyzeVideo, batchAnalyzeImages, analyzeMetadata, analyzeVideoMetadata };
