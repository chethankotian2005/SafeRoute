/**
 * Route Preview Service
 * Orchestrates Street View fetching and AI analysis for route previews
 */

import streetViewService from './streetViewService';
import imageAnalysisService from './imageAnalysisService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PREVIEW_TIMEOUT = 30000; // 30 seconds max
const MAX_PREVIEW_POINTS = 10; // Limit number of preview points

/**
 * Generate complete route preview with images and analysis
 * @param {Array} routeCoordinates - Full route coordinates
 * @param {Object} options - Preview options
 * @returns {Promise<Object>} Complete preview data
 */
export const generateRoutePreview = async (routeCoordinates, options = {}) => {
  const {
    samplingDistance = 200,
    maxPoints = MAX_PREVIEW_POINTS,
    timeout = PREVIEW_TIMEOUT,
    onProgress = null,
  } = options;

  const startTime = Date.now();

  try {
    // Step 1: Sample route points
    if (onProgress) onProgress({ stage: 'sampling', progress: 0 });
    
    let sampledPoints = streetViewService.sampleRoutePoints(
      routeCoordinates,
      samplingDistance
    );

    // Limit number of points
    if (sampledPoints.length > maxPoints) {
      // Keep start, end, and evenly distributed points
      const step = Math.floor((sampledPoints.length - 2) / (maxPoints - 2));
      const limitedPoints = [sampledPoints[0]];
      
      for (let i = step; i < sampledPoints.length - 1; i += step) {
        limitedPoints.push(sampledPoints[i]);
        if (limitedPoints.length >= maxPoints - 1) break;
      }
      
      limitedPoints.push(sampledPoints[sampledPoints.length - 1]);
      sampledPoints = limitedPoints;
    }

    // Step 2: Fetch Street View images
    if (onProgress) onProgress({ stage: 'fetching', progress: 0 });
    
    const imageProgress = (current, total) => {
      if (onProgress) {
        onProgress({
          stage: 'fetching',
          progress: current / total,
          current,
          total,
        });
      }
    };

    const images = await Promise.race([
      streetViewService.fetchStreetViewImages(sampledPoints, imageProgress),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout fetching images')), timeout)
      ),
    ]);

    // Filter out unavailable images
    const availableImages = images.filter((img) => img.available);

    if (availableImages.length === 0) {
      throw new Error('No Street View imagery available for this route');
    }

    // Step 3: Analyze images with AI
    if (onProgress) onProgress({ stage: 'analyzing', progress: 0 });

    const analysisResults = [];
    const timeRemaining = timeout - (Date.now() - startTime);
    const timePerImage = Math.max(3000, timeRemaining / availableImages.length);

    for (let i = 0; i < availableImages.length; i++) {
      const image = availableImages[i];

      if (onProgress) {
        onProgress({
          stage: 'analyzing',
          progress: i / availableImages.length,
          current: i + 1,
          total: availableImages.length,
        });
      }

      try {
        const analysis = await Promise.race([
          imageAnalysisService.analyzeImage(image.url),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Analysis timeout')), timePerImage)
          ),
        ]);

        analysisResults.push({
          ...image,
          analysis,
        });
      } catch (error) {
        console.warn(`Failed to analyze image ${i}:`, error);
        // Add placeholder analysis
        analysisResults.push({
          ...image,
          analysis: {
            error: error.message,
            safetyScore: {
              overall: 5,
              grade: 'Unknown',
              color: '#9E9E9E',
            },
          },
        });
      }

      // Check timeout
      if (Date.now() - startTime > timeout) {
        console.warn('Preview generation timeout reached');
        break;
      }
    }

    // Step 4: Calculate overall route statistics
    if (onProgress) onProgress({ stage: 'finalizing', progress: 1 });

    const routeStatistics = calculateRouteStatistics(analysisResults);

    // Step 5: Compile preview data
    const preview = {
      routeCoordinates,
      sampledPoints: analysisResults,
      statistics: routeStatistics,
      metadata: {
        generatedAt: new Date().toISOString(),
        totalPoints: sampledPoints.length,
        analyzedPoints: analysisResults.length,
        samplingDistance,
        generationTime: Date.now() - startTime,
      },
    };

    // Cache preview
    await cachePreview(routeCoordinates, preview);

    return preview;
  } catch (error) {
    console.error('Error generating route preview:', error);
    throw error;
  }
};

/**
 * Calculate overall route statistics from analyzed images
 * @param {Array} analysisResults - Array of analyzed images
 * @returns {Object} Route statistics
 */
const calculateRouteStatistics = (analysisResults) => {
  if (analysisResults.length === 0) {
    return {
      overallSafetyScore: 5,
      grade: 'Unknown',
      color: '#9E9E9E',
      concerns: [],
      positives: [],
      recommendations: [],
    };
  }

  // Calculate average scores
  let totalScore = 0;
  let totalLighting = 0;
  let totalSidewalk = 0;
  let totalCrowd = 0;
  let totalIsolation = 0;
  let totalBuilding = 0;
  let validCount = 0;

  const allConcerns = [];
  const allPositives = [];
  const allRecommendations = new Set();

  analysisResults.forEach((result) => {
    if (result.analysis && result.analysis.safetyScore && !result.analysis.error) {
      totalScore += result.analysis.safetyScore.overall;
      
      if (result.analysis.lighting) totalLighting += result.analysis.lighting.score;
      if (result.analysis.sidewalk) totalSidewalk += result.analysis.sidewalk.score;
      if (result.analysis.crowdDensity) totalCrowd += result.analysis.crowdDensity.score;
      if (result.analysis.isolation) totalIsolation += result.analysis.isolation.score;
      if (result.analysis.buildingType) totalBuilding += result.analysis.buildingType.score;
      
      validCount++;

      // Collect concerns and positives
      if (result.analysis.recommendations) {
        result.analysis.recommendations.concerns?.forEach((concern) => {
          allConcerns.push({
            concern,
            location: `${Math.round(result.distanceFromStart)}m from start`,
            index: result.index,
          });
        });

        result.analysis.recommendations.positives?.forEach((positive) => {
          allPositives.push(positive);
        });

        result.analysis.recommendations.tips?.forEach((tip) => {
          allRecommendations.add(tip);
        });
      }
    }
  });

  const avgScore = validCount > 0 ? totalScore / validCount : 5;
  const avgLighting = validCount > 0 ? totalLighting / validCount : 5;
  const avgSidewalk = validCount > 0 ? totalSidewalk / validCount : 5;
  const avgCrowd = validCount > 0 ? totalCrowd / validCount : 5;
  const avgIsolation = validCount > 0 ? totalIsolation / validCount : 5;
  const avgBuilding = validCount > 0 ? totalBuilding / validCount : 5;

  // Determine overall grade and color
  let grade = 'Poor';
  let color = '#FF5252';

  if (avgScore >= 7.5) {
    grade = 'Excellent';
    color = '#4CAF50';
  } else if (avgScore >= 6) {
    grade = 'Good';
    color = '#8BC34A';
  } else if (avgScore >= 4.5) {
    grade = 'Moderate';
    color = '#FFC107';
  } else if (avgScore >= 3) {
    grade = 'Fair';
    color = '#FF9800';
  }

  // Find problem segments (score < 4)
  const problemSegments = analysisResults.filter(
    (result) =>
      result.analysis?.safetyScore?.overall < 4 && !result.analysis.error
  );

  return {
    overallSafetyScore: Math.round(avgScore * 10) / 10,
    grade,
    color,
    breakdown: {
      lighting: Math.round(avgLighting * 10) / 10,
      sidewalk: Math.round(avgSidewalk * 10) / 10,
      crowdDensity: Math.round(avgCrowd * 10) / 10,
      isolation: Math.round(avgIsolation * 10) / 10,
      buildingType: Math.round(avgBuilding * 10) / 10,
    },
    concerns: allConcerns,
    positives: [...new Set(allPositives)].slice(0, 5), // Unique top 5
    recommendations: Array.from(allRecommendations),
    problemSegments: problemSegments.map((seg) => ({
      index: seg.index,
      distance: Math.round(seg.distanceFromStart),
      score: seg.analysis.safetyScore.overall,
      mainIssues: seg.analysis.recommendations?.concerns || [],
    })),
    segmentCount: validCount,
  };
};

/**
 * Get cached preview for a route
 * @param {Array} routeCoordinates - Route coordinates
 * @returns {Promise<Object|null>} Cached preview or null
 */
export const getCachedPreview = async (routeCoordinates) => {
  try {
    const routeKey = generateRouteKey(routeCoordinates);
    const cacheKey = `route_preview_${routeKey}`;
    const cached = await AsyncStorage.getItem(cacheKey);

    if (cached) {
      const preview = JSON.parse(cached);
      // Check if cache is still valid (24 hours)
      const cacheAge = Date.now() - new Date(preview.metadata.generatedAt).getTime();
      if (cacheAge < 24 * 60 * 60 * 1000) {
        return preview;
      }
    }
  } catch (error) {
    console.error('Error getting cached preview:', error);
  }
  return null;
};

/**
 * Cache preview data
 * @param {Array} routeCoordinates - Route coordinates
 * @param {Object} preview - Preview data
 */
const cachePreview = async (routeCoordinates, preview) => {
  try {
    const routeKey = generateRouteKey(routeCoordinates);
    const cacheKey = `route_preview_${routeKey}`;
    await AsyncStorage.setItem(cacheKey, JSON.stringify(preview));
  } catch (error) {
    console.error('Error caching preview:', error);
  }
};

/**
 * Generate unique key for route based on coordinates
 * @param {Array} routeCoordinates - Route coordinates
 * @returns {string} Route key
 */
const generateRouteKey = (routeCoordinates) => {
  if (!routeCoordinates || routeCoordinates.length === 0) {
    return 'unknown';
  }

  const start = routeCoordinates[0];
  const end = routeCoordinates[routeCoordinates.length - 1];

  return `${start.latitude.toFixed(4)}_${start.longitude.toFixed(4)}_${end.latitude.toFixed(4)}_${end.longitude.toFixed(4)}`;
};

/**
 * Clear all route preview caches
 * @returns {Promise<void>}
 */
export const clearAllPreviewCaches = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const previewKeys = keys.filter((key) => key.startsWith('route_preview_'));
    await AsyncStorage.multiRemove(previewKeys);
    console.log(`Cleared ${previewKeys.length} route preview caches`);
    
    // Also clear dependent caches
    await streetViewService.clearStreetViewCache();
    await imageAnalysisService.clearAnalysisCache();
  } catch (error) {
    console.error('Error clearing preview caches:', error);
  }
};

/**
 * Generate fallback preview when AI analysis is unavailable
 * @param {Array} routeCoordinates - Route coordinates
 * @returns {Promise<Object>} Basic preview without AI analysis
 */
export const generateFallbackPreview = async (routeCoordinates) => {
  try {
    const sampledPoints = streetViewService.sampleRoutePoints(routeCoordinates, 300);
    const limitedPoints = sampledPoints.slice(0, 5); // Just 5 images

    const images = await streetViewService.fetchStreetViewImages(limitedPoints);
    const availableImages = images.filter((img) => img.available);

    return {
      routeCoordinates,
      sampledPoints: availableImages,
      statistics: {
        overallSafetyScore: 5,
        grade: 'Unknown - Limited Preview',
        color: '#9E9E9E',
        concerns: [],
        positives: ['Street View images available'],
        recommendations: ['Full AI analysis unavailable - manual review recommended'],
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        fallbackMode: true,
        analyzedPoints: availableImages.length,
      },
    };
  } catch (error) {
    console.error('Error generating fallback preview:', error);
    throw error;
  }
};

/**
 * Validate preview data
 * @param {Object} preview - Preview to validate
 * @returns {boolean} True if valid
 */
export const isValidPreview = (preview) => {
  return (
    preview &&
    preview.sampledPoints &&
    preview.sampledPoints.length > 0 &&
    preview.statistics &&
    preview.metadata
  );
};

export default {
  generateRoutePreview,
  getCachedPreview,
  clearAllPreviewCaches,
  generateFallbackPreview,
  isValidPreview,
};
