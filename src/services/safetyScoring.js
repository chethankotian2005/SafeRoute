/**
 * Safety Scoring Service
 * Calculates safety scores for routes based on multiple factors
 */

import axios from 'axios';
import { GOOGLE_CLOUD_VISION_API_KEY } from '../config/apiKeys';
import {
  SAFETY_WEIGHTS,
  TIME_CONFIG,
  SAFETY_SCORE,
  SAFE_SPOT_CONFIG,
} from '../utils/constants';
import { calculateDistance, getCurrentHour, isNightTime } from '../utils/helpers';
import { getNearbySafeSpots, getStreetViewImage, getStreetViewMetadata } from './googleMapsService';
import { getCommunityReportsNearLocation } from './firebaseService';

/**
 * Main function to calculate safety score for a route
 * @param {Object} routeData - Route data with coordinates
 * @param {Array} communityReports - Community reports near the route
 * @returns {Object} - { score, breakdown, factors }
 */
export const calculateSafetyScore = async (routeData, communityReports = []) => {
  try {
    let totalScore = SAFETY_SCORE.BASE;
    const breakdown = {};

    // 1. Street Lighting Analysis (30% weight)
    const lightingScore = await analyzeLighting(routeData.coordinates);
    breakdown.lighting = lightingScore;
    totalScore += lightingScore * SAFETY_WEIGHTS.STREET_LIGHTING;

    // 2. Foot Traffic Density (25% weight)
    const footTrafficScore = await analyzeFootTraffic(routeData.coordinates);
    breakdown.footTraffic = footTrafficScore;
    totalScore += footTrafficScore * SAFETY_WEIGHTS.FOOT_TRAFFIC;

    // 3. Time of Day Factor (20% weight)
    const timeScore = calculateTimeOfDayScore();
    breakdown.timeOfDay = timeScore;
    totalScore += timeScore * SAFETY_WEIGHTS.TIME_OF_DAY;

    // 4. Safe Spot Proximity (15% weight)
    const safeSpotScore = await calculateSafeSpotProximity(routeData.coordinates);
    breakdown.safeSpots = safeSpotScore;
    totalScore += safeSpotScore * SAFETY_WEIGHTS.SAFE_SPOT_PROXIMITY;

    // 5. Community Reports (10% weight)
    const communityScore = analyzeCommunityReports(communityReports, routeData.coordinates);
    breakdown.community = communityScore;
    totalScore += communityScore * SAFETY_WEIGHTS.COMMUNITY_REPORTS;

    // Clamp score between 1 and 10
    const finalScore = Math.max(SAFETY_SCORE.MIN, Math.min(SAFETY_SCORE.MAX, Math.round(totalScore)));

    return {
      score: finalScore,
      breakdown,
      factors: generateFactorDescriptions(breakdown, finalScore),
      isNight: isNightTime(),
      calculatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error calculating safety score:', error);
    // Return default moderate score on error
    return {
      score: SAFETY_SCORE.BASE,
      breakdown: {},
      factors: ['Unable to calculate detailed score'],
      isNight: isNightTime(),
      calculatedAt: new Date().toISOString(),
    };
  }
};

/**
 * Analyze street lighting quality from Street View images
 * Uses Google Cloud Vision API to detect lighting conditions
 * @returns {number} Score from -3 to +3
 */
export const analyzeLighting = async (coordinates) => {
  try {
    if (!coordinates || coordinates.length === 0) return 0;

    // Sample points along the route (every 100 meters or so)
    const samplePoints = sampleRoutePoints(coordinates, 5);
    let totalLightingScore = 0;
    let analyzedPoints = 0;

    for (const point of samplePoints) {
      try {
        // Check if Street View is available
        const metadata = await getStreetViewMetadata(point.latitude, point.longitude);
        
        if (metadata.available) {
          // Get Street View image
          const imageUrl = await getStreetViewImage(point.latitude, point.longitude);
          
          // Analyze lighting using Cloud Vision API
          const lightingQuality = await analyzeImageLighting(imageUrl);
          totalLightingScore += lightingQuality;
          analyzedPoints++;
        }
      } catch (error) {
        console.error('Error analyzing point:', error);
        // Continue with other points
      }
    }

    if (analyzedPoints === 0) {
      // No street view data available, return neutral score
      return 0;
    }

    // Average lighting score across all analyzed points
    return totalLightingScore / analyzedPoints;
  } catch (error) {
    console.error('Error in lighting analysis:', error);
    return 0;
  }
};

/**
 * Analyze image lighting using Google Cloud Vision API
 * @param {string} imageUrl - URL of the Street View image
 * @returns {number} Lighting score from -3 to +3
 */
const analyzeImageLighting = async (imageUrl) => {
  try {
    // Note: Cloud Vision API requires base64 encoding
    // For React Native, we'll use a simpler approach - just pass the URL
    // This is a simplified version - in production, you'd use expo-file-system or react-native-fs
    
    // Since Buffer doesn't exist in React Native, we'll skip image analysis for now
    // and use a heuristic based on time of day instead
    console.warn('Image lighting analysis skipped - using time-based heuristic');
    
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 20) {
      return 2; // Daytime - assume good lighting
    } else {
      return -1; // Nighttime - assume poor lighting
    }
    
    /* Original implementation - requires Buffer which isn't available in React Native
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const base64Image = Buffer.from(response.data, 'binary').toString('base64');
    */

    // Call Cloud Vision API
    const visionResponse = await axios.post(
      `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_CLOUD_VISION_API_KEY}`,
      {
        requests: [
          {
            image: { content: base64Image },
            features: [
              { type: 'IMAGE_PROPERTIES' },
              { type: 'LABEL_DETECTION', maxResults: 10 },
            ],
          },
        ],
      }
    );

    const result = visionResponse.data.responses[0];
    
    // Analyze image properties for brightness
    const imageProps = result.imagePropertiesAnnotation;
    const labels = result.labelAnnotations || [];

    let lightingScore = 0;

    // Check dominant colors for brightness
    if (imageProps && imageProps.dominantColors) {
      const avgBrightness = calculateAverageBrightness(imageProps.dominantColors.colors);
      if (avgBrightness > 150) lightingScore += 2; // Well-lit
      else if (avgBrightness > 100) lightingScore += 1; // Moderately lit
      else if (avgBrightness < 50) lightingScore -= 2; // Poorly lit
      else lightingScore -= 1; // Dim
    }

    // Check labels for lighting-related keywords
    const lightingLabels = ['street light', 'lamp', 'illuminated', 'bright', 'well-lit'];
    const darkLabels = ['dark', 'shadow', 'night', 'dim'];

    labels.forEach((label) => {
      if (lightingLabels.some((l) => label.description.toLowerCase().includes(l))) {
        lightingScore += 1;
      }
      if (darkLabels.some((l) => label.description.toLowerCase().includes(l))) {
        lightingScore -= 1;
      }
    });

    // Clamp between -3 and +3
    return Math.max(-3, Math.min(3, lightingScore));
  } catch (error) {
    console.error('Error analyzing image lighting:', error);
    return 0;
  }
};

/**
 * Calculate average brightness from dominant colors
 */
const calculateAverageBrightness = (colors) => {
  let totalBrightness = 0;
  let totalPixelFraction = 0;

  colors.forEach((colorInfo) => {
    const color = colorInfo.color;
    const brightness = (color.red + color.green + color.blue) / 3;
    const pixelFraction = colorInfo.pixelFraction || 0;
    
    totalBrightness += brightness * pixelFraction;
    totalPixelFraction += pixelFraction;
  });

  return totalPixelFraction > 0 ? totalBrightness / totalPixelFraction : 0;
};

/**
 * Analyze foot traffic density using Google Places API data
 * @returns {number} Score from -2 to +2
 */
export const analyzeFootTraffic = async (coordinates) => {
  try {
    if (!coordinates || coordinates.length === 0) return 0;

    const midpoint = coordinates[Math.floor(coordinates.length / 2)];
    
    // This is a simplified implementation
    // In production, you'd use Google Places API's popular times data
    // or custom crowd-sourced data
    
    const currentHour = getCurrentHour();
    const isNight = isNightTime();

    // Basic heuristic based on time of day
    if (isNight) {
      return -1; // Less foot traffic at night is concerning
    } else if (currentHour >= 9 && currentHour <= 18) {
      return 2; // High foot traffic during business hours is safer
    } else {
      return 0; // Moderate traffic
    }
  } catch (error) {
    console.error('Error analyzing foot traffic:', error);
    return 0;
  }
};

/**
 * Calculate time of day score
 * @returns {number} Score adjustment based on time
 */
export const calculateTimeOfDayScore = () => {
  const hour = getCurrentHour();
  
  // Daytime (6 AM to 8 PM) gets bonus
  if (hour >= TIME_CONFIG.DAY_START && hour < TIME_CONFIG.DAY_END) {
    return TIME_CONFIG.DAY_BONUS;
  }
  
  // Nighttime gets penalty
  return TIME_CONFIG.NIGHT_PENALTY;
};

/**
 * Calculate proximity to safe spots (hospitals, police stations)
 * @returns {number} Score from 0 to +2
 */
export const calculateSafeSpotProximity = async (coordinates) => {
  try {
    if (!coordinates || coordinates.length === 0) return 0;

    const samplePoints = sampleRoutePoints(coordinates, 3);
    let safeSpotCount = 0;

    for (const point of samplePoints) {
      const safeSpots = await getNearbySafeSpots(
        point,
        SAFE_SPOT_CONFIG.SEARCH_RADIUS
      );
      safeSpotCount += safeSpots.length;
    }

    // More safe spots = better score
    if (safeSpotCount >= 10) return 2;
    if (safeSpotCount >= 5) return 1.5;
    if (safeSpotCount >= 2) return 1;
    if (safeSpotCount >= 1) return 0.5;
    return 0;
  } catch (error) {
    console.error('Error calculating safe spot proximity:', error);
    return 0;
  }
};

/**
 * Analyze community reports impact on safety
 * @returns {number} Score from -3 to 0
 */
export const analyzeCommunityReports = (reports, routeCoordinates) => {
  if (!reports || reports.length === 0) return 0;

  let score = 0;
  const recentThreshold = Date.now() - 7 * 24 * 60 * 60 * 1000; // 7 days

  reports.forEach((report) => {
    // Only consider recent reports
    const reportTime = report.timestamp?.toMillis?.() || Date.now();
    if (reportTime < recentThreshold) return;

    // Check if report is near the route
    const isNearRoute = routeCoordinates.some((coord) =>
      calculateDistance(coord, report.location) < 200 // Within 200 meters
    );

    if (isNearRoute) {
      // Penalize based on severity
      switch (report.severity) {
        case 'critical':
          score -= 1.5;
          break;
        case 'high':
          score -= 1;
          break;
        case 'medium':
          score -= 0.5;
          break;
        case 'low':
          score -= 0.25;
          break;
      }
    }
  });

  // Clamp between -3 and 0
  return Math.max(-3, score);
};

/**
 * Sample points along a route for analysis
 */
const sampleRoutePoints = (coordinates, numSamples) => {
  if (!coordinates || coordinates.length === 0) return [];
  if (coordinates.length <= numSamples) return coordinates;

  const samples = [];
  const interval = Math.floor(coordinates.length / numSamples);

  for (let i = 0; i < numSamples; i++) {
    const index = Math.min(i * interval, coordinates.length - 1);
    samples.push(coordinates[index]);
  }

  return samples;
};

/**
 * Generate human-readable factor descriptions
 */
const generateFactorDescriptions = (breakdown, finalScore) => {
  const factors = [];

  if (breakdown.lighting > 0.5) {
    factors.push('Well-lit streets');
  } else if (breakdown.lighting < -0.5) {
    factors.push('Poor street lighting');
  }

  if (breakdown.timeOfDay > 0) {
    factors.push('Daytime travel');
  } else {
    factors.push('Nighttime caution advised');
  }

  if (breakdown.safeSpots > 1) {
    factors.push('Multiple safe spots nearby');
  } else if (breakdown.safeSpots > 0) {
    factors.push('Some safe spots available');
  }

  if (breakdown.community < -1) {
    factors.push('Recent safety concerns reported');
  }

  if (finalScore >= SAFETY_SCORE.EXCELLENT) {
    factors.push('Highly recommended route');
  } else if (finalScore <= SAFETY_SCORE.POOR) {
    factors.push('Consider alternative route');
  }

  return factors.length > 0 ? factors : ['Standard safety level'];
};

/**
 * Compare multiple routes and rank by safety
 */
export const rankRoutesBySafety = async (routes, communityReports) => {
  const scoredRoutes = [];

  for (const route of routes) {
    const safetyData = await calculateSafetyScore(route, communityReports);
    scoredRoutes.push({
      ...route,
      safetyScore: safetyData.score,
      safetyBreakdown: safetyData.breakdown,
      safetyFactors: safetyData.factors,
    });
  }

  // Sort by safety score (highest first)
  return scoredRoutes.sort((a, b) => b.safetyScore - a.safetyScore);
};

export default {
  calculateSafetyScore,
  analyzeLighting,
  analyzeFootTraffic,
  calculateTimeOfDayScore,
  calculateSafeSpotProximity,
  analyzeCommunityReports,
  rankRoutesBySafety,
};
