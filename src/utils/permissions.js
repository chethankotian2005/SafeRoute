/**
 * Permission Utilities
 * Handles all app permission requests and checks
 */

import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Platform, Linking } from 'react-native';

/**
 * Request location permissions (foreground and background)
 * @returns {Promise<Object>} Permission status object
 */
export const requestLocationPermission = async () => {
  try {
    // Request foreground location permission
    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
    
    if (foregroundStatus !== 'granted') {
      Alert.alert(
        'Location Permission Required',
        'SafeRoute needs your location to provide safe navigation routes.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]
      );
      return { granted: false, canAskAgain: false };
    }

    // Request background location permission for SOS features
    const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
    
    return {
      granted: foregroundStatus === 'granted',
      backgroundGranted: backgroundStatus === 'granted',
      canAskAgain: true,
    };
  } catch (error) {
    console.error('Error requesting location permission:', error);
    return { granted: false, canAskAgain: false };
  }
};

/**
 * Check if location permissions are granted
 * @returns {Promise<boolean>}
 */
export const checkLocationPermission = async () => {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error checking location permission:', error);
    return false;
  }
};

/**
 * Request notification permissions
 * @returns {Promise<boolean>}
 */
export const requestNotificationPermission = async () => {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      Alert.alert(
        'Notification Permission Required',
        'SafeRoute needs notification permission to alert you about safety concerns and emergency situations.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

/**
 * Request camera permissions
 * @returns {Promise<boolean>}
 */
export const requestCameraPermission = async () => {
  try {
    const { status } = await Camera.requestCameraPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert(
        'Camera Permission Required',
        'SafeRoute needs camera permission to allow you to attach photos to safety reports.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error requesting camera permission:', error);
    return false;
  }
};

/**
 * Request media library permissions
 * @returns {Promise<boolean>}
 */
export const requestMediaLibraryPermission = async () => {
  try {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert(
        'Photo Library Permission Required',
        'SafeRoute needs access to your photo library to attach images to reports.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error requesting media library permission:', error);
    return false;
  }
};

/**
 * Request all necessary permissions at app startup
 * @returns {Promise<Object>} Object with all permission statuses
 */
export const requestAllPermissions = async () => {
  const permissions = {
    location: false,
    backgroundLocation: false,
    notifications: false,
    camera: false,
    mediaLibrary: false,
  };

  try {
    // Location permissions (most critical)
    const locationResult = await requestLocationPermission();
    permissions.location = locationResult.granted;
    permissions.backgroundLocation = locationResult.backgroundGranted;

    // Notification permissions
    permissions.notifications = await requestNotificationPermission();

    // Camera and media library (optional, request when needed)
    // Not requesting at startup to avoid overwhelming the user
    
    return permissions;
  } catch (error) {
    console.error('Error requesting all permissions:', error);
    return permissions;
  }
};

/**
 * Check all permission statuses
 * @returns {Promise<Object>} Object with all permission statuses
 */
export const checkAllPermissions = async () => {
  const permissions = {
    location: false,
    backgroundLocation: false,
    notifications: false,
    camera: false,
    mediaLibrary: false,
  };

  try {
    // Check location permissions
    const { status: foregroundStatus } = await Location.getForegroundPermissionsAsync();
    permissions.location = foregroundStatus === 'granted';

    const { status: backgroundStatus } = await Location.getBackgroundPermissionsAsync();
    permissions.backgroundLocation = backgroundStatus === 'granted';

    // Check notification permissions
    const { status: notificationStatus } = await Notifications.getPermissionsAsync();
    permissions.notifications = notificationStatus === 'granted';

    // Check camera permissions
    const { status: cameraStatus } = await Camera.getCameraPermissionsAsync();
    permissions.camera = cameraStatus === 'granted';

    // Check media library permissions
    const { status: mediaStatus } = await ImagePicker.getMediaLibraryPermissionsAsync();
    permissions.mediaLibrary = mediaStatus === 'granted';

    return permissions;
  } catch (error) {
    console.error('Error checking permissions:', error);
    return permissions;
  }
};

/**
 * Show permission rationale dialog
 * @param {string} permissionType - Type of permission to explain
 */
export const showPermissionRationale = (permissionType) => {
  const rationales = {
    location: {
      title: 'Location Permission',
      message: 'SafeRoute uses your location to:\n\n• Find safe routes to your destination\n• Show nearby safe spots and emergency services\n• Enable SOS features\n• Provide real-time safety alerts',
    },
    backgroundLocation: {
      title: 'Background Location',
      message: 'Background location access is needed for:\n\n• Emergency SOS tracking\n• Sharing your live location with emergency contacts\n• Continuous safety monitoring during navigation',
    },
    notifications: {
      title: 'Notification Permission',
      message: 'Notifications help you stay safe by:\n\n• Alerting you about safety concerns on your route\n• Notifying emergency contacts during SOS\n• Sharing community safety alerts\n• Providing important safety tips',
    },
    camera: {
      title: 'Camera Permission',
      message: 'Camera access allows you to:\n\n• Document safety concerns with photos\n• Attach images to community reports\n• Help other users make informed decisions',
    },
    mediaLibrary: {
      title: 'Photo Library Permission',
      message: 'Photo library access allows you to:\n\n• Select existing photos for safety reports\n• Share visual evidence of safety concerns\n• Update your profile picture',
    },
  };

  const rationale = rationales[permissionType];
  if (rationale) {
    Alert.alert(rationale.title, rationale.message, [
      { text: 'Understood', style: 'default' },
    ]);
  }
};

/**
 * Navigate user to app settings
 */
export const openAppSettings = () => {
  Linking.openSettings();
};

/**
 * Get permission status text for display
 * @param {string} status - Permission status
 * @returns {string} Human-readable status
 */
export const getPermissionStatusText = (status) => {
  switch (status) {
    case 'granted':
      return 'Allowed';
    case 'denied':
      return 'Denied';
    case 'undetermined':
      return 'Not Set';
    default:
      return 'Unknown';
  }
};

export default {
  requestLocationPermission,
  checkLocationPermission,
  requestNotificationPermission,
  requestCameraPermission,
  requestMediaLibraryPermission,
  requestAllPermissions,
  checkAllPermissions,
  showPermissionRationale,
  openAppSettings,
  getPermissionStatusText,
};
