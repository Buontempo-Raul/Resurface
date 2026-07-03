import { useState, useCallback } from 'react';
import {
  validateFile, validateVideoFile,
  createFilePreview, generateVideoThumbnail,
  generateId,
} from '../utils/fileUtils';
import { analyzeImage, analyzeVideo, analyzeMetadata, analyzeVideoMetadata } from '../services/api';

const isVideoFile = (file) =>
  file.type.startsWith('video/') || /\.(mp4|mov|avi|webm|mkv)$/i.test(file.name);

export const useImageAnalysis = () => {
  const [images, setImages] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const addImages = useCallback(async (files) => {
    const fileArray = Array.from(files);
    const results = { added: 0, rejected: [] };
    const newItems = [];

    for (const file of fileArray) {
      const video = isVideoFile(file);
      const validation = video ? validateVideoFile(file) : validateFile(file);

      if (!validation.valid) {
        results.rejected.push({ file: file.name, reason: validation.error });
        continue;
      }

      try {
        const preview = video
          ? await generateVideoThumbnail(file)
          : await createFilePreview(file);

        newItems.push({
          id: generateId(),
          file,
          preview,
          fileType: video ? 'video' : 'image',
          status: 'pending',
          result: null,
        });
        results.added++;
      } catch (_) {
        results.rejected.push({ file: file.name, reason: 'Failed to create preview' });
      }
    }

    setImages((prev) => [...prev, ...newItems]);
    return results;
  }, []);

  const removeImage = useCallback((id) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  }, []);

  const clearAllImages = useCallback(() => {
    setImages([]);
    setProgress({ current: 0, total: 0 });
  }, []);

  const _runAnalysis = async (item) => {
    const isVideo = item.fileType === 'video';

    // Metadata analysis is an independent, informational module — it runs in
    // parallel with the cascade/AltFreezing and never fails the overall analysis.
    const [primaryResponse, metadataResponse] = await Promise.all([
      isVideo ? analyzeVideo(item.file) : analyzeImage(item.file),
      isVideo ? analyzeVideoMetadata(item.file) : analyzeMetadata(item.file),
    ]);

    if (!primaryResponse.success) return primaryResponse;

    return {
      ...primaryResponse,
      data: {
        ...primaryResponse.data,
        metadataResult: metadataResponse.success ? metadataResponse.data : null,
      },
    };
  };

  const analyzeAllImages = useCallback(async () => {
    const pending = images.filter((img) => img.status === 'pending');
    if (!pending.length) return;

    setIsAnalyzing(true);
    setProgress({ current: 0, total: pending.length });

    for (let i = 0; i < pending.length; i++) {
      const item = pending[i];

      setImages((prev) =>
        prev.map((img) => (img.id === item.id ? { ...img, status: 'analyzing' } : img))
      );

      try {
        const response = await _runAnalysis(item);
        setImages((prev) =>
          prev.map((img) =>
            img.id === item.id
              ? { ...img, status: response.success ? 'completed' : 'error', result: response.success ? response.data : { error: response.error } }
              : img
          )
        );
      } catch (err) {
        setImages((prev) =>
          prev.map((img) =>
            img.id === item.id ? { ...img, status: 'error', result: { error: err.message } } : img
          )
        );
      }

      setProgress({ current: i + 1, total: pending.length });
    }

    setIsAnalyzing(false);
  }, [images]); // eslint-disable-line react-hooks/exhaustive-deps

  const reanalyzeImage = useCallback(async (imageId) => {
    const item = images.find((img) => img.id === imageId);
    if (!item) return;

    setImages((prev) =>
      prev.map((img) => (img.id === imageId ? { ...img, status: 'analyzing', result: null } : img))
    );

    try {
      const response = await _runAnalysis(item);
      setImages((prev) =>
        prev.map((img) =>
          img.id === imageId
            ? { ...img, status: response.success ? 'completed' : 'error', result: response.success ? response.data : { error: response.error } }
            : img
        )
      );
    } catch (err) {
      setImages((prev) =>
        prev.map((img) =>
          img.id === imageId ? { ...img, status: 'error', result: { error: err.message } } : img
        )
      );
    }
  }, [images]); // eslint-disable-line react-hooks/exhaustive-deps

  const getStats = useCallback(() => {
    const stats = { total: 0, pending: 0, analyzing: 0, completed: 0, error: 0, fake: 0, real: 0 };
    images.forEach((img) => {
      stats.total++;
      stats[img.status]++;
      if (img.status === 'completed' && img.result?.imageResult) {
        if (img.result.imageResult.isFake) stats.fake++;
        else stats.real++;
      }
    });
    return stats;
  }, [images]);

  return {
    images,
    isAnalyzing,
    progress,
    addImages,
    removeImage,
    clearAllImages,
    analyzeAllImages,
    reanalyzeImage,
    getStats,
  };
};
