/**
 * Application Constants
 * Centralized configuration values and magic numbers
 */

// Safety Scoring Weights
export const SAFETY_WEIGHTS = {
  STREET_LIGHTING: 0.30,      // 30% weight
  FOOT_TRAFFIC: 0.25,          // 25% weight
  TIME_OF_DAY: 0.20,           // 20% weight
  SAFE_SPOT_PROXIMITY: 0.15,   // 15% weight
  COMMUNITY_REPORTS: 0.10,     // 10% weight
};

// Time of Day Configuration
export const TIME_CONFIG = {
  DAY_START: 6,    // 6 AM
  DAY_END: 20,     // 8 PM
  DAY_BONUS: 2,    // +2 points during day
  NIGHT_PENALTY: -2, // -2 points at night
};

// Safety Score Ranges
export const SAFETY_SCORE = {
  MIN: 1,
  MAX: 10,
  BASE: 5,
  EXCELLENT: 8,
  GOOD: 6,
  MODERATE: 4,
  POOR: 2,
};

// Safe Spot Types
export const SAFE_SPOT_TYPES = {
  HOSPITAL: 'hospital',
  POLICE: 'police_station',
  FIRE_STATION: 'fire_station',
  PHARMACY: 'pharmacy',
  STORE_24_7: 'store_24_7',
  METRO_STATION: 'metro_station',
  BUS_STOP: 'bus_stop',
};

// Safe Spot Configuration
export const SAFE_SPOT_CONFIG = {
  SEARCH_RADIUS: 500,        // 500 meters
  MAX_RESULTS: 10,
  CACHE_DURATION: 3600000,   // 1 hour in milliseconds
};

// Community Report Types
export const REPORT_TYPES = {
  POOR_LIGHTING: 'poor_lighting',
  HARASSMENT: 'harassment',
  INFRASTRUCTURE: 'infrastructure',
  UNSAFE_AREA: 'unsafe_area',
  SUSPICIOUS_ACTIVITY: 'suspicious_activity',
  ACCIDENT: 'accident',
  OTHER: 'other',
};

// Report Severity Levels
export const SEVERITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

// Rate Limiting
export const RATE_LIMITS = {
  MAX_REPORTS_PER_HOUR: 3,
  REPORT_COOLDOWN_MS: 300000, // 5 minutes
  MAX_SOS_PER_DAY: 5,
};

// Map Configuration
export const MAP_CONFIG = {
  DEFAULT_ZOOM: 15,
  DEFAULT_DELTA: {
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  },
  MIN_ZOOM: 10,
  MAX_ZOOM: 20,
  ROUTE_LINE_WIDTH: 5,
};

// Route Colors Based on Safety Score
export const ROUTE_COLORS = {
  SAFE: '#4CAF50',       // Green
  MODERATE: '#FFC107',   // Yellow
  UNSAFE: '#F44336',     // Red
  DEFAULT: '#2196F3',    // Blue
};

// Safety Score Color Mapping
export const getRouteColor = (score) => {
  if (score >= SAFETY_SCORE.EXCELLENT) return ROUTE_COLORS.SAFE;
  if (score >= SAFETY_SCORE.GOOD) return ROUTE_COLORS.MODERATE;
  return ROUTE_COLORS.UNSAFE;
};

// Navigation Modes
export const NAVIGATION_MODES = {
  WALKING: 'walking',
  TRANSIT: 'transit',
  BICYCLING: 'bicycling',
  DRIVING: 'driving',
};

// Route Preference Types
export const ROUTE_PREFERENCES = {
  SAFEST: 'safest',
  BALANCED: 'balanced',
  FASTEST: 'fastest',
};

// Supported Languages
export const LANGUAGES = {
  ENGLISH: 'en',
  HINDI: 'hi',
  TAMIL: 'ta',
  TELUGU: 'te',
  KANNADA: 'kn',
  BENGALI: 'bn',
  MARATHI: 'mr',
  GUJARATI: 'gu',
  MALAYALAM: 'ml',
  PUNJABI: 'pa',
};

// Language Display Names
export const LANGUAGE_NAMES = {
  en: 'English',
  hi: 'हिंदी',
  ta: 'தமிழ்',
  te: 'తెలుగు',
  kn: 'ಕನ್ನಡ',
  bn: 'বাংলা',
  mr: 'मराठी',
  gu: 'ગુજરાતી',
  ml: 'മലയാളം',
  pa: 'ਪੰਜਾਬੀ',
};

// SOS Configuration
export const SOS_CONFIG = {
  COUNTDOWN_SECONDS: 5,
  LOCATION_UPDATE_INTERVAL: 10000, // 10 seconds
  ALERT_EXPIRY_HOURS: 24,
  MAX_EMERGENCY_CONTACTS: 5,
};

// Notification Types
export const NOTIFICATION_TYPES = {
  COMMUNITY_ALERT: 'community_alert',
  ROUTE_WARNING: 'route_warning',
  SOS_ALERT: 'sos_alert',
  SAFETY_TIP: 'safety_tip',
  SYSTEM: 'system',
};

// Cache Keys
export const CACHE_KEYS = {
  USER_LOCATION: 'user_location',
  RECENT_ROUTES: 'recent_routes',
  SAFE_SPOTS: 'safe_spots',
  USER_PREFERENCES: 'user_preferences',
  OFFLINE_MAPS: 'offline_maps',
};

// API Endpoints (for custom backend if needed)
export const API_ENDPOINTS = {
  ROUTES: '/api/routes',
  SAFETY_SCORE: '/api/safety-score',
  REPORTS: '/api/reports',
  SOS: '/api/sos',
  SAFE_SPOTS: '/api/safe-spots',
};

// Error Messages
export const ERROR_MESSAGES = {
  LOCATION_PERMISSION_DENIED: 'Location permission is required for SafeRoute to function.',
  NETWORK_ERROR: 'Network error. Please check your internet connection.',
  INVALID_ROUTE: 'Could not find a valid route. Please try different locations.',
  REPORT_LIMIT_EXCEEDED: 'You have reached the maximum number of reports per hour.',
  SOS_FAILED: 'Failed to send SOS alert. Please try again.',
  AUTH_FAILED: 'Authentication failed. Please log in again.',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  REPORT_SUBMITTED: 'Thank you! Your report has been submitted.',
  SOS_ACTIVATED: 'SOS alert sent to your emergency contacts.',
  PROFILE_UPDATED: 'Profile updated successfully.',
  ROUTE_SAVED: 'Route saved to favorites.',
};

// Accessibility Features
export const ACCESSIBILITY_CONFIG = {
  MIN_SIDEWALK_WIDTH: 1.2,    // meters
  MAX_SLOPE_PERCENT: 8.33,     // ADA compliant
  REQUIRE_RAMPS: true,
  AVOID_STAIRS: true,
  PREFER_CROSSWALKS: true,
};

// App Theme Colors - SafeRoute Design System (Logo-based)
export const THEME_COLORS = {
  // Primary Brand Colors
  BRAND_BLACK: '#1A1A1A',      // Logo black - headers, primary text
  BRAND_WHITE: '#FFFFFF',      // Pure white - backgrounds, contrast
  SAFETY_GREEN: '#10B981',     // Safe routes, positive actions
  WARNING_ORANGE: '#F59E0B',   // Moderate safety, caution
  ALERT_RED: '#EF4444',        // Danger zones, SOS button
  
  // Secondary Colors
  SOFT_GRAY: '#F3F4F6',        // Card backgrounds
  MEDIUM_GRAY: '#6B7280',      // Secondary text, borders
  LIGHT_GRAY: '#E5E7EB',       // Dividers, inactive states
  ACCENT_BLUE: '#3B82F6',      // Links, information
  
  // Gradients
  SAFE_GRADIENT_START: '#10B981',
  SAFE_GRADIENT_END: '#059669',
  PROTECTION_GRADIENT_START: '#1A1A1A',
  PROTECTION_GRADIENT_END: '#374151',
  
  // Standard aliases
  PRIMARY: '#1A1A1A',
  PRIMARY_DARK: '#000000',
  SECONDARY: '#10B981',
  BACKGROUND: '#F3F4F6',
  SURFACE: '#FFFFFF',
  ERROR: '#EF4444',
  SUCCESS: '#10B981',
  WARNING: '#F59E0B',
  INFO: '#3B82F6',
  TEXT_PRIMARY: '#1A1A1A',
  TEXT_SECONDARY: '#6B7280',
  DISABLED: '#E5E7EB',
};

// Animation Durations
export const ANIMATION_DURATION = {
  SHORT: 200,
  MEDIUM: 300,
  LONG: 500,
};

// Location Update Configuration
export const LOCATION_CONFIG = {
  ACCURACY: 'high',
  DISTANCE_INTERVAL: 10,      // meters
  TIME_INTERVAL: 5000,        // 5 seconds
  BACKGROUND_TIME_INTERVAL: 15000, // 15 seconds for background
};

// Pagination
export const PAGINATION = {
  REPORTS_PER_PAGE: 20,
  ROUTES_PER_PAGE: 10,
  SAFE_SPOTS_PER_PAGE: 50,
};

// Default Values
export const DEFAULTS = {
  LANGUAGE: LANGUAGES.ENGLISH,
  NAVIGATION_MODE: NAVIGATION_MODES.WALKING,
  ROUTE_PREFERENCE: ROUTE_PREFERENCES.SAFEST,
  ACCESSIBILITY_MODE: false,
};

export default {
  SAFETY_WEIGHTS,
  TIME_CONFIG,
  SAFETY_SCORE,
  SAFE_SPOT_TYPES,
  SAFE_SPOT_CONFIG,
  REPORT_TYPES,
  SEVERITY_LEVELS,
  RATE_LIMITS,
  MAP_CONFIG,
  ROUTE_COLORS,
  NAVIGATION_MODES,
  ROUTE_PREFERENCES,
  LANGUAGES,
  LANGUAGE_NAMES,
  SOS_CONFIG,
  NOTIFICATION_TYPES,
  CACHE_KEYS,
  API_ENDPOINTS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  ACCESSIBILITY_CONFIG,
  THEME_COLORS,
  ANIMATION_DURATION,
  LOCATION_CONFIG,
  PAGINATION,
  DEFAULTS,
  getRouteColor,
};
