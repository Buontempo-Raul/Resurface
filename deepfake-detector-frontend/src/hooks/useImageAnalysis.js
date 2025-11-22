import { useState, useCallback } from 'react';
import { validateFile, createFilePreview, generateId } from '../utils/fileUtils';
import { analyzeImage } from '../services/api';

/**
 * Custom hook for managing image analysis state and operations
 */
export const useImageAnalysis = () => {
  const [images, setImages] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  /**
   * Adds new images to the analysis queue
   * @param {FileList|File[]} files - Files to add
   * @returns {Promise<{added: number, rejected: {file: string, reason: string}[]}>}
   */
  const addImages = useCallback(async (files) => {
    const fileArray = Array.from(files);
    const results = { added: 0, rejected: [] };

    const newImages = [];

    for (const file of fileArray) {
      const validation = validateFile(file);
      
      if (!validation.valid) {
        results.rejected.push({
          file: file.name,
          reason: validation.error,
        });
        continue;
      }

      try {
        const preview = await createFilePreview(file);
        newImages.push({
          id: generateId(),
          file,
          preview,
          status: 'pending',
          result: null,
        });
        results.added++;
      } catch (error) {
        results.rejected.push({
          file: file.name,
          reason: 'Failed to create preview',
        });
      }
    }

    setImages(prev => [...prev, ...newImages]);
    return results;
  }, []);

  /**
   * Removes an image from the list
   * @param {string} imageId - ID of image to remove
   */
  const removeImage = useCallback((imageId) => {
    setImages(prev => prev.filter(img => img.id !== imageId));
  }, []);

  /**
   * Clears all images
   */
  const clearAllImages = useCallback(() => {
    setImages([]);
    setProgress({ current: 0, total: 0 });
  }, []);

  /**
   * Analyzes all pending images
   */
  const analyzeAllImages = useCallback(async () => {
    const pendingImages = images.filter(img => img.status === 'pending');
    
    if (pendingImages.length === 0) {
      return;
    }

    setIsAnalyzing(true);
    setProgress({ current: 0, total: pendingImages.length });

    for (let i = 0; i < pendingImages.length; i++) {
      const image = pendingImages[i];
      
      // Update status to analyzing
      setImages(prev => 
        prev.map(img => 
          img.id === image.id 
            ? { ...img, status: 'analyzing' }
            : img
        )
      );

      try {
        const response = await analyzeImage(image.file);
        
        if (response.success) {
          setImages(prev =>
            prev.map(img =>
              img.id === image.id
                ? { ...img, status: 'completed', result: response.data }
                : img
            )
          );
        } else {
          setImages(prev =>
            prev.map(img =>
              img.id === image.id
                ? { ...img, status: 'error', result: { error: response.error } }
                : img
            )
          );
        }
      } catch (error) {
        setImages(prev =>
          prev.map(img =>
            img.id === image.id
              ? { ...img, status: 'error', result: { error: error.message } }
              : img
          )
        );
      }

      setProgress({ current: i + 1, total: pendingImages.length });
    }

    setIsAnalyzing(false);
  }, [images]);

  /**
   * Re-analyzes a specific image
   * @param {string} imageId - ID of image to re-analyze
   */
  const reanalyzeImage = useCallback(async (imageId) => {
    const image = images.find(img => img.id === imageId);
    if (!image) return;

    setImages(prev =>
      prev.map(img =>
        img.id === imageId
          ? { ...img, status: 'analyzing', result: null }
          : img
      )
    );

    try {
      const response = await analyzeImage(image.file);
      
      if (response.success) {
        setImages(prev =>
          prev.map(img =>
            img.id === imageId
              ? { ...img, status: 'completed', result: response.data }
              : img
          )
        );
      } else {
        setImages(prev =>
          prev.map(img =>
            img.id === imageId
              ? { ...img, status: 'error', result: { error: response.error } }
              : img
          )
        );
      }
    } catch (error) {
      setImages(prev =>
        prev.map(img =>
          img.id === imageId
            ? { ...img, status: 'error', result: { error: error.message } }
            : img
        )
      );
    }
  }, [images]);

  /**
   * Gets statistics about current images
   */
  const getStats = useCallback(() => {
    const stats = {
      total: images.length,
      pending: 0,
      analyzing: 0,
      completed: 0,
      error: 0,
      fake: 0,
      real: 0,
    };

    images.forEach(img => {
      stats[img.status]++;
      if (img.status === 'completed' && img.result) {
        if (img.result.isFake) {
          stats.fake++;
        } else {
          stats.real++;
        }
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
