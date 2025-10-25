/**
 * Image Analysis Service
 * Uses Google Cloud Vision API to analyze street images for safety features
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { GOOGLE_CLOUD_VISION_API_KEY } from '@env';

const VISION_API_URL = 'https://vision.googleapis.com/v1/images:annotate';

// Safety scoring weights
const WEIGHTS = {
  lighting: 0.30,
  sidewalk: 0.20,
  crowdDensity: 0.25,
  isolation: 0.15,
  buildingType: 0.10,
};

// Label categories for safety analysis
const SAFETY_LABELS = {
  positive: [
    'street light',
    'lamp post',
    'sidewalk',
    'footpath',
    'pedestrian',
    'person',
    'people',
    'store',
    'shop',
    'building',
    'urban area',
    'city',
    'commercial building',
    'restaurant',
    'cafe',
    'well lit',
    'pavement',
    'crosswalk',
  ],
  negative: [
    'dark',
    'darkness',
    'forest',
    'wilderness',
    'isolated',
    'abandoned',
    'overgrown',
    'dense vegetation',
    'alley',
    'tunnel',
  ],
  lighting: [
    'street light',
    'lamp post',
    'light',
    'illuminated',
    'bright',
    'daylight',
    'well lit',
  ],
  sidewalk: ['sidewalk', 'footpath', 'pavement', 'walkway', 'pedestrian zone'],
  people: ['person', 'people', 'pedestrian', 'crowd', 'group'],
  commercial: [
    'store',
    'shop',
    'commercial',
    'business',
    'restaurant',
    'cafe',
    'retail',
  ],
};

/**
 * Analyze image brightness from dominant colors
 * @param {Array} colors - Array of color info from Vision API
 * @returns {Object} Brightness analysis
 */
const analyzeBrightness = (colors) => {
  if (!colors || colors.length === 0) {
    return { score: 5, level: 'moderate', confidence: 0 };
  }

  // Calculate weighted average brightness
  let totalBrightness = 0;
  let totalScore = 0;

  colors.forEach((colorInfo) => {
    const { color, score, pixelFraction } = colorInfo;
    const { red = 0, green = 0, blue = 0 } = color;

    // Calculate perceived brightness (weighted RGB)
    const brightness = 0.299 * red + 0.587 * green + 0.114 * blue;

    totalBrightness += brightness * pixelFraction;
    totalScore += pixelFraction;
  });

  const avgBrightness = totalBrightness / (totalScore || 1);

  // Score brightness on 1-10 scale
  let brightnessScore = (avgBrightness / 255) * 10;
  let level = 'poor';

  if (brightnessScore >= 7) {
    level = 'bright';
  } else if (brightnessScore >= 4) {
    level = 'moderate';
  }

  return {
    score: Math.round(brightnessScore * 10) / 10,
    level,
    confidence: totalScore,
    averageBrightness: Math.round(avgBrightness),
  };
};

/**
 * Analyze labels for specific safety features
 * @param {Array} labels - Labels from Vision API
 * @param {Array} keywords - Keywords to search for
 * @returns {Object} Feature analysis
 */
const analyzeFeature = (labels, keywords) => {
  const matches = [];
  let totalConfidence = 0;

  labels.forEach((label) => {
    const description = label.description.toLowerCase();
    const score = label.score;

    if (keywords.some((keyword) => description.includes(keyword.toLowerCase()))) {
      matches.push({
        label: label.description,
        confidence: score,
      });
      totalConfidence += score;
    }
  });

  return {
    detected: matches.length > 0,
    count: matches.length,
    confidence: totalConfidence / (matches.length || 1),
    matches,
  };
};

/**
 * Count people/pedestrians in the image
 * @param {Array} objects - Localized objects from Vision API
 * @param {Array} labels - Labels from Vision API
 * @returns {Object} Crowd density analysis
 */
const analyzeCrowdDensity = (objects, labels) => {
  let personCount = 0;

  // Count from localized objects
  if (objects) {
    objects.forEach((obj) => {
      if (
        obj.name.toLowerCase().includes('person') ||
        obj.name.toLowerCase().includes('pedestrian')
      ) {
        personCount++;
      }
    });
  }

  // Check labels for crowd indicators
  const crowdAnalysis = analyzeFeature(labels, SAFETY_LABELS.people);

  let density = 'low';
  let score = 3;

  if (personCount >= 5 || crowdAnalysis.confidence > 0.7) {
    density = 'high';
    score = 9;
  } else if (personCount >= 2 || crowdAnalysis.confidence > 0.4) {
    density = 'moderate';
    score = 6;
  }

  return {
    personCount,
    density,
    score,
    confidence: crowdAnalysis.confidence,
    indicators: crowdAnalysis.matches,
  };
};

/**
 * Calculate overall safety score from all factors
 * @param {Object} analysis - Complete image analysis
 * @returns {Object} Safety score and grade
 */
const calculateSafetyScore = (analysis) => {
  const {
    lighting,
    sidewalk,
    crowdDensity,
    isolation,
    buildingType,
  } = analysis;

  const weightedScore =
    lighting.score * WEIGHTS.lighting +
    sidewalk.score * WEIGHTS.sidewalk +
    crowdDensity.score * WEIGHTS.crowdDensity +
    isolation.score * WEIGHTS.isolation +
    buildingType.score * WEIGHTS.buildingType;

  let grade = 'Poor';
  let color = '#FF5252'; // Red

  if (weightedScore >= 7.5) {
    grade = 'Excellent';
    color = '#4CAF50'; // Green
  } else if (weightedScore >= 6) {
    grade = 'Good';
    color = '#8BC34A'; // Light Green
  } else if (weightedScore >= 4.5) {
    grade = 'Moderate';
    color = '#FFC107'; // Yellow
  } else if (weightedScore >= 3) {
    grade = 'Fair';
    color = '#FF9800'; // Orange
  }

  return {
    overall: Math.round(weightedScore * 10) / 10,
    grade,
    color,
    breakdown: {
      lighting: lighting.score,
      sidewalk: sidewalk.score,
      crowdDensity: crowdDensity.score,
      isolation: isolation.score,
      buildingType: buildingType.score,
    },
  };
};

/**
 * Analyze image using Google Cloud Vision API
 * @param {string} imageUrl - URL of the image to analyze
 * @returns {Promise<Object>} Analysis results
 */
export const analyzeImage = async (imageUrl) => {
  try {
    // Check cache first
    const cacheKey = `analysis_${imageUrl}`;
    const cached = await AsyncStorage.getItem(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }

    // Prepare Vision API request
    const requestBody = {
      requests: [
        {
          image: {
            source: {
              imageUri: imageUrl,
            },
          },
          features: [
            { type: 'LABEL_DETECTION', maxResults: 20 },
            { type: 'OBJECT_LOCALIZATION', maxResults: 20 },
            { type: 'IMAGE_PROPERTIES' },
          ],
        },
      ],
    };

    const response = await fetch(`${VISION_API_URL}?key=${GOOGLE_CLOUD_VISION_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Vision API error: ${response.status}`);
    }

    const data = await response.json();
    const result = data.responses[0];

    if (result.error) {
      throw new Error(result.error.message);
    }

    // Extract data from response
    const labels = result.labelAnnotations || [];
    const objects = result.localizedObjectAnnotations || [];
    const colors = result.imagePropertiesAnnotation?.dominantColors?.colors || [];

    // Analyze lighting
    const brightnessAnalysis = analyzeBrightness(colors);
    const lightingFeatures = analyzeFeature(labels, SAFETY_LABELS.lighting);
    
    const lightingScore = Math.min(10, (brightnessAnalysis.score + lightingFeatures.confidence * 10) / 2);

    // Analyze sidewalk presence
    const sidewalkAnalysis = analyzeFeature(labels, SAFETY_LABELS.sidewalk);
    const sidewalkScore = sidewalkAnalysis.detected ? 8 : 3;

    // Analyze crowd density
    const crowdAnalysis = analyzeCrowdDensity(objects, labels);

    // Analyze isolation (inverse of positive indicators)
    const isolationFeatures = analyzeFeature(labels, SAFETY_LABELS.negative);
    const isolationScore = isolationFeatures.detected 
      ? Math.max(1, 10 - isolationFeatures.confidence * 10)
      : 7;

    // Analyze building types
    const commercialAnalysis = analyzeFeature(labels, SAFETY_LABELS.commercial);
    const buildingScore = commercialAnalysis.detected 
      ? Math.min(10, 5 + commercialAnalysis.confidence * 5)
      : 5;

    // Compile analysis results
    const analysis = {
      lighting: {
        score: Math.round(lightingScore * 10) / 10,
        level: brightnessAnalysis.level,
        brightness: brightnessAnalysis.averageBrightness,
        features: lightingFeatures.matches,
        confidence: lightingFeatures.confidence,
      },
      sidewalk: {
        score: sidewalkScore,
        detected: sidewalkAnalysis.detected,
        features: sidewalkAnalysis.matches,
        confidence: sidewalkAnalysis.confidence,
      },
      crowdDensity: {
        score: crowdAnalysis.score,
        density: crowdAnalysis.density,
        personCount: crowdAnalysis.personCount,
        confidence: crowdAnalysis.confidence,
      },
      isolation: {
        score: Math.round(isolationScore * 10) / 10,
        isolated: isolationScore < 5,
        concerns: isolationFeatures.matches,
      },
      buildingType: {
        score: Math.round(buildingScore * 10) / 10,
        commercial: commercialAnalysis.detected,
        features: commercialAnalysis.matches,
      },
      rawData: {
        labels: labels.slice(0, 10),
        objects: objects.slice(0, 5),
        dominantColors: colors.slice(0, 3),
      },
    };

    // Calculate overall safety score
    const safetyScore = calculateSafetyScore(analysis);
    analysis.safetyScore = safetyScore;

    // Generate recommendations
    const recommendations = generateRecommendations(analysis);
    analysis.recommendations = recommendations;

    // Cache the result
    await AsyncStorage.setItem(cacheKey, JSON.stringify(analysis));

    return analysis;
  } catch (error) {
    console.error('Error analyzing image:', error);
    return {
      error: error.message,
      safetyScore: {
        overall: 5,
        grade: 'Unknown',
        color: '#9E9E9E',
      },
    };
  }
};

/**
 * Generate safety recommendations based on analysis
 * @param {Object} analysis - Image analysis results
 * @returns {Object} Recommendations
 */
const generateRecommendations = (analysis) => {
  const positives = [];
  const concerns = [];
  const tips = [];

  // Lighting
  if (analysis.lighting.score >= 7) {
    positives.push('Well-lit area with good visibility');
  } else if (analysis.lighting.score < 4) {
    concerns.push('Poor lighting conditions');
    tips.push('Consider using this route during daylight hours');
  }

  // Sidewalk
  if (analysis.sidewalk.detected) {
    positives.push('Sidewalk available for pedestrians');
  } else {
    concerns.push('No clear sidewalk detected');
    tips.push('Walk facing traffic if using roadway');
  }

  // Crowd density
  if (analysis.crowdDensity.density === 'high') {
    positives.push('High foot traffic - well-populated area');
  } else if (analysis.crowdDensity.density === 'low') {
    concerns.push('Low pedestrian activity');
    tips.push('Stay alert and avoid distractions');
  }

  // Isolation
  if (analysis.isolation.isolated) {
    concerns.push('Isolated or secluded area');
    tips.push('Consider walking with a companion');
  }

  // Commercial
  if (analysis.buildingType.commercial) {
    positives.push('Commercial area with businesses nearby');
  }

  return {
    positives,
    concerns,
    tips,
  };
};

/**
 * Batch analyze multiple images
 * @param {Array} imageUrls - Array of image URLs
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<Array>} Array of analysis results
 */
export const batchAnalyzeImages = async (imageUrls, onProgress = null) => {
  const results = [];

  for (let i = 0; i < imageUrls.length; i++) {
    const analysis = await analyzeImage(imageUrls[i]);
    results.push(analysis);

    if (onProgress) {
      onProgress(i + 1, imageUrls.length);
    }

    // Small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  return results;
};

/**
 * Clear analysis cache
 * @returns {Promise<void>}
 */
export const clearAnalysisCache = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const analysisKeys = keys.filter((key) => key.startsWith('analysis_'));
    await AsyncStorage.multiRemove(analysisKeys);
    console.log(`Cleared ${analysisKeys.length} cached analyses`);
  } catch (error) {
    console.error('Error clearing analysis cache:', error);
  }
};

export default {
  analyzeImage,
  batchAnalyzeImages,
  clearAnalysisCache,
  calculateSafetyScore,
};
