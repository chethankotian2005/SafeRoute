/**
 * Google Street View Service
 * Handles fetching Street View images at key points along a route
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { GOOGLE_MAPS_API_KEY } from '../config/apiKeys';
const STREET_VIEW_BASE_URL = 'https://maps.googleapis.com/maps/api/streetview';
const STREET_VIEW_METADATA_URL = 'https://maps.googleapis.com/maps/api/streetview/metadata';
const SAMPLING_DISTANCE = 200; // meters between samples
const IMAGE_SIZE = '600x400';
const FOV = 90; // Field of view
const PITCH = 0; // Camera pitch (0 = horizontal)

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {Object} coord1 - {latitude, longitude}
 * @param {Object} coord2 - {latitude, longitude}
 * @returns {number} Distance in meters
 */
const calculateDistance = (coord1, coord2) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (coord1.latitude * Math.PI) / 180;
  const φ2 = (coord2.latitude * Math.PI) / 180;
  const Δφ = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
  const Δλ = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

/**
 * Calculate bearing (heading) from one coordinate to another
 * @param {Object} coord1 - Starting point {latitude, longitude}
 * @param {Object} coord2 - End point {latitude, longitude}
 * @returns {number} Bearing in degrees (0-360)
 */
const calculateBearing = (coord1, coord2) => {
  const φ1 = (coord1.latitude * Math.PI) / 180;
  const φ2 = (coord2.latitude * Math.PI) / 180;
  const Δλ = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

  const θ = Math.atan2(y, x);
  const bearing = ((θ * 180) / Math.PI + 360) % 360;

  return bearing;
};

/**
 * Interpolate a point between two coordinates
 * @param {Object} start - Starting coordinate {latitude, longitude}
 * @param {Object} end - Ending coordinate {latitude, longitude}
 * @param {number} fraction - Fraction of distance (0-1)
 * @returns {Object} Interpolated coordinate
 */
const interpolatePoint = (start, end, fraction) => {
  return {
    latitude: start.latitude + (end.latitude - start.latitude) * fraction,
    longitude: start.longitude + (end.longitude - start.longitude) * fraction,
  };
};

/**
 * Sample key points along a route at regular intervals
 * @param {Array} routeCoordinates - Array of route coordinates
 * @param {number} samplingDistance - Distance between samples in meters
 * @returns {Array} Array of sampled points with metadata
 */
export const sampleRoutePoints = (routeCoordinates, samplingDistance = SAMPLING_DISTANCE) => {
  if (!routeCoordinates || routeCoordinates.length < 2) {
    return [];
  }

  const sampledPoints = [];
  let accumulatedDistance = 0;
  let nextSampleDistance = 0;

  // Always include starting point
  sampledPoints.push({
    coordinate: routeCoordinates[0],
    distanceFromStart: 0,
    index: 0,
    isKeyPoint: true,
    type: 'start',
  });

  for (let i = 0; i < routeCoordinates.length - 1; i++) {
    const segmentStart = routeCoordinates[i];
    const segmentEnd = routeCoordinates[i + 1];
    const segmentDistance = calculateDistance(segmentStart, segmentEnd);

    // Check if we need to sample points in this segment
    while (accumulatedDistance + segmentDistance >= nextSampleDistance + samplingDistance) {
      nextSampleDistance += samplingDistance;
      const distanceIntoSegment = nextSampleDistance - accumulatedDistance;
      const fraction = distanceIntoSegment / segmentDistance;

      const sampledPoint = interpolatePoint(segmentStart, segmentEnd, fraction);
      const heading = calculateBearing(segmentStart, segmentEnd);

      sampledPoints.push({
        coordinate: sampledPoint,
        distanceFromStart: nextSampleDistance,
        heading: Math.round(heading),
        index: sampledPoints.length,
        isKeyPoint: false,
        type: 'sample',
      });
    }

    accumulatedDistance += segmentDistance;
  }

  // Always include destination
  const totalDistance = accumulatedDistance;
  const lastPoint = routeCoordinates[routeCoordinates.length - 1];
  const secondToLast = routeCoordinates[routeCoordinates.length - 2];
  const finalHeading = calculateBearing(secondToLast, lastPoint);

  sampledPoints.push({
    coordinate: lastPoint,
    distanceFromStart: totalDistance,
    heading: Math.round(finalHeading),
    index: sampledPoints.length,
    isKeyPoint: true,
    type: 'destination',
  });

  return sampledPoints;
};

/**
 * Check if Street View imagery is available at a location
 * @param {Object} coordinate - {latitude, longitude}
 * @returns {Promise<Object>} Metadata about Street View availability
 */
export const checkStreetViewAvailability = async (coordinate) => {
  try {
    const url = `${STREET_VIEW_METADATA_URL}?location=${coordinate.latitude},${coordinate.longitude}&key=${GOOGLE_MAPS_API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();

    return {
      available: data.status === 'OK',
      location: data.location,
      panoId: data.pano_id,
      date: data.date,
      status: data.status,
    };
  } catch (error) {
    console.error('Error checking Street View availability:', error);
    return {
      available: false,
      error: error.message,
    };
  }
};

/**
 * Generate Street View image URL
 * @param {Object} params - Image parameters
 * @returns {string} Street View Static API URL
 */
export const generateStreetViewUrl = ({
  latitude,
  longitude,
  heading = 0,
  size = IMAGE_SIZE,
  fov = FOV,
  pitch = PITCH,
}) => {
  return `${STREET_VIEW_BASE_URL}?size=${size}&location=${latitude},${longitude}&heading=${heading}&pitch=${pitch}&fov=${fov}&key=${GOOGLE_MAPS_API_KEY}`;
};

/**
 * Fetch Street View images for sampled route points
 * @param {Array} sampledPoints - Array of sampled route points
 * @param {Function} onProgress - Progress callback (current, total)
 * @returns {Promise<Array>} Array of image data with URLs
 */
export const fetchStreetViewImages = async (sampledPoints, onProgress = null) => {
  const images = [];
  const cacheKey = 'streetview_cache';

  // Load cache
  let cache = {};
  try {
    const cachedData = await AsyncStorage.getItem(cacheKey);
    if (cachedData) {
      cache = JSON.parse(cachedData);
    }
  } catch (error) {
    console.error('Error loading Street View cache:', error);
  }

  for (let i = 0; i < sampledPoints.length; i++) {
    const point = sampledPoints[i];
    const { coordinate, heading, distanceFromStart, type, isKeyPoint } = point;

    // Check cache first
    const pointCacheKey = `${coordinate.latitude.toFixed(6)},${coordinate.longitude.toFixed(6)},${heading}`;
    
    if (cache[pointCacheKey]) {
      images.push({
        ...cache[pointCacheKey],
        index: i,
      });
      
      if (onProgress) {
        onProgress(i + 1, sampledPoints.length);
      }
      continue;
    }

    // Check availability
    const availability = await checkStreetViewAvailability(coordinate);

    if (!availability.available) {
      console.warn(`Street View not available at point ${i}:`, coordinate);
      images.push({
        index: i,
        coordinate,
        distanceFromStart,
        type,
        isKeyPoint,
        available: false,
        url: null,
      });
      
      if (onProgress) {
        onProgress(i + 1, sampledPoints.length);
      }
      continue;
    }

    // Generate image URL
    const url = generateStreetViewUrl({
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
      heading: heading || 0,
    });

    const imageData = {
      index: i,
      coordinate,
      distanceFromStart,
      heading: heading || 0,
      type,
      isKeyPoint,
      available: true,
      url,
      panoId: availability.panoId,
      captureDate: availability.date,
      actualLocation: availability.location,
    };

    images.push(imageData);

    // Cache the result
    cache[pointCacheKey] = imageData;

    if (onProgress) {
      onProgress(i + 1, sampledPoints.length);
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Save updated cache
  try {
    await AsyncStorage.setItem(cacheKey, JSON.stringify(cache));
  } catch (error) {
    console.error('Error saving Street View cache:', error);
  }

  return images;
};

/**
 * Calculate optimal heading for points without explicit heading
 * @param {Array} routeCoordinates - Full route coordinates
 * @param {Object} point - Point to calculate heading for
 * @param {number} lookAheadDistance - Distance to look ahead in meters
 * @returns {number} Calculated heading in degrees
 */
export const calculateOptimalHeading = (routeCoordinates, point, lookAheadDistance = 50) => {
  const { coordinate } = point;
  
  // Find nearest point in route
  let nearestIndex = 0;
  let minDistance = Infinity;
  
  for (let i = 0; i < routeCoordinates.length; i++) {
    const distance = calculateDistance(coordinate, routeCoordinates[i]);
    if (distance < minDistance) {
      minDistance = distance;
      nearestIndex = i;
    }
  }

  // Look ahead to find direction
  if (nearestIndex < routeCoordinates.length - 1) {
    return calculateBearing(
      routeCoordinates[nearestIndex],
      routeCoordinates[nearestIndex + 1]
    );
  }

  // If at end, use previous direction
  if (nearestIndex > 0) {
    return calculateBearing(
      routeCoordinates[nearestIndex - 1],
      routeCoordinates[nearestIndex]
    );
  }

  return 0;
};

/**
 * Clear Street View cache
 * @returns {Promise<void>}
 */
export const clearStreetViewCache = async () => {
  try {
    await AsyncStorage.removeItem('streetview_cache');
    console.log('Street View cache cleared');
  } catch (error) {
    console.error('Error clearing Street View cache:', error);
  }
};

/**
 * Get cached image count
 * @returns {Promise<number>} Number of cached images
 */
export const getCachedImageCount = async () => {
  try {
    const cachedData = await AsyncStorage.getItem('streetview_cache');
    if (cachedData) {
      const cache = JSON.parse(cachedData);
      return Object.keys(cache).length;
    }
  } catch (error) {
    console.error('Error getting cache count:', error);
  }
  return 0;
};

export default {
  sampleRoutePoints,
  checkStreetViewAvailability,
  generateStreetViewUrl,
  fetchStreetViewImages,
  calculateOptimalHeading,
  clearStreetViewCache,
  getCachedImageCount,
};
