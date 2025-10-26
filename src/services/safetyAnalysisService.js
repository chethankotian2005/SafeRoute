/**
 * AI Safety Analysis Service
 * Analyzes routes for safety using multiple data sources
 * Uses Street View API + Cloud Vision API for lighting analysis
 */

import axios from 'axios';
import { GOOGLE_MAPS_API_KEY, GOOGLE_CLOUD_VISION_API_KEY } from '../config/apiKeys';
import { realtimeDb } from '../config/firebaseConfig';
import { ref, query, orderByChild, equalTo, get } from 'firebase/database';

/**
 * Comprehensive safety analysis for a route
 * @param {Array} coordinates - Array of {latitude, longitude} points
 * @param {string} routeType - 'route1', 'route2', or 'route3'
 * @returns {Object} Safety analysis with score and factors
 */
export const analyzeRouteSafety = async (coordinates, routeType) => {
  // Validate input
  if (!coordinates || !Array.isArray(coordinates) || coordinates.length === 0) {
    return getDefaultAnalysis();
  }

  // Filter out any null or invalid coordinates
  const validCoords = coordinates.filter(c => 
    c && 
    typeof c.latitude === 'number' && 
    typeof c.longitude === 'number' &&
    !isNaN(c.latitude) && 
    !isNaN(c.longitude)
  );

  if (validCoords.length === 0) {
    return getDefaultAnalysis();
  }

  try {
    const analysis = {
      overallScore: 7,
      lightingScore: 7,
      trafficScore: 7,
      safeSpotScore: 7,
      communityScore: 7,
      crimeScore: 7,
      factors: [],
      alerts: [],
    };

    // Apply slight variation based on route to differentiate them
    // This ensures each route gets slightly different analysis
    let routeVariation = 0;
    if (routeType === 'route1') {
      routeVariation = 0; // Baseline
    } else if (routeType === 'route2') {
      routeVariation = -0.3; // Slightly different
    } else if (routeType === 'route3') {
      routeVariation = -0.6; // More different
    }

    // 1. Analyze lighting along route (Google Places API + Time-based)
    const lightingAnalysis = await analyzeLighting(coordinates, routeType);
    analysis.lightingScore = Math.min(10, Math.max(1, lightingAnalysis.score + routeVariation));
    analysis.factors.push(lightingAnalysis.description);
    
    // Add street light count to analysis if available
    if (lightingAnalysis.streetLightsFound > 0) {
      analysis.streetLights = lightingAnalysis.streetLightsFound;
      analysis.lightingQuality = lightingAnalysis.quality;
    }

    // 2. Analyze foot traffic density (Google Places API + Time-based)
    const trafficAnalysis = await analyzeFootTraffic(coordinates, routeType);
    analysis.trafficScore = Math.min(10, Math.max(1, trafficAnalysis.score + routeVariation));
    analysis.factors.push(trafficAnalysis.description);
    
    // Add establishment count to analysis if available
    if (trafficAnalysis.establishmentsFound > 0) {
      analysis.establishments = trafficAnalysis.establishmentsFound;
      analysis.trafficDensity = trafficAnalysis.density;
    }

    // 3. Check for safe spots (hospitals, police stations, public places)
    const safeSpotAnalysis = await analyzeSafeSpots(coordinates, routeType);
    analysis.safeSpotScore = Math.min(10, Math.max(1, safeSpotAnalysis.score + routeVariation));
    analysis.factors.push(safeSpotAnalysis.description);
    
    // 4. Check community reports (from Firebase)
    const communityAnalysis = await analyzeCommunityReports(coordinates);
    analysis.communityScore = communityAnalysis.score;
    analysis.factors.push(communityAnalysis.description);
    if (communityAnalysis.alerts.length > 0) {
      analysis.alerts.push(...communityAnalysis.alerts);
    }

    // 5. Analyze crime data (historical)
    const crimeAnalysis = analyzeCrimeData(coordinates, routeType);
    analysis.crimeScore = crimeAnalysis.score;
    analysis.factors.push(crimeAnalysis.description);

    // Calculate weighted overall score
    analysis.overallScore = calculateOverallScore({
      lighting: analysis.lightingScore,
      traffic: analysis.trafficScore,
      safeSpots: analysis.safeSpotScore,
      community: analysis.communityScore,
      crime: analysis.crimeScore,
    });

    return analysis;
  } catch (error) {
    console.error('Error analyzing route safety:', error);
    return getDefaultAnalysis();
  }
};

/**
 * Analyze lighting conditions using Street View API + Cloud Vision API
 * Uses AI image analysis to detect actual lighting conditions
 */
const analyzeLighting = async (coordinates, routeType = 'route1') => {
  try {
    const hour = new Date().getHours();
    const isDaytime = hour >= 6 && hour < 18;
    const isEvening = hour >= 18 && hour < 22;
    const isNight = hour >= 22 || hour < 6;

    // During daytime, excellent visibility
    if (isDaytime) {
      return {
        score: 10,
        description: 'Excellent visibility - Daytime',
        streetLightsFound: 0,
        timeBasedScore: true,
        method: 'time-based',
      };
    }

    // Sample key points along the route for Street View analysis
    const samplePoints = sampleRoutePoints(coordinates, Math.min(3, Math.ceil(coordinates.length / 4)));
    
    if (samplePoints.length === 0) {
      return getDefaultLightingAnalysis(isEvening, isNight, routeType);
    }

    // Analyze lighting using Street View + Cloud Vision
    const lightingResults = await Promise.all(
      samplePoints.map(point => analyzeStreetViewLighting(point))
    );

    // Filter out failed analyses
    const validResults = lightingResults.filter(r => r && r.success);

    if (validResults.length === 0) {
      // Silently fall back to time-based analysis
      return getDefaultLightingAnalysis(isEvening, isNight, routeType);
    }

    // Calculate average lighting score from AI analysis
    const avgBrightness = validResults.reduce((sum, r) => sum + (r.brightness || 0), 0) / validResults.length;
    const avgLightSources = validResults.reduce((sum, r) => sum + (r.lightSources || 0), 0) / validResults.length;
    const streetLightsDetected = validResults.reduce((sum, r) => sum + (r.streetLights || 0), 0);

    // Calculate infrastructure score based on AI analysis
    let infrastructureScore;
    let lightingQuality;

    if (avgBrightness >= 0.7 || avgLightSources >= 3) {
      infrastructureScore = 9;
      lightingQuality = 'well-lit';
    } else if (avgBrightness >= 0.5 || avgLightSources >= 2) {
      infrastructureScore = 7;
      lightingQuality = 'moderately lit';
    } else if (avgBrightness >= 0.3 || avgLightSources >= 1) {
      infrastructureScore = 5;
      lightingQuality = 'limited lighting';
    } else {
      infrastructureScore = 3;
      lightingQuality = 'poorly lit';
    }

    // Time-based adjustment
    const timeAdjustment = isEvening ? 0.5 : (isNight ? -0.5 : 0);

    // Route variation
    const routeVariation = routeType === 'route1' ? 0 : 
                          routeType === 'route2' ? -0.2 : -0.4;

    const finalScore = Math.min(10, Math.max(1, infrastructureScore + timeAdjustment + routeVariation));

    const timeOfDay = isEvening ? 'Evening' : 'Night';
    const description = `${lightingQuality.charAt(0).toUpperCase() + lightingQuality.slice(1)} - ${timeOfDay}`;

    return {
      score: finalScore,
      description,
      streetLightsFound: streetLightsDetected,
      avgBrightness: Math.round(avgBrightness * 100) / 100,
      quality: lightingQuality,
      timeBasedScore: false,
      method: 'ai-vision',
      analyzedPoints: validResults.length,
    };

  } catch (error) {
    console.error('Lighting analysis error:', error.message);
    const hour = new Date().getHours();
    const isEvening = hour >= 18 && hour < 22;
    const isNight = hour >= 22 || hour < 6;
    return getDefaultLightingAnalysis(isEvening, isNight, routeType);
  }
};

/**
 * Analyze Street View image for lighting using Cloud Vision API
 */
const analyzeStreetViewLighting = async (point) => {
  try {
    // Validate point
    if (!point || !point.latitude || !point.longitude || 
        isNaN(point.latitude) || isNaN(point.longitude)) {
      return { success: false };
    }

    // Get Street View metadata first to check availability
    const metadataUrl = `https://maps.googleapis.com/maps/api/streetview/metadata?location=${point.latitude},${point.longitude}&key=${GOOGLE_MAPS_API_KEY}`;
    
    const metadataResponse = await axios.get(metadataUrl, { timeout: 5000 });
    
    if (metadataResponse.data.status !== 'OK') {
      return { success: false };
    }

    // Get Street View image
    const imageUrl = `https://maps.googleapis.com/maps/api/streetview?size=640x640&location=${point.latitude},${point.longitude}&fov=90&pitch=0&key=${GOOGLE_MAPS_API_KEY}`;

    // Analyze image with Cloud Vision API
    const visionResponse = await axios.post(
      `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_CLOUD_VISION_API_KEY}`,
      {
        requests: [{
          image: { source: { imageUri: imageUrl } },
          features: [
            { type: 'LABEL_DETECTION', maxResults: 20 },
            { type: 'IMAGE_PROPERTIES' },
            { type: 'OBJECT_LOCALIZATION', maxResults: 20 }
          ]
        }]
      },
      { timeout: 10000 }
    );

    const result = visionResponse.data.responses[0];
    
    if (!result || result.error) {
      return { success: false };
    }

    // Extract lighting information
    const labels = (result.labelAnnotations || []).map(l => l.description.toLowerCase());
    const objects = (result.localizedObjectAnnotations || []).map(o => o.name.toLowerCase());
    const imageProps = result.imagePropertiesAnnotation;

    // Detect street lights and light sources
    const lightingKeywords = ['street light', 'lamp', 'light', 'lighting', 'illuminated', 'lamp post', 'streetlamp'];
    const streetLights = [...labels, ...objects].filter(item => 
      lightingKeywords.some(keyword => item.includes(keyword))
    ).length;

    // Calculate brightness from image properties
    let brightness = 0.5; // Default mid-range
    if (imageProps && imageProps.dominantColors && imageProps.dominantColors.colors) {
      const colors = imageProps.dominantColors.colors;
      const avgPixelBrightness = colors.reduce((sum, color) => {
        const rgb = color.color;
        const luminance = (0.299 * (rgb.red || 0) + 0.587 * (rgb.green || 0) + 0.114 * (rgb.blue || 0)) / 255;
        return sum + luminance * (color.pixelFraction || 0);
      }, 0);
      brightness = avgPixelBrightness;
    }

    // Count distinct light sources
    const lightSources = Math.min(streetLights, 5); // Cap at 5 for scoring

    return {
      success: true,
      brightness,
      lightSources,
      streetLights,
      location: point,
    };

  } catch (error) {
    // Silently fail and use fallback
    return { success: false };
  }
};

/**
 * Get default lighting analysis based on time
 */
const getDefaultLightingAnalysis = (isEvening, isNight, routeType) => {
  let baseScore, description;
  
  if (isEvening) {
    baseScore = 7;
    description = 'Moderate lighting - Evening hours';
  } else if (isNight) {
    baseScore = 5;
    description = 'Limited visibility - Night time';
  } else {
    baseScore = 9;
    description = 'Good visibility - Dawn/Dusk';
  }

  // Apply route variation
  const routeVariation = routeType === 'route1' ? 0 : 
                        routeType === 'route2' ? -0.3 : -0.6;
  
  return {
    score: Math.min(10, Math.max(1, baseScore + routeVariation)),
    description,
    streetLightsFound: 0,
    timeBasedScore: true,
    method: 'time-fallback',
  };
};

/**
 * DEPRECATED - Old street lights check function (kept for reference)
 * Check street lights at a specific point using Google Places API
 */
const checkStreetLightsAtPoint = async (point) => {
  // Add null check
  if (!point || !point.latitude || !point.longitude) {
    return {
      location: point,
      count: 0,
      lights: [],
    };
  }

  try {
    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/place/nearbysearch/json',
      {
        params: {
          location: `${point.latitude},${point.longitude}`,
          radius: 100, // 100 meter radius
          keyword: 'street light lamp post lighting',
          key: GOOGLE_MAPS_API_KEY,
        },
        timeout: 5000, // 5 second timeout
      }
    );

    const results = response.data.results || [];
    
    return {
      location: point,
      count: results.length,
      lights: results.slice(0, 3), // Keep first 3 for reference
    };

  } catch (error) {
    // Return 0 on error, will use fallback
    return {
      location: point,
      count: 0,
      lights: [],
    };
  }
};

/**
 * Sample points along route for analysis
 * @param {Array} coordinates - Route coordinates
 * @param {Number} maxPoints - Maximum number of points to sample
 */
const sampleRoutePoints = (coordinates, maxPoints = 5) => {
  if (!coordinates || coordinates.length === 0) return [];
  
  // Filter out any null or invalid coordinates
  const validCoordinates = coordinates.filter(c => 
    c && 
    typeof c.latitude === 'number' && 
    typeof c.longitude === 'number' &&
    !isNaN(c.latitude) && 
    !isNaN(c.longitude)
  );

  if (validCoordinates.length === 0) return [];
  
  const samples = [];
  const step = Math.max(1, Math.floor(validCoordinates.length / maxPoints));

  // Always include start point
  samples.push(validCoordinates[0]);

  // Sample intermediate points
  for (let i = step; i < validCoordinates.length - step; i += step) {
    if (samples.length < maxPoints - 1) {
      samples.push(validCoordinates[i]);
    }
  }

  // Always include end point
  if (validCoordinates.length > 1) {
    samples.push(validCoordinates[validCoordinates.length - 1]);
  }

  return samples;
};

/**
 * Analyze foot traffic density using Google Places API + Time-based analysis
 * Combines real establishment data with time of day for accurate scoring
 */
const analyzeFootTraffic = async (coordinates, routeType) => {
  try {
    const hour = new Date().getHours();
    const isPeakHours = (hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 19);
    const isBusinessHours = hour >= 9 && hour <= 21;
    const isLateNight = hour >= 22 || hour < 6;

    // Sample points safely
    const samplePoints = sampleRoutePoints(coordinates, Math.min(5, Math.ceil(coordinates.length / 3)));
    
    if (samplePoints.length === 0) {
      return getDefaultTrafficAnalysis(hour, routeType);
    }

    // Check establishments at each sample point
    const trafficChecks = await Promise.all(
      samplePoints.map(point => checkEstablishmentsAtPoint(point))
    );

    // Calculate average establishment density
    const totalEstablishments = trafficChecks.reduce((sum, check) => sum + check.count, 0);
    const avgEstablishmentsPerPoint = totalEstablishments / samplePoints.length;

    // Calculate base score from establishment density
    let densityScore;
    let trafficDensity;
    let activityLevel;

    if (avgEstablishmentsPerPoint >= 10) {
      densityScore = 9;
      trafficDensity = 'high';
      activityLevel = 'High pedestrian activity';
    } else if (avgEstablishmentsPerPoint >= 5) {
      densityScore = 7;
      trafficDensity = 'moderate';
      activityLevel = 'Moderate foot traffic';
    } else if (avgEstablishmentsPerPoint >= 2) {
      densityScore = 5;
      trafficDensity = 'low';
      activityLevel = 'Low pedestrian presence';
    } else {
      densityScore = 3;
      trafficDensity = 'very low';
      activityLevel = 'Minimal foot traffic';
    }

    // Apply time-based adjustments
    let timeAdjustment = 0;
    let timeContext = '';

    if (isPeakHours && isBusinessHours) {
      timeAdjustment = 2; // Peak hours boost
      timeContext = ' - Peak hours';
    } else if (isBusinessHours) {
      timeAdjustment = 1; // Business hours boost
      timeContext = ' - Business hours';
    } else if (isLateNight) {
      timeAdjustment = -2; // Late night penalty
      timeContext = ' - Late night';
    } else {
      timeContext = ' - Off hours';
    }

    // Apply route type bias
    let routeTypeBias = 0;
    if (routeType === 'safest') {
      routeTypeBias = 1; // Prefer high traffic for safety
    } else if (routeType === 'fastest') {
      routeTypeBias = -0.5; // May avoid crowded areas
    }

    const finalScore = Math.min(10, Math.max(1, densityScore + timeAdjustment + routeTypeBias));
    const description = `${activityLevel}${timeContext}`;

    return {
      score: finalScore,
      description,
      establishmentsFound: totalEstablishments,
      avgEstablishmentsPerPoint: Math.round(avgEstablishmentsPerPoint * 10) / 10,
      density: trafficDensity,
      timeBasedScore: false,
    };

  } catch (error) {
    console.error('Foot traffic analysis error:', error.message);
    return getDefaultTrafficAnalysis(new Date().getHours(), routeType);
  }
};

/**
 * Get default traffic analysis based on time
 */
const getDefaultTrafficAnalysis = (hour, routeType) => {
  const isPeakHours = (hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 19);
  const isBusinessHours = hour >= 9 && hour <= 21;
  
  let baseScore, description;
  
  if (isPeakHours && isBusinessHours) {
    baseScore = 8;
    description = 'High pedestrian activity - Peak hours';
  } else if (isBusinessHours) {
    baseScore = 7;
    description = 'Moderate foot traffic - Business hours';
  } else {
    baseScore = 5;
    description = 'Low pedestrian presence - Off hours';
  }

  // Apply route variation
  const routeVariation = routeType === 'route1' ? 0 : 
                        routeType === 'route2' ? -0.2 : -0.4;
  
  return {
    score: Math.min(10, Math.max(1, baseScore + routeVariation)),
    description,
    establishmentsFound: 0,
    timeBasedScore: true,
  };
};

/**
 * Check establishments at a specific point using Google Places API
 */
const checkEstablishmentsAtPoint = async (point) => {
  // Add null check
  if (!point || !point.latitude || !point.longitude) {
    return {
      location: point,
      count: 0,
      establishments: [],
    };
  }

  try {
    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/place/nearbysearch/json',
      {
        params: {
          location: `${point.latitude},${point.longitude}`,
          radius: 200, // 200 meter radius for foot traffic
          type: 'establishment', // Any type of establishment
          key: GOOGLE_MAPS_API_KEY,
        },
        timeout: 5000, // 5 second timeout
      }
    );

    const results = response.data.results || [];
    
    // Filter for establishments that attract foot traffic
    const relevantPlaces = results.filter(place => {
      const types = place.types || [];
      // Exclude parking, gas stations, etc.
      const irrelevantTypes = ['parking', 'gas_station', 'car_dealer', 'car_repair'];
      return !types.some(type => irrelevantTypes.includes(type));
    });

    return {
      location: point,
      count: relevantPlaces.length,
      establishments: relevantPlaces.slice(0, 5).map(p => ({
        name: p.name,
        types: p.types,
        rating: p.rating,
      })),
    };

  } catch (error) {
    // Return 0 on error, will use fallback
    return {
      location: point,
      count: 0,
      establishments: [],
    };
  }
};

/**
 * Analyze proximity to safe spots using Google Places API
 * Checks for hospitals, police stations, and 24/7 stores along the route
 */
const analyzeSafeSpots = async (coordinates, routeType = 'route1') => {
  try {
    // Sample key points along the route for safe spot checking
    const samplePoints = sampleRoutePoints(coordinates, 3); // Check start, mid, end
    
    if (samplePoints.length === 0) {
      return getDefaultSafeSpotAnalysis(routeType);
    }

    // Find safe spots near each sample point
    const safeSpotChecks = await Promise.all(
      samplePoints.map(point => findNearbySafeSpots(point))
    );

    // Flatten and deduplicate safe spots
    const allSafeSpots = [];
    const seenIds = new Set();
    
    safeSpotChecks.forEach(spots => {
      spots.forEach(spot => {
        const spotId = `${spot.name}_${spot.location.latitude}_${spot.location.longitude}`;
        if (!seenIds.has(spotId)) {
          seenIds.add(spotId);
          allSafeSpots.push(spot);
        }
      });
    });

    // Sort by distance
    allSafeSpots.sort((a, b) => a.distance - b.distance);

    // Categorize safe spots
    const hospitals = allSafeSpots.filter(s => s.type === 'hospital');
    const police = allSafeSpots.filter(s => s.type === 'police');
    const stores = allSafeSpots.filter(s => s.type === 'convenience_store');

    // Calculate score based on proximity and availability
    let baseScore = 5;
    let description = 'Limited safe spots';
    let nearestSpot = allSafeSpots[0];

    if (allSafeSpots.length === 0) {
      baseScore = 3;
      description = 'No safe spots nearby';
    } else {
      const nearestDistance = nearestSpot.distance;
      const spotType = nearestSpot.type === 'hospital' ? 'Hospital' :
                       nearestSpot.type === 'police' ? 'Police station' :
                       '24/7 Store';

      if (nearestDistance < 0.3) { // Within 300m
        baseScore = 9;
        description = `${spotType} ${Math.round(nearestDistance * 1000)}m away`;
      } else if (nearestDistance < 0.5) { // Within 500m
        baseScore = 7;
        description = `${spotType} ${Math.round(nearestDistance * 1000)}m away`;
      } else if (nearestDistance < 1.0) { // Within 1km
        baseScore = 6;
        description = `Safe spots within 1km`;
      } else {
        baseScore = 4;
        description = 'Safe spots distant';
      }

      // Bonus for open spots
      const openSpots = allSafeSpots.filter(s => s.isOpen).length;
      if (openSpots > 0) {
        baseScore += 0.5;
        if (nearestSpot.isOpen) {
          description += ' (open now)';
        }
      }

      // Bonus for multiple types of safe spots
      if (hospitals.length > 0 && police.length > 0) {
        baseScore += 0.5;
      }
    }

    // Apply route type variation
    const routeVariation = routeType === 'route1' ? 0 : 
                          routeType === 'route2' ? -0.2 : -0.4;

    const finalScore = Math.min(10, Math.max(1, baseScore + routeVariation));

    return {
      score: Math.round(finalScore * 10) / 10,
      description,
      safeSpots: allSafeSpots.slice(0, 10), // Top 10 closest
      hospitals: hospitals.length,
      police: police.length,
      stores: stores.length,
      nearest: nearestSpot,
      total: allSafeSpots.length,
      usingRealData: true,
    };

  } catch (error) {
    console.error('Safe spots analysis error:', error.message);
    return getDefaultSafeSpotAnalysis(routeType);
  }
};

/**
 * Get default safe spot analysis
 */
const getDefaultSafeSpotAnalysis = (routeType) => {
  const baseScore = 7;
  const routeVariation = routeType === 'route1' ? 0 : 
                        routeType === 'route2' ? -0.3 : -0.6;
  
  return {
    score: Math.min(10, Math.max(1, baseScore + routeVariation)),
    description: 'Safe spots coverage unknown',
    safeSpots: [],
    hospitals: 0,
    police: 0,
    stores: 0,
    nearest: null,
    total: 0,
    usingRealData: false,
  };
};

/**
 * Find nearby safe spots using Google Places API
 * @param {Object} point - { latitude, longitude }
 * @returns {Array} Array of safe spots with details
 */
const findNearbySafeSpots = async (point) => {
  // Add null check
  if (!point || !point.latitude || !point.longitude) {
    return [];
  }

  try {
    // Search for safe spots: hospitals, police, 24/7 stores
    const types = ['hospital', 'police', 'convenience_store'];
    const safeSpots = [];

    // Search each type in parallel
    const searches = types.map(async (type) => {
      try {
        const response = await axios.get(
          'https://maps.googleapis.com/maps/api/place/nearbysearch/json',
          {
            params: {
              location: `${point.latitude},${point.longitude}`,
              radius: 1000, // 1km radius
              type: type,
              key: GOOGLE_MAPS_API_KEY,
            },
            timeout: 5000,
          }
        );

        const results = response.data.results || [];
        
        return results
          .filter(place => {
            // Filter out places without valid geometry
            return place.geometry && 
                   place.geometry.location && 
                   place.geometry.location.lat && 
                   place.geometry.location.lng &&
                   !isNaN(place.geometry.location.lat) &&
                   !isNaN(place.geometry.location.lng);
          })
          .map(place => ({
            name: place.name,
            type: type,
            location: {
              latitude: place.geometry.location.lat,
              longitude: place.geometry.location.lng,
            },
            distance: calculateDistance(
              point.latitude,
              point.longitude,
              place.geometry.location.lat,
              place.geometry.location.lng
            ),
            isOpen: place.opening_hours?.open_now ?? null,
            rating: place.rating,
            address: place.vicinity,
          }));
      } catch (error) {
        // Silently skip failed type searches
        return [];
      }
    });

    const results = await Promise.all(searches);
    results.forEach(spots => safeSpots.push(...spots));

    // Sort by distance
    safeSpots.sort((a, b) => a.distance - b.distance);

    return safeSpots;

  } catch (error) {
    console.error('Safe spots search error:', error);
    return [];
  }
};

/**
 * Analyze community reports from Firebase
 */
/**
 * Analyze community reports from Firebase Realtime Database
 * Categorizes reports by type and calculates impact on safety score
 */
const analyzeCommunityReports = async (coordinates) => {
  try {
    const alerts = [];
    let score = 8;

    // Check if database is available
    if (!realtimeDb) {
      return {
        score: 8,
        description: 'Community data unavailable',
        alerts: [],
        total: 0,
        incidents: 0,
        harassment: 0,
        poorLighting: 0,
        construction: 0,
        other: 0,
      };
    }

    // Get reports from last 7 days
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    // Query Firebase for reports in the area
    const reportsRef = ref(realtimeDb, 'safety_reports');
    const reportsSnapshot = await get(reportsRef);

    if (reportsSnapshot.exists()) {
      const reports = reportsSnapshot.val();
      const nearbyReports = [];
      
      // Categorize reports by type
      const reportCategories = {
        incidents: 0,
        harassment: 0,
        poorLighting: 0,
        construction: 0,
        crime: 0,
        suspicious: 0,
        other: 0,
      };

      Object.entries(reports).forEach(([reportId, report]) => {
        // Only consider recent reports
        if (report.timestamp > sevenDaysAgo) {
          // Validate report location
          if (!report.location || !report.location.latitude || !report.location.longitude) {
            return; // Skip invalid reports
          }

          // Check if report is near route (within 500m)
          const nearestPoint = coordinates.reduce((nearest, coord) => {
            // Validate coordinate before calculating distance
            if (!coord || !coord.latitude || !coord.longitude || 
                isNaN(coord.latitude) || isNaN(coord.longitude)) {
              return nearest;
            }

            const distance = calculateDistance(
              coord.latitude,
              coord.longitude,
              report.location.latitude,
              report.location.longitude
            );
            return distance < nearest.distance ? { distance, coord } : nearest;
          }, { distance: Infinity, coord: null });

          if (nearestPoint.distance < 0.5) { // Within 500m
            nearbyReports.push({
              ...report,
              id: reportId,
              distanceFromRoute: nearestPoint.distance,
            });

            // Categorize by type
            const reportType = report.type?.toLowerCase() || 'other';
            if (reportType.includes('incident') || reportType.includes('assault')) {
              reportCategories.incidents++;
            } else if (reportType.includes('harassment')) {
              reportCategories.harassment++;
            } else if (reportType.includes('lighting') || reportType.includes('dark')) {
              reportCategories.poorLighting++;
            } else if (reportType.includes('construction') || reportType.includes('work')) {
              reportCategories.construction++;
            } else if (reportType.includes('crime') || reportType.includes('theft')) {
              reportCategories.crime++;
            } else if (reportType.includes('suspicious')) {
              reportCategories.suspicious++;
            } else {
              reportCategories.other++;
            }

            // Add to alerts if high severity or critical type
            const isCritical = reportType.includes('incident') || 
                              reportType.includes('assault') || 
                              reportType.includes('crime');
            
            if (report.severity === 'high' || isCritical) {
              alerts.push({
                type: 'warning',
                message: `${report.type} reported ${getTimeAgo(report.timestamp)}`,
                location: report.location,
                severity: report.severity || 'medium',
                distance: `${Math.round(nearestPoint.distance * 1000)}m from route`,
              });
            }
          }
        }
      });

      // Calculate safety score based on report types and severity
      const totalReports = nearbyReports.length;
      const criticalReports = reportCategories.incidents + reportCategories.crime + reportCategories.harassment;
      const moderateReports = reportCategories.poorLighting + reportCategories.suspicious;
      const minorReports = reportCategories.construction + reportCategories.other;

      if (totalReports === 0) {
        score = 9;
      } else {
        // Base score reduction
        let scoreReduction = 0;
        
        // Critical reports have high impact
        scoreReduction += criticalReports * 1.5;
        
        // Moderate reports have medium impact
        scoreReduction += moderateReports * 0.8;
        
        // Minor reports have low impact
        scoreReduction += minorReports * 0.3;

        // Calculate final score
        score = Math.max(1, Math.min(9, 9 - scoreReduction));
      }

      // Build description
      let description;
      if (totalReports === 0) {
        description = 'No incidents in 7 days';
      } else if (criticalReports > 0) {
        description = `${criticalReports} critical report(s) in 7 days`;
      } else if (totalReports <= 2) {
        description = `${totalReports} minor report(s) in 7 days`;
      } else {
        description = `${totalReports} report(s) in 7 days`;
      }

      return {
        score: Math.round(score * 10) / 10,
        description,
        alerts,
        total: totalReports,
        incidents: reportCategories.incidents,
        harassment: reportCategories.harassment,
        poorLighting: reportCategories.poorLighting,
        construction: reportCategories.construction,
        crime: reportCategories.crime,
        suspicious: reportCategories.suspicious,
        other: reportCategories.other,
        reports: nearbyReports.slice(0, 10), // Keep top 10 closest reports
      };
    }

    return {
      score: 8,
      description: 'No recent reports',
      alerts: [],
      total: 0,
      incidents: 0,
      harassment: 0,
      poorLighting: 0,
      construction: 0,
      crime: 0,
      suspicious: 0,
      other: 0,
      reports: [],
    };
  } catch (error) {
    // Silently handle Firebase errors and return default
    return {
      score: 7,
      description: 'Community data unavailable',
      alerts: [],
    };
  }
};

/**
 * Analyze crime data (mock - in production use real crime API)
 */
const analyzeCrimeData = (coordinates, routeType) => {
  // Mock crime analysis based on route type
  if (routeType === 'safest') {
    return {
      score: 9,
      description: 'Low crime area',
    };
  } else if (routeType === 'fastest') {
    return {
      score: 6,
      description: 'Moderate crime history',
    };
  } else {
    return {
      score: 7,
      description: 'Average safety record',
    };
  }
};

/**
 * Calculate weighted overall safety score
 */
const calculateOverallScore = (scores) => {
  const weights = {
    lighting: 0.25,
    traffic: 0.20,
    safeSpots: 0.20,
    community: 0.20,
    crime: 0.15,
  };

  const weightedScore = 
    scores.lighting * weights.lighting +
    scores.traffic * weights.traffic +
    scores.safeSpots * weights.safeSpots +
    scores.community * weights.community +
    scores.crime * weights.crime;

  return Math.round(weightedScore * 10) / 10;
};

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  // Validate inputs
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null ||
      isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) {
    return 999; // Return large distance if invalid
  }

  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
};

const toRad = (value) => {
  return value * Math.PI / 180;
};

/**
 * Get human-readable time ago
 */
const getTimeAgo = (timestamp) => {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
};

/**
 * Default analysis if error occurs
 */
const getDefaultAnalysis = () => ({
  overallScore: 7,
  lightingScore: 7,
  trafficScore: 7,
  safeSpotScore: 7,
  communityScore: 7,
  crimeScore: 7,
  factors: ['Analysis unavailable'],
  alerts: [],
});

/**
 * Get route color based on safety score
 */
export const getRouteColor = (score) => {
  if (score >= 8) return '#10B981'; // Green - Safe
  if (score >= 6) return '#F59E0B'; // Orange - Moderate
  return '#EF4444'; // Red - Unsafe
};

/**
 * Get route safety level
 */
export const getRouteSafetyLevel = (score) => {
  if (score >= 8) return 'SAFE';
  if (score >= 6) return 'MODERATE';
  return 'CAUTION';
};
