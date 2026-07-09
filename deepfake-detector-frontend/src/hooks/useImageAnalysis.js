import { useState, useCallback, useEffect } from 'react';
import {
  validateFile, validateVideoFile,
  createFilePreview, generateVideoThumbnail,
  generateId,
} from '../utils/fileUtils';
import { analyzeImage, analyzeVideo, analyzeMetadata, analyzeVideoMetadata } from '../services/api';
import { dbGetAll, dbPut, dbDelete, dbClear } from '../utils/imageDB';

const isVideoFile = (file) =>
  file.type.startsWith('video/') || /\.(mp4|mov|avi|webm|mkv)$/i.test(file.name);

// Only the fields needed to resurrect the queue after a reload — preview is
// regenerated from the file itself rather than duplicated in storage.
const toPersisted = ({ id, file, fileType, status, result, createdAt }) => ({
  id, file, fileType, status, result, createdAt,
});

export const useImageAnalysis = () => {
  const [images, setImages] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  // Restore the working queue (including the original File blobs) from
  // IndexedDB on mount, so uploaded-but-not-yet-analyzed images and already
  // -analyzed results survive a page reload.
  useEffect(() => {
    (async () => {
      try {
        const stored = await dbGetAll();
        if (!stored.length) return;

        stored.sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));

        const restored = await Promise.all(
          stored.map(async (item) => {
            const preview = item.fileType === 'video'
              ? await generateVideoThumbnail(item.file)
              : await createFilePreview(item.file);
            return { ...item, preview };
          })
        );
        setImages(restored);
      } catch (_) {
        // IndexedDB unavailable (private mode, unsupported browser, etc.) —
        // the queue just starts empty, same as before this feature existed.
      }
    })();
  }, []);

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
          createdAt: Date.now(),
        });
        results.added++;
      } catch (_) {
        results.rejected.push({ file: file.name, reason: 'Failed to create preview' });
      }
    }

    setImages((prev) => [...prev, ...newItems]);
    newItems.forEach((item) => { dbPut(toPersisted(item)).catch(() => {}); });
    return results;
  }, []);

  const removeImage = useCallback((id) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
    dbDelete(id).catch(() => {});
  }, []);

  const clearAllImages = useCallback(() => {
    setImages([]);
    setProgress({ current: 0, total: 0 });
    dbClear().catch(() => {});
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

  // Persists the post-analysis status/result so a reload doesn't lose it.
  // 'analyzing' is deliberately never persisted — if the page reloads mid-
  // request, the last-known-good state on disk is still 'pending', which is
  // exactly right since the in-flight request is gone.
  const _persistOutcome = (item, status, result) => {
    dbPut(toPersisted({ ...item, status, result })).catch(() => {});
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
        const status = response.success ? 'completed' : 'error';
        const result = response.success ? response.data : { error: response.error };
        setImages((prev) => prev.map((img) => (img.id === item.id ? { ...img, status, result } : img)));
        _persistOutcome(item, status, result);
      } catch (err) {
        const status = 'error';
        const result = { error: err.message };
        setImages((prev) => prev.map((img) => (img.id === item.id ? { ...img, status, result } : img)));
        _persistOutcome(item, status, result);
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
      const status = response.success ? 'completed' : 'error';
      const result = response.success ? response.data : { error: response.error };
      setImages((prev) => prev.map((img) => (img.id === imageId ? { ...img, status, result } : img)));
      _persistOutcome(item, status, result);
    } catch (err) {
      const status = 'error';
      const result = { error: err.message };
      setImages((prev) => prev.map((img) => (img.id === imageId ? { ...img, status, result } : img)));
      _persistOutcome(item, status, result);
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
