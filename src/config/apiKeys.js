/**
 * API Keys Configuration
 * Centralized file for all API keys used in the app
 * 
 * PRODUCTION: Use environment variables or Expo's secure storage
 * DEVELOPMENT: Can use hardcoded values for testing
 * 
 * For GitHub safety: This file contains placeholder values.
 * Real keys should be in .env file (which is gitignored) or Expo secrets
 */

// For development: Import from .env if available, otherwise use placeholders
// Note: In production builds, these should be set via EAS Secrets
let MAPS_KEY = 'YOUR_GOOGLE_MAPS_API_KEY_HERE';
let VISION_KEY = 'YOUR_GOOGLE_CLOUD_VISION_API_KEY_HERE';

// Try to load from environment (works in development with react-native-dotenv)
try {
  // This will be replaced by Metro bundler in development
  // In production, keys should come from EAS Secrets or app.json extra config
  if (process.env.GOOGLE_MAPS_API_KEY) {
    MAPS_KEY = process.env.GOOGLE_MAPS_API_KEY;
  }
  if (process.env.GOOGLE_CLOUD_VISION_API_KEY) {
    VISION_KEY = process.env.GOOGLE_CLOUD_VISION_API_KEY;
  }
} catch (error) {
  // Environment variables not available, will use placeholders or build-time values
  console.log('Using build-time API key configuration');
}

// Google Maps & Places API Key
export const GOOGLE_MAPS_API_KEY = MAPS_KEY;

// Google Cloud Vision API Key (for image analysis)
export const GOOGLE_CLOUD_VISION_API_KEY = VISION_KEY;

// Helper function to validate API keys
export const validateApiKeys = () => {
  const keys = {
    googleMaps: GOOGLE_MAPS_API_KEY,
    googleVision: GOOGLE_CLOUD_VISION_API_KEY,
  };

  const missing = [];
  
  if (!keys.googleMaps || keys.googleMaps === 'YOUR_GOOGLE_MAPS_API_KEY_HERE' || keys.googleMaps.length < 10) {
    missing.push('Google Maps API Key');
  }
  
  if (!keys.googleVision || keys.googleVision === 'YOUR_GOOGLE_CLOUD_VISION_API_KEY_HERE' || keys.googleVision.length < 10) {
    missing.push('Google Cloud Vision API Key');
  }

  if (missing.length > 0) {
    console.warn(`⚠️  Missing or invalid API Keys: ${missing.join(', ')}`);
    console.warn('📝 Please configure your API keys in .env file or EAS Secrets');
    return false;
  }

  return true;
};

/**
 * FOR GITHUB SAFETY:
 * 
 * This file should contain ONLY placeholder values when pushed to GitHub.
 * 
 * For LOCAL DEVELOPMENT:
 * - Create a .env file (already gitignored)
 * - Add your real API keys there
 * 
 * For PRODUCTION BUILDS:
 * - Use EAS Secrets: https://docs.expo.dev/build-reference/variables/
 * - Run: eas secret:create --name GOOGLE_MAPS_API_KEY --value "your_key_here"
 * - Run: eas secret:create --name GOOGLE_CLOUD_VISION_API_KEY --value "your_key_here"
 * 
 * The build system will inject the real values at build time.
 */

