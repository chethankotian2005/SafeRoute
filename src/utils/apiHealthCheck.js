/**
 * API Health Check Utility
 * Validates Google Maps API configuration
 */

import { GOOGLE_MAPS_API_KEY } from '../config/apiKeys';
/**
 * Check if Google Maps APIs are properly configured
 */
export const checkGoogleMapsAPI = async () => {
  const results = {
    apiKeyValid: false,
    directionsAPI: false,
    placesAPI: false,
    geocodingAPI: false,
  };

  // Check if API key exists
  if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY === 'undefined' || GOOGLE_MAPS_API_KEY.length < 10) {
    console.log('❌ Google Maps API key is missing or invalid');
    return results;
  }

  results.apiKeyValid = true;
  console.log('✅ Google Maps API key is present');

  // Test Geocoding API (simplest to test)
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=1600+Amphitheatre+Parkway,+Mountain+View,+CA&key=${GOOGLE_MAPS_API_KEY}`,
      { timeout: 5000 }
    );
    const data = await response.json();
    
    if (data.status === 'OK') {
      results.geocodingAPI = true;
      console.log('✅ Geocoding API is working');
    } else if (data.status === 'REQUEST_DENIED') {
      console.log('❌ Geocoding API: REQUEST_DENIED - Check API key restrictions');
    } else {
      console.log(`⚠️ Geocoding API returned: ${data.status}`);
    }
  } catch (error) {
    console.log('❌ Geocoding API failed:', error.message);
  }

  // Test Directions API
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/directions/json?origin=12.9716,77.5946&destination=12.9800,77.6000&mode=walking&key=${GOOGLE_MAPS_API_KEY}`,
      { timeout: 5000 }
    );
    const data = await response.json();
    
    if (data.status === 'OK') {
      results.directionsAPI = true;
      console.log('✅ Directions API is working');
    } else if (data.status === 'REQUEST_DENIED') {
      console.log('❌ Directions API: REQUEST_DENIED - API may not be enabled in Google Cloud Console');
    } else {
      console.log(`⚠️ Directions API returned: ${data.status}`);
    }
  } catch (error) {
    console.log('❌ Directions API failed:', error.message);
  }

  // Test Places API
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?query=restaurant&key=${GOOGLE_MAPS_API_KEY}`,
      { timeout: 5000 }
    );
    const data = await response.json();
    
    if (data.status === 'OK' || data.status === 'ZERO_RESULTS') {
      results.placesAPI = true;
      console.log('✅ Places API is working');
    } else if (data.status === 'REQUEST_DENIED') {
      console.log('❌ Places API: REQUEST_DENIED - API may not be enabled in Google Cloud Console');
    } else {
      console.log(`⚠️ Places API returned: ${data.status}`);
    }
  } catch (error) {
    console.log('❌ Places API failed:', error.message);
  }

  return results;
};

/**
 * Get user-friendly error message based on health check results
 */
export const getAPIErrorMessage = (healthCheck) => {
  if (!healthCheck.apiKeyValid) {
    return 'Google Maps API key is missing. Please check your .env file.';
  }
  
  const failedAPIs = [];
  if (!healthCheck.directionsAPI) failedAPIs.push('Directions API');
  if (!healthCheck.placesAPI) failedAPIs.push('Places API');
  if (!healthCheck.geocodingAPI) failedAPIs.push('Geocoding API');
  
  if (failedAPIs.length > 0) {
    return `The following APIs are not enabled: ${failedAPIs.join(', ')}. Please enable them in Google Cloud Console.`;
  }
  
  return 'All APIs are working correctly!';
};
