/**
 * Route Calculation Service
 * Dedicated service for calculating walking routes using Google Directions API
 * Provides detailed route information with turn-by-turn navigation
 */

import axios from 'axios';
import { GOOGLE_MAPS_API_KEY } from '../config/apiKeys';
import { cacheData, getCachedData } from '../utils/helpers';

const GOOGLE_DIRECTIONS_API = 'https://maps.googleapis.com/maps/api/directions/json';

/**
 * Retry helper with exponential backoff
 */
const retryWithBackoff = async (fn, maxRetries = 2, delay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      console.log(`Retry ${i + 1}/${maxRetries} after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; // Exponential backoff
    }
  }
};

/**
 * Calculate multiple walking routes from origin to destination
 * @param {Object} origin - { latitude, longitude }
 * @param {Object} destination - { latitude, longitude }
 * @param {Object} options - Optional parameters
 * @returns {Promise<Array>} Array of route objects
 */
export const calculateWalkingRoutes = async (origin, destination, options = {}) => {
  try {
    const {
      alternatives = true,  // Request alternative routes
      avoidHighways = false,
      avoidTolls = false,
      avoidFerries = false,
      optimize = false,     // Optimize waypoint order
      departureTime = null, // For transit, in seconds since epoch
    } = options;

    // Validate inputs
    if (!origin?.latitude || !origin?.longitude) {
      throw new Error('Invalid origin coordinates');
    }
    if (!destination?.latitude || !destination?.longitude) {
      throw new Error('Invalid destination coordinates');
    }

    // Validate API key
    if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY === 'undefined' || GOOGLE_MAPS_API_KEY.length < 10) {
      console.log('Invalid or missing Google Maps API key - using fallback');
      return []; // Return empty to trigger fallback
    }

    // Check cache first
    const cacheKey = `walking_route_${origin.latitude},${origin.longitude}_${destination.latitude},${destination.longitude}_${alternatives}`;
    const cached = await getCachedData(cacheKey);
    if (cached) {
      console.log('Returning cached walking routes');
      return cached;
    }

    console.log('Calculating walking routes...');
    console.log('Origin:', `${origin.latitude}, ${origin.longitude}`);
    console.log('Destination:', `${destination.latitude}, ${destination.longitude}`);

    // Build avoid parameter
    const avoid = [];
    if (avoidHighways) avoid.push('highways');
    if (avoidTolls) avoid.push('tolls');
    if (avoidFerries) avoid.push('ferries');

    const params = {
      origin: `${origin.latitude},${origin.longitude}`,
      destination: `${destination.latitude},${destination.longitude}`,
      mode: 'walking',
      alternatives,
      key: GOOGLE_MAPS_API_KEY,
    };

    if (avoid.length > 0) {
      params.avoid = avoid.join('|');
    }

    if (departureTime) {
      params.departure_time = departureTime;
    }

    // Use retry logic with timeout
    const response = await retryWithBackoff(async () => {
      return await axios.get(GOOGLE_DIRECTIONS_API, { 
        params,
        timeout: 15000, // 15 second timeout
        validateStatus: (status) => status < 500, // Don't throw on 4xx errors
      });
    }, 2, 1000); // 2 retries, starting with 1s delay

    console.log('Google Directions API Response Status:', response.data.status);

    if (response.data.status !== 'OK') {
      // Handle specific error cases - but don't throw, return empty array
      console.log('Directions API returned non-OK status:', response.data.status);
      
      if (response.data.status === 'ZERO_RESULTS') {
        console.log('No routes found, will use fallback');
        return []; // Return empty array to trigger fallback
      } else if (response.data.status === 'OVER_QUERY_LIMIT') {
        console.log('API quota exceeded, will use fallback');
        return [];
      } else if (response.data.status === 'REQUEST_DENIED') {
        console.log('API request denied, will use fallback');
        return [];
      } else if (response.data.status === 'INVALID_REQUEST') {
        console.log('Invalid request, will use fallback');
        return [];
      } else {
        console.log('Unknown API error, will use fallback');
        return [];
      }
    }

    const routes = response.data.routes;
    
    if (!routes || routes.length === 0) {
      throw new Error('No routes found');
    }

    // Parse each route with detailed information
    const parsedRoutes = routes.map((route, index) => {
      const leg = route.legs[0]; // For single origin-destination, only one leg

      // Decode and validate coordinates
      const coordinates = decodePolyline(route.overview_polyline.points);
      
      if (coordinates.length === 0) {
        console.warn(`Route ${index} has no valid coordinates`);
      }

      return {
        id: `route_${index}`,
        routeIndex: index,
        summary: route.summary || `Route ${index + 1}`,
        
        // Distance and duration
        distance: {
          value: leg.distance.value,      // meters
          text: leg.distance.text,        // "7.4 km"
          km: (leg.distance.value / 1000).toFixed(2),
        },
        duration: {
          value: leg.duration.value,      // seconds
          text: leg.duration.text,        // "14 mins"
          minutes: Math.round(leg.duration.value / 60),
        },
        
        // Route geometry
        polyline: route.overview_polyline.points,  // Encoded polyline
        coordinates,
        
        // Start and end locations
        startLocation: {
          latitude: leg.start_location.lat,
          longitude: leg.start_location.lng,
        },
        endLocation: {
          latitude: leg.end_location.lat,
          longitude: leg.end_location.lng,
        },
        
        // Start and end addresses
        startAddress: leg.start_address,
        endAddress: leg.end_address,
        
        // Turn-by-turn navigation steps
        steps: leg.steps.map((step, stepIndex) => ({
          stepIndex,
          distance: {
            value: step.distance.value,   // meters
            text: step.distance.text,     // "200 m"
          },
          duration: {
            value: step.duration.value,   // seconds
            text: step.duration.text,     // "2 mins"
          },
          instruction: stripHtmlTags(step.html_instructions),
          htmlInstruction: step.html_instructions,
          maneuver: step.maneuver || 'straight',  // turn-left, turn-right, etc.
          startLocation: {
            latitude: step.start_location.lat,
            longitude: step.start_location.lng,
          },
          endLocation: {
            latitude: step.end_location.lat,
            longitude: step.end_location.lng,
          },
          polyline: step.polyline.points,
          travelMode: step.travel_mode,
        })),
        
        // Map bounds for centering
        bounds: {
          northeast: {
            latitude: route.bounds.northeast.lat,
            longitude: route.bounds.northeast.lng,
          },
          southwest: {
            latitude: route.bounds.southwest.lat,
            longitude: route.bounds.southwest.lng,
          },
        },
        
        // Warnings and copyrights
        warnings: route.warnings || [],
        copyrights: route.copyrights || '',
        
        // Waypoint order (if optimized)
        waypointOrder: route.waypoint_order || [],
        
        // Additional metadata
        metadata: {
          calculatedAt: new Date().toISOString(),
          mode: 'walking',
          apiStatus: response.data.status,
        },
      };
    });

    console.log(`Found ${parsedRoutes.length} walking route(s)`);
    parsedRoutes.forEach((route, index) => {
      console.log(`   Route ${index + 1}: ${route.distance.text}, ${route.duration.text} - ${route.summary}`);
    });

    // Cache for 30 minutes
    await cacheData(cacheKey, parsedRoutes, 0.5);

    return parsedRoutes;

  } catch (error) {
    // Don't throw errors - return empty array to trigger fallback
    console.log('Route calculation exception:', error.code || error.message);
    
    // Log specific error types for debugging
    if (error.code === 'ECONNABORTED') {
      console.log('Request timeout - network too slow');
    } else if (error.code === 'ERR_NETWORK') {
      console.log('Network error - no internet connection');
    } else if (error.response?.status === 403) {
      console.log('API key may be invalid or APIs not enabled');
    }
    
    return [];
  }
};

/**
 * Decode Google Maps encoded polyline to coordinates array
 * @param {String} encoded - Encoded polyline string
 * @returns {Array} Array of {latitude, longitude} objects
 */
export const decodePolyline = (encoded) => {
  if (!encoded || typeof encoded !== 'string') {
    console.warn('Invalid polyline encoding');
    return [];
  }
  
  const poly = [];
  let index = 0, len = encoded.length;
  let lat = 0, lng = 0;

  try {
    while (index < len) {
      let b, shift = 0, result = 0;
      
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20 && index < len);
      
      const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lat += dlat;

      shift = 0;
      result = 0;
      
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20 && index < len);
      
      const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lng += dlng;

      const latitude = lat / 1e5;
      const longitude = lng / 1e5;

      // Validate coordinates before adding
      if (!isNaN(latitude) && !isNaN(longitude) && 
          isFinite(latitude) && isFinite(longitude) &&
          latitude >= -90 && latitude <= 90 &&
          longitude >= -180 && longitude <= 180) {
        poly.push({ latitude, longitude });
      }
    }
  } catch (error) {
    // Silently return empty array on decode error
    return [];
  }

  return poly;
};

/**
 * Strip HTML tags from instruction text
 * @param {String} html - HTML string
 * @returns {String} Plain text
 */
const stripHtmlTags = (html) => {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, '')           // Remove HTML tags
    .replace(/&nbsp;/g, ' ')            // Replace &nbsp;
    .replace(/&amp;/g, '&')             // Replace &amp;
    .replace(/&lt;/g, '<')              // Replace &lt;
    .replace(/&gt;/g, '>')              // Replace &gt;
    .replace(/&quot;/g, '"')            // Replace &quot;
    .trim();
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {Object} coord1 - { latitude, longitude }
 * @param {Object} coord2 - { latitude, longitude }
 * @returns {Number} Distance in meters
 */
export const calculateDistance = (coord1, coord2) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = coord1.latitude * Math.PI / 180;
  const φ2 = coord2.latitude * Math.PI / 180;
  const Δφ = (coord2.latitude - coord1.latitude) * Math.PI / 180;
  const Δλ = (coord2.longitude - coord1.longitude) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

/**
 * Find closest step to current location
 * @param {Object} currentLocation - { latitude, longitude }
 * @param {Array} steps - Array of navigation steps
 * @returns {Object} Closest step with distance
 */
export const findClosestStep = (currentLocation, steps) => {
  if (!steps || steps.length === 0) return null;

  let closestStep = null;
  let minDistance = Infinity;

  steps.forEach((step) => {
    const distance = calculateDistance(currentLocation, step.startLocation);
    if (distance < minDistance) {
      minDistance = distance;
      closestStep = step;
    }
  });

  return {
    step: closestStep,
    distance: minDistance,
  };
};

/**
 * Get next navigation instruction based on current location
 * @param {Object} currentLocation - { latitude, longitude }
 * @param {Array} steps - Array of navigation steps
 * @param {Number} threshold - Distance threshold in meters (default 20m)
 * @returns {Object} Next instruction
 */
export const getNextInstruction = (currentLocation, steps, threshold = 20) => {
  const closest = findClosestStep(currentLocation, steps);
  
  if (!closest) return null;

  const { step, distance } = closest;
  
  return {
    currentStep: step,
    nextStep: steps[step.stepIndex + 1] || null,
    distanceToStep: distance,
    isNearStep: distance <= threshold,
    instruction: step.instruction,
    maneuver: step.maneuver,
    remainingSteps: steps.length - step.stepIndex - 1,
  };
};

/**
 * Format duration to human-readable string
 * @param {Number} seconds - Duration in seconds
 * @returns {String} Formatted duration
 */
export const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes} min${minutes !== 1 ? 's' : ''}`;
};

/**
 * Format distance to human-readable string
 * @param {Number} meters - Distance in meters
 * @returns {String} Formatted distance
 */
export const formatDistance = (meters) => {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${Math.round(meters)} m`;
};

/**
 * Get route instructions from parsed route data
 * @param {Object} routeData - Parsed route data from calculateWalkingRoutes
 * @returns {Array} Array of instruction objects
 */
export const getRouteInstructions = (routeData) => {
  if (!routeData || !routeData.steps) {
    return [];
  }
  
  return routeData.steps.map((step) => ({
    text: step.instruction,
    distance: step.distance.text,
    duration: step.duration.text,
    maneuver: step.maneuver,
  }));
};

// Export all functions
export default {
  calculateWalkingRoutes,
  decodePolyline,
  calculateDistance,
  findClosestStep,
  getNextInstruction,
  formatDuration,
  formatDistance,
  getRouteInstructions,
};
