/**
 * Google Maps Service
 * Handles all Google Maps API interactions
 */

import axios from 'axios';
import { GOOGLE_MAPS_API_KEY } from '../config/apiKeys';
import { SAFE_SPOT_TYPES } from '../utils/constants';
import { cacheData, getCachedData } from '../utils/helpers';

const MAPS_BASE_URL = 'https://maps.googleapis.com/maps/api';

/**
 * Get multiple route alternatives between origin and destination
 */
export const getRoutes = async (origin, destination, mode = 'walking') => {
  try {
    // Check cache first
    const cacheKey = `route_${origin.latitude},${origin.longitude}_${destination.latitude},${destination.longitude}_${mode}`;
    const cached = await getCachedData(cacheKey);
    if (cached) {
      console.log('Returning cached routes');
      return cached;
    }

    const response = await axios.get(`${MAPS_BASE_URL}/directions/json`, {
      params: {
        origin: `${origin.latitude},${origin.longitude}`,
        destination: `${destination.latitude},${destination.longitude}`,
        mode,
        alternatives: true,
        key: GOOGLE_MAPS_API_KEY,
      },
    });

    if (response.data.status !== 'OK') {
      throw new Error(`Google Maps API error: ${response.data.status}`);
    }

    const routes = response.data.routes.map((route, index) => ({
      id: `route_${index}`,
      summary: route.summary,
      distance: route.legs[0].distance,
      duration: route.legs[0].duration,
      polyline: route.overview_polyline.points,
      coordinates: decodePolyline(route.overview_polyline.points),
      steps: route.legs[0].steps,
      bounds: route.bounds,
    }));

    // Cache for 1 hour
    await cacheData(cacheKey, routes, 1);

    return routes;
  } catch (error) {
    console.error('Error getting routes:', error);
    throw error;
  }
};

/**
 * Get nearby safe spots (hospitals, police stations, etc.)
 */
export const getNearbySafeSpots = async (location, radius = 500, type = null) => {
  try {
    const cacheKey = `safe_spots_${location.latitude},${location.longitude}_${radius}_${type}`;
    const cached = await getCachedData(cacheKey);
    if (cached) {
      console.log('Returning cached safe spots');
      return cached;
    }

    const types = type ? [type] : [
      SAFE_SPOT_TYPES.HOSPITAL,
      SAFE_SPOT_TYPES.POLICE,
      SAFE_SPOT_TYPES.PHARMACY,
    ];

    const allSpots = [];

    for (const spotType of types) {
      const response = await axios.get(`${MAPS_BASE_URL}/place/nearbysearch/json`, {
        params: {
          location: `${location.latitude},${location.longitude}`,
          radius,
          type: spotType,
          key: GOOGLE_MAPS_API_KEY,
        },
      });

      if (response.data.status === 'OK') {
        const spots = response.data.results.map((place) => ({
          id: place.place_id,
          name: place.name,
          type: spotType,
          location: {
            latitude: place.geometry.location.lat,
            longitude: place.geometry.location.lng,
          },
          vicinity: place.vicinity,
          rating: place.rating,
          openNow: place.opening_hours?.open_now,
          icon: place.icon,
        }));
        allSpots.push(...spots);
      }
    }

    // Cache for 24 hours
    await cacheData(cacheKey, allSpots, 24);

    return allSpots;
  } catch (error) {
    console.error('Error getting nearby safe spots:', error);
    throw error;
  }
};

/**
 * Geocode address to coordinates
 */
export const geocodeAddress = async (address) => {
  try {
    const response = await axios.get(`${MAPS_BASE_URL}/geocode/json`, {
      params: {
        address,
        key: GOOGLE_MAPS_API_KEY,
      },
    });

    if (response.data.status !== 'OK' || response.data.results.length === 0) {
      throw new Error('Address not found');
    }

    const result = response.data.results[0];
    return {
      latitude: result.geometry.location.lat,
      longitude: result.geometry.location.lng,
      formattedAddress: result.formatted_address,
    };
  } catch (error) {
    console.error('Error geocoding address:', error);
    throw error;
  }
};

/**
 * Get autocomplete suggestions for a search query
 * @param {string} input - User's search input
 * @param {Object} location - User's current location for bias
 * @returns {Array} Array of place predictions
 */
export const getPlaceAutocomplete = async (input, location = null) => {
  try {
    if (!input || input.length < 2) {
      return [];
    }

    const params = {
      input,
      key: GOOGLE_MAPS_API_KEY,
      types: 'establishment|geocode', // All types of places and addresses
    };

    // Bias results to user's location if available
    if (location) {
      params.location = `${location.latitude},${location.longitude}`;
      params.radius = 50000; // 50km radius
    }

    const response = await axios.get(`${MAPS_BASE_URL}/place/autocomplete/json`, {
      params,
    });

    if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
      console.error('Autocomplete API error:', response.data.status);
      return [];
    }

    return response.data.predictions.map((prediction) => ({
      placeId: prediction.place_id,
      description: prediction.description,
      mainText: prediction.structured_formatting.main_text,
      secondaryText: prediction.structured_formatting.secondary_text,
    }));
  } catch (error) {
    console.error('Error getting autocomplete:', error);
    return [];
  }
};

/**
 * Reverse geocode coordinates to address
 */
export const reverseGeocode = async (latitude, longitude) => {
  try {
    const response = await axios.get(`${MAPS_BASE_URL}/geocode/json`, {
      params: {
        latlng: `${latitude},${longitude}`,
        key: GOOGLE_MAPS_API_KEY,
      },
    });

    if (response.data.status !== 'OK' || response.data.results.length === 0) {
      throw new Error('Location not found');
    }

    return response.data.results[0].formatted_address;
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    throw error;
  }
};

/**
 * Get Street View image for location
 */
export const getStreetViewImage = async (latitude, longitude, heading = 0) => {
  try {
    const url = `${MAPS_BASE_URL}/streetview?size=600x400&location=${latitude},${longitude}&heading=${heading}&pitch=0&key=${GOOGLE_MAPS_API_KEY}`;
    return url;
  } catch (error) {
    console.error('Error getting street view image:', error);
    throw error;
  }
};

/**
 * Get Street View metadata (check if Street View is available)
 */
export const getStreetViewMetadata = async (latitude, longitude) => {
  try {
    const response = await axios.get(`${MAPS_BASE_URL}/streetview/metadata`, {
      params: {
        location: `${latitude},${longitude}`,
        key: GOOGLE_MAPS_API_KEY,
      },
    });

    return {
      available: response.data.status === 'OK',
      location: response.data.location,
      date: response.data.date,
    };
  } catch (error) {
    console.error('Error getting street view metadata:', error);
    return { available: false };
  }
};

/**
 * Get place details by place ID
 */
export const getPlaceDetails = async (placeId) => {
  try {
    const response = await axios.get(`${MAPS_BASE_URL}/place/details/json`, {
      params: {
        place_id: placeId,
        fields: 'name,formatted_address,geometry,rating,opening_hours,formatted_phone_number,website',
        key: GOOGLE_MAPS_API_KEY,
      },
    });

    if (response.data.status !== 'OK') {
      throw new Error('Place not found');
    }

    return response.data.result;
  } catch (error) {
    console.error('Error getting place details:', error);
    throw error;
  }
};

/**
 * Search for places by query
 */
export const searchPlaces = async (query, location) => {
  try {
    const response = await axios.get(`${MAPS_BASE_URL}/place/textsearch/json`, {
      params: {
        query,
        location: location ? `${location.latitude},${location.longitude}` : undefined,
        radius: location ? 5000 : undefined,
        key: GOOGLE_MAPS_API_KEY,
      },
    });

    if (response.data.status !== 'OK') {
      return [];
    }

    return response.data.results.map((place) => ({
      id: place.place_id,
      name: place.name,
      address: place.formatted_address,
      location: {
        latitude: place.geometry.location.lat,
        longitude: place.geometry.location.lng,
      },
      rating: place.rating,
    }));
  } catch (error) {
    console.error('Error searching places:', error);
    return [];
  }
};

/**
 * Decode polyline string to coordinates array
 * Implementation of Google's polyline encoding algorithm
 */
export const decodePolyline = (encoded) => {
  const points = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b;
    let shift = 0;
    let result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push({
      latitude: lat / 1e5,
      longitude: lng / 1e5,
    });
  }

  return points;
};

/**
 * Get distance matrix between multiple origins and destinations
 */
export const getDistanceMatrix = async (origins, destinations, mode = 'walking') => {
  try {
    const originsStr = origins.map((o) => `${o.latitude},${o.longitude}`).join('|');
    const destStr = destinations.map((d) => `${d.latitude},${d.longitude}`).join('|');

    const response = await axios.get(`${MAPS_BASE_URL}/distancematrix/json`, {
      params: {
        origins: originsStr,
        destinations: destStr,
        mode,
        key: GOOGLE_MAPS_API_KEY,
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error getting distance matrix:', error);
    throw error;
  }
};

export default {
  getRoutes,
  getNearbySafeSpots,
  geocodeAddress,
  getPlaceAutocomplete,
  reverseGeocode,
  getStreetViewImage,
  getStreetViewMetadata,
  getPlaceDetails,
  searchPlaces,
  decodePolyline,
  getDistanceMatrix,
};
