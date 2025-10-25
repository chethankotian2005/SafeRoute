/**
 * Main Services Export
 * Centralized export for all services
 */

export { default as FirebaseService } from './firebaseService';
export { default as GoogleMapsService } from './googleMapsService';
export { default as LocationService } from './locationService';
export { default as SafetyScoringService } from './safetyScoring';

// Re-export commonly used functions
export {
  signUpWithEmail,
  signInWithEmail,
  signOutUser,
  getCurrentUser,
  addCommunityReport,
  createSOSAlert,
} from './firebaseService';

export {
  getRoutes,
  getNearbySafeSpots,
  geocodeAddress,
  reverseGeocode,
} from './googleMapsService';

export {
  getCurrentLocation,
  watchLocation,
  startBackgroundLocation,
  stopBackgroundLocation,
} from './locationService';

export {
  calculateSafetyScore,
  rankRoutesBySafety,
} from './safetyScoring';
