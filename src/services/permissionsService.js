/**
 * Permissions Service
 * Handles all app permission requests and checks
 */

import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as Contacts from 'expo-contacts';
import * as MediaLibrary from 'expo-media-library';
import { Camera } from 'expo-camera';

/**
 * Check Camera Permission Status
 */
export const checkCameraPermission = async () => {
  try {
    const { status } = await Camera.getCameraPermissionsAsync();
    return status;
  } catch (error) {
    console.error('Error checking camera permission:', error);
    return 'undetermined';
  }
};

/**
 * Request Camera Permission
 */
export const requestCameraPermission = async () => {
  try {
    const { status } = await Camera.requestCameraPermissionsAsync();
    return status;
  } catch (error) {
    console.error('Error requesting camera permission:', error);
    return 'denied';
  }
};

/**
 * Check Location Permission Status
 */
export const checkLocationPermission = async () => {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    return status;
  } catch (error) {
    console.error('Error checking location permission:', error);
    return 'undetermined';
  }
};

/**
 * Request Location Permission
 */
export const requestLocationPermission = async () => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status;
  } catch (error) {
    console.error('Error requesting location permission:', error);
    return 'denied';
  }
};

/**
 * Check Location Background Permission Status
 */
export const checkLocationBackgroundPermission = async () => {
  try {
    const { status } = await Location.getBackgroundPermissionsAsync();
    return status;
  } catch (error) {
    console.error('Error checking background location permission:', error);
    return 'undetermined';
  }
};

/**
 * Request Location Background Permission
 */
export const requestLocationBackgroundPermission = async () => {
  try {
    const { status } = await Location.requestBackgroundPermissionsAsync();
    return status;
  } catch (error) {
    console.error('Error requesting background location permission:', error);
    return 'denied';
  }
};

/**
 * Check Contacts Permission Status
 */
export const checkContactsPermission = async () => {
  try {
    const { status } = await Contacts.getPermissionsAsync();
    return status;
  } catch (error) {
    console.error('Error checking contacts permission:', error);
    return 'undetermined';
  }
};

/**
 * Request Contacts Permission
 */
export const requestContactsPermission = async () => {
  try {
    const { status } = await Contacts.requestPermissionsAsync();
    return status;
  } catch (error) {
    console.error('Error requesting contacts permission:', error);
    return 'denied';
  }
};

/**
 * Check Notification Permission Status
 */
export const checkNotificationPermission = async () => {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status;
  } catch (error) {
    console.error('Error checking notification permission:', error);
    return 'undetermined';
  }
};

/**
 * Request Notification Permission
 */
export const requestNotificationPermission = async () => {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    return status;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return 'denied';
  }
};

/**
 * Check Media Library Permission Status
 */
export const checkMediaLibraryPermission = async () => {
  try {
    const { status } = await MediaLibrary.getPermissionsAsync();
    return status;
  } catch (error) {
    console.error('Error checking media library permission:', error);
    return 'undetermined';
  }
};

/**
 * Request Media Library Permission
 */
export const requestMediaLibraryPermission = async () => {
  try {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    return status;
  } catch (error) {
    console.error('Error requesting media library permission:', error);
    return 'denied';
  }
};

/**
 * Check Multiple Permissions
 */
export const checkMultiplePermissions = async () => {
  try {
    return {
      camera: await checkCameraPermission(),
      location: await checkLocationPermission(),
      locationBackground: await checkLocationBackgroundPermission(),
      contacts: await checkContactsPermission(),
      notifications: await checkNotificationPermission(),
      mediaLibrary: await checkMediaLibraryPermission(),
    };
  } catch (error) {
    console.error('Error checking multiple permissions:', error);
    return null;
  }
};

/**
 * Request Multiple Permissions
 */
export const requestMultiplePermissions = async () => {
  try {
    return {
      camera: await requestCameraPermission(),
      location: await requestLocationPermission(),
      contacts: await requestContactsPermission(),
      notifications: await requestNotificationPermission(),
      mediaLibrary: await requestMediaLibraryPermission(),
    };
  } catch (error) {
    console.error('Error requesting multiple permissions:', error);
    return null;
  }
};

export default {
  // Camera
  checkCameraPermission,
  requestCameraPermission,

  // Location
  checkLocationPermission,
  requestLocationPermission,
  checkLocationBackgroundPermission,
  requestLocationBackgroundPermission,

  // Contacts
  checkContactsPermission,
  requestContactsPermission,

  // Notifications
  checkNotificationPermission,
  requestNotificationPermission,

  // Media Library
  checkMediaLibraryPermission,
  requestMediaLibraryPermission,

  // Multiple
  checkMultiplePermissions,
  requestMultiplePermissions,
};
