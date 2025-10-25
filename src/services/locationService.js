/**
 * Location Service
 * Handles device location tracking and updates
 */

import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { LOCATION_CONFIG } from '../utils/constants';
import { checkLocationPermission, requestLocationPermission } from '../utils/permissions';

const LOCATION_TASK_NAME = 'background-location-task';
const LOCATION_UPDATE_INTERVAL = LOCATION_CONFIG.TIME_INTERVAL;
const LOCATION_DISTANCE_INTERVAL = LOCATION_CONFIG.DISTANCE_INTERVAL;

let locationSubscription = null;
let backgroundLocationStarted = false;

/**
 * Get current location once
 */
export const getCurrentLocation = async () => {
  try {
    const hasPermission = await checkLocationPermission();
    if (!hasPermission) {
      const permissionResult = await requestLocationPermission();
      if (!permissionResult.granted) {
        throw new Error('Location permission denied');
      }
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy,
      altitude: location.coords.altitude,
      heading: location.coords.heading,
      speed: location.coords.speed,
      timestamp: location.timestamp,
    };
  } catch (error) {
    console.error('Error getting current location:', error);
    throw error;
  }
};

/**
 * Watch location changes in real-time
 */
export const watchLocation = async (callback, options = {}) => {
  try {
    const hasPermission = await checkLocationPermission();
    if (!hasPermission) {
      const permissionResult = await requestLocationPermission();
      if (!permissionResult.granted) {
        throw new Error('Location permission denied');
      }
    }

    // Remove existing subscription if any
    if (locationSubscription) {
      locationSubscription.remove();
    }

    locationSubscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: options.timeInterval || LOCATION_UPDATE_INTERVAL,
        distanceInterval: options.distanceInterval || LOCATION_DISTANCE_INTERVAL,
      },
      (location) => {
        callback({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy,
          altitude: location.coords.altitude,
          heading: location.coords.heading,
          speed: location.coords.speed,
          timestamp: location.timestamp,
        });
      }
    );

    return locationSubscription;
  } catch (error) {
    console.error('Error watching location:', error);
    throw error;
  }
};

/**
 * Stop watching location changes
 */
export const stopWatchingLocation = () => {
  if (locationSubscription) {
    locationSubscription.remove();
    locationSubscription = null;
  }
};

/**
 * Define background location task
 */
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error('Background location error:', error);
    return;
  }

  if (data) {
    const { locations } = data;
    if (locations && locations.length > 0) {
      const location = locations[0];
      
      // You can handle background location updates here
      // For example, update Firebase Realtime Database for live tracking
      console.log('Background location update:', {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      
      // Trigger any callbacks registered for background updates
      if (global.backgroundLocationCallback) {
        global.backgroundLocationCallback({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy,
          timestamp: location.timestamp,
        });
      }
    }
  }
});

/**
 * Start background location tracking (for SOS)
 */
export const startBackgroundLocation = async (callback) => {
  try {
    const hasPermission = await checkLocationPermission();
    if (!hasPermission) {
      const permissionResult = await requestLocationPermission();
      if (!permissionResult.granted || !permissionResult.backgroundGranted) {
        throw new Error('Background location permission denied');
      }
    }

    // Register callback for background updates
    global.backgroundLocationCallback = callback;

    // Check if task is already defined
    const isTaskDefined = await TaskManager.isTaskDefined(LOCATION_TASK_NAME);
    if (!isTaskDefined) {
      throw new Error('Location task not defined');
    }

    // Start background location updates
    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.High,
      timeInterval: LOCATION_CONFIG.BACKGROUND_TIME_INTERVAL,
      distanceInterval: LOCATION_DISTANCE_INTERVAL,
      foregroundService: {
        notificationTitle: 'SafeRoute Active',
        notificationBody: 'Tracking your location for safety',
        notificationColor: '#6200EE',
      },
    });

    backgroundLocationStarted = true;
    console.log('Background location tracking started');
  } catch (error) {
    console.error('Error starting background location:', error);
    throw error;
  }
};

/**
 * Stop background location tracking
 */
export const stopBackgroundLocation = async () => {
  try {
    const isRegistered = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
    
    if (isRegistered) {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
      backgroundLocationStarted = false;
      global.backgroundLocationCallback = null;
      console.log('Background location tracking stopped');
    }
  } catch (error) {
    console.error('Error stopping background location:', error);
    throw error;
  }
};

/**
 * Check if background location is running
 */
export const isBackgroundLocationRunning = async () => {
  try {
    return await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
  } catch (error) {
    console.error('Error checking background location status:', error);
    return false;
  }
};

/**
 * Get last known location
 */
export const getLastKnownLocation = async () => {
  try {
    const location = await Location.getLastKnownPositionAsync();
    
    if (location) {
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        timestamp: location.timestamp,
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting last known location:', error);
    return null;
  }
};

/**
 * Calculate heading between two points
 */
export const calculateHeading = (from, to) => {
  const lat1 = (from.latitude * Math.PI) / 180;
  const lat2 = (to.latitude * Math.PI) / 180;
  const lng1 = (from.longitude * Math.PI) / 180;
  const lng2 = (to.longitude * Math.PI) / 180;

  const y = Math.sin(lng2 - lng1) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(lng2 - lng1);
  const heading = (Math.atan2(y, x) * 180) / Math.PI;

  return (heading + 360) % 360; // Normalize to 0-360
};

/**
 * Check if location services are enabled
 */
export const checkLocationServicesEnabled = async () => {
  try {
    return await Location.hasServicesEnabledAsync();
  } catch (error) {
    console.error('Error checking location services:', error);
    return false;
  }
};

/**
 * Get location accuracy string
 */
export const getAccuracyDescription = (accuracy) => {
  if (!accuracy) return 'Unknown';
  if (accuracy < 10) return 'Excellent';
  if (accuracy < 50) return 'Good';
  if (accuracy < 100) return 'Fair';
  return 'Poor';
};

export default {
  getCurrentLocation,
  watchLocation,
  stopWatchingLocation,
  startBackgroundLocation,
  stopBackgroundLocation,
  isBackgroundLocationRunning,
  getLastKnownLocation,
  calculateHeading,
  checkLocationServicesEnabled,
  getAccuracyDescription,
};
