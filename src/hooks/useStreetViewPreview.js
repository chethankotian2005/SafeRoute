/**
 * useStreetViewPreview Hook
 * Manages street view preview generation and state
 */

import { useState, useEffect, useCallback } from 'react';
import routePreviewService from '../services/routePreviewService';
import { firestore } from '../config/firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';

export const useStreetViewPreview = (routeCoordinates = null, options = {}) => {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(null);
  const [error, setError] = useState(null);
  const [cached, setCached] = useState(false);

  const {
    autoGenerate = false,
    samplingDistance = 200,
    maxPoints = 10,
    timeout = 30000,
  } = options;

  /**
   * Generate preview for route
   */
  const generatePreview = useCallback(async (coordinates = routeCoordinates) => {
    if (!coordinates || coordinates.length < 2) {
      setError('Invalid route coordinates');
      return;
    }

    setLoading(true);
    setError(null);
    setLoadingProgress({ stage: 'sampling', progress: 0 });

    try {
      // Check cache first
      const cachedPreview = await routePreviewService.getCachedPreview(coordinates);
      
      if (cachedPreview) {
        console.log('Using cached preview');
        setPreview(cachedPreview);
        setCached(true);
        setLoading(false);
        return cachedPreview;
      }

      setCached(false);

      // Generate new preview
      const newPreview = await routePreviewService.generateRoutePreview(
        coordinates,
        {
          samplingDistance,
          maxPoints,
          timeout,
          onProgress: (progress) => {
            setLoadingProgress(progress);
          },
        }
      );

      setPreview(newPreview);
      setLoading(false);
      setLoadingProgress(null);
      return newPreview;
    } catch (err) {
      console.error('Error generating preview:', err);
      setError(err.message);
      setLoading(false);
      setLoadingProgress(null);

      // Try fallback preview
      try {
        console.log('Attempting fallback preview');
        const fallbackPreview = await routePreviewService.generateFallbackPreview(coordinates);
        setPreview(fallbackPreview);
        return fallbackPreview;
      } catch (fallbackErr) {
        console.error('Fallback preview failed:', fallbackErr);
        setPreview({ error: err.message });
      }
    }
  }, [routeCoordinates, samplingDistance, maxPoints, timeout]);

  /**
   * Refresh preview (force regeneration)
   */
  const refreshPreview = useCallback(async () => {
    if (!routeCoordinates) return;

    // Clear cache for this route
    setPreview(null);
    setCached(false);
    await generatePreview(routeCoordinates);
  }, [routeCoordinates, generatePreview]);

  /**
   * Clear all preview caches
   */
  const clearCache = useCallback(async () => {
    try {
      await routePreviewService.clearAllPreviewCaches();
      setCached(false);
      setPreview(null);
    } catch (err) {
      console.error('Error clearing cache:', err);
    }
  }, []);

  /**
   * Submit user rating
   */
  const submitRating = useCallback(async (rating, routeInfo = {}) => {
    try {
      // Save rating to Firestore
      await addDoc(collection(firestore, 'route_ratings'), {
        rating: rating.id,
        routeInfo: {
          coordinates: routeCoordinates,
          safetyScore: preview?.statistics?.overallSafetyScore,
          ...routeInfo,
        },
        timestamp: new Date().toISOString(),
      });

      console.log('Rating submitted:', rating);
    } catch (err) {
      console.error('Error submitting rating:', err);
    }
  }, [routeCoordinates, preview]);

  /**
   * Get preview summary
   */
  const getPreviewSummary = useCallback(() => {
    if (!preview || !preview.statistics) {
      return null;
    }

    const { statistics } = preview;
    
    return {
      safetyScore: statistics.overallSafetyScore,
      grade: statistics.grade,
      color: statistics.color,
      concerns: statistics.concerns?.length || 0,
      positives: statistics.positives?.length || 0,
      problemSegments: statistics.problemSegments?.length || 0,
      recommendSafe: statistics.overallSafetyScore >= 6,
    };
  }, [preview]);

  /**
   * Check if preview is valid
   */
  const isValid = useCallback(() => {
    return routePreviewService.isValidPreview(preview);
  }, [preview]);

  /**
   * Auto-generate preview on mount if enabled
   */
  useEffect(() => {
    if (autoGenerate && routeCoordinates && !preview && !loading) {
      generatePreview();
    }
  }, [autoGenerate, routeCoordinates, preview, loading, generatePreview]);

  return {
    // State
    preview,
    loading,
    loadingProgress,
    error,
    cached,

    // Actions
    generatePreview,
    refreshPreview,
    clearCache,
    submitRating,

    // Utilities
    getPreviewSummary,
    isValid,
  };
};

export default useStreetViewPreview;
