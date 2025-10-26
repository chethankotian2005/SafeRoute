/**
 * Security Service
 * Handles security features like biometric auth, session timeout, data encryption
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';

const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';
const SESSION_TIMEOUT_KEY = 'session_timeout';
const ANALYTICS_ENABLED_KEY = 'analytics_enabled';
const LOCATION_HISTORY_KEY = 'location_history_enabled';
const DATA_ENCRYPTED_KEY = 'data_encrypted';

/**
 * Check if biometric authentication is available
 */
export const isBiometricAvailable = async () => {
  try {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return compatible && enrolled;
  } catch (error) {
    console.error('Error checking biometric availability:', error);
    return false;
  }
};

/**
 * Check if biometric is enabled
 */
export const isBiometricEnabled = async () => {
  try {
    const enabled = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
    return enabled === 'true';
  } catch (error) {
    console.error('Error checking biometric status:', error);
    return false;
  }
};

/**
 * Enable biometric authentication
 */
export const enableBiometric = async () => {
  try {
    const available = await isBiometricAvailable();
    if (!available) {
      throw new Error('Biometric authentication not available');
    }

    // Test biometric authentication
    const result = await LocalAuthentication.authenticateAsync({
      disableDeviceFallback: false,
      reason: 'Authenticate to enable biometric security',
    });

    if (result.success) {
      await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, 'true');
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error enabling biometric:', error);
    throw error;
  }
};

/**
 * Disable biometric authentication
 */
export const disableBiometric = async () => {
  try {
    await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, 'false');
  } catch (error) {
    console.error('Error disabling biometric:', error);
    throw error;
  }
};

/**
 * Authenticate with biometric
 */
export const authenticateWithBiometric = async () => {
  try {
    const enabled = await isBiometricEnabled();
    if (!enabled) {
      return false;
    }

    const result = await LocalAuthentication.authenticateAsync({
      disableDeviceFallback: false,
      reason: 'Authenticate to access SafeRoute',
    });

    return result.success;
  } catch (error) {
    console.error('Error during biometric authentication:', error);
    return false;
  }
};

/**
 * Get session timeout setting
 */
export const getSessionTimeout = async () => {
  try {
    const timeout = await AsyncStorage.getItem(SESSION_TIMEOUT_KEY);
    return timeout || '15';
  } catch (error) {
    console.error('Error getting session timeout:', error);
    return '15';
  }
};

/**
 * Set session timeout
 */
export const setSessionTimeout = async (minutes) => {
  try {
    await AsyncStorage.setItem(SESSION_TIMEOUT_KEY, String(minutes));
  } catch (error) {
    console.error('Error setting session timeout:', error);
    throw error;
  }
};

/**
 * Check if session is expired
 */
export const isSessionExpired = async () => {
  try {
    const timeout = await getSessionTimeout();
    if (timeout === 'never') return false;

    const lastActivityKey = 'last_activity_time';
    const lastActivity = await AsyncStorage.getItem(lastActivityKey);

    if (!lastActivity) {
      await recordActivity();
      return false;
    }

    const lastTime = parseInt(lastActivity);
    const currentTime = Date.now();
    const timeoutMs = parseInt(timeout) * 60 * 1000;

    return currentTime - lastTime > timeoutMs;
  } catch (error) {
    console.error('Error checking session expiry:', error);
    return false;
  }
};

/**
 * Record user activity
 */
export const recordActivity = async () => {
  try {
    await AsyncStorage.setItem('last_activity_time', String(Date.now()));
  } catch (error) {
    console.error('Error recording activity:', error);
  }
};

/**
 * Check if data encryption is enabled
 */
export const isDataEncrypted = async () => {
  try {
    const encrypted = await AsyncStorage.getItem(DATA_ENCRYPTED_KEY);
    return encrypted !== 'false'; // Default to true
  } catch (error) {
    console.error('Error checking data encryption:', error);
    return true;
  }
};

/**
 * Store encrypted sensitive data
 */
export const storeSecureData = async (key, value) => {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch (error) {
    console.error('Error storing secure data:', error);
    throw error;
  }
};

/**
 * Retrieve encrypted sensitive data
 */
export const getSecureData = async (key) => {
  try {
    return await SecureStore.getItemAsync(key);
  } catch (error) {
    console.error('Error retrieving secure data:', error);
    return null;
  }
};

/**
 * Delete encrypted sensitive data
 */
export const deleteSecureData = async (key) => {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch (error) {
    console.error('Error deleting secure data:', error);
    throw error;
  }
};

/**
 * Check if analytics is enabled
 */
export const isAnalyticsEnabled = async () => {
  try {
    const enabled = await AsyncStorage.getItem(ANALYTICS_ENABLED_KEY);
    return enabled !== 'false'; // Default to true
  } catch (error) {
    console.error('Error checking analytics status:', error);
    return true;
  }
};

/**
 * Set analytics preference
 */
export const setAnalyticsEnabled = async (enabled) => {
  try {
    await AsyncStorage.setItem(ANALYTICS_ENABLED_KEY, String(enabled));
  } catch (error) {
    console.error('Error setting analytics preference:', error);
    throw error;
  }
};

/**
 * Check if location history is enabled
 */
export const isLocationHistoryEnabled = async () => {
  try {
    const enabled = await AsyncStorage.getItem(LOCATION_HISTORY_KEY);
    return enabled !== 'false'; // Default to true
  } catch (error) {
    console.error('Error checking location history status:', error);
    return true;
  }
};

/**
 * Set location history preference
 */
export const setLocationHistoryEnabled = async (enabled) => {
  try {
    await AsyncStorage.setItem(LOCATION_HISTORY_KEY, String(enabled));
  } catch (error) {
    console.error('Error setting location history preference:', error);
    throw error;
  }
};

/**
 * Clear all app data
 */
export const clearAppData = async () => {
  try {
    // Keep only critical auth data
    const authData = await AsyncStorage.getItem('auth_token');
    await AsyncStorage.clear();
    if (authData) {
      await AsyncStorage.setItem('auth_token', authData);
    }
  } catch (error) {
    console.error('Error clearing app data:', error);
    throw error;
  }
};

/**
 * Export user data
 */
export const exportUserData = async () => {
  try {
    const allData = await AsyncStorage.getAllKeys();
    const userData = {};

    for (const key of allData) {
      const value = await AsyncStorage.getItem(key);
      if (!key.includes('auth') && !key.includes('token')) {
        userData[key] = value;
      }
    }

    // Create JSON
    const jsonData = JSON.stringify(userData, null, 2);
    
    // In production, this would generate a downloadable file
    // For now, we're just preparing the data
    console.log('User data exported:', jsonData);
    
    return jsonData;
  } catch (error) {
    console.error('Error exporting user data:', error);
    throw error;
  }
};

/**
 * Generate security report
 */
export const generateSecurityReport = async () => {
  try {
    const report = {
      timestamp: new Date().toISOString(),
      biometricEnabled: await isBiometricEnabled(),
      sessionTimeout: await getSessionTimeout(),
      dataEncrypted: await isDataEncrypted(),
      analyticsEnabled: await isAnalyticsEnabled(),
      locationHistoryEnabled: await isLocationHistoryEnabled(),
    };

    return report;
  } catch (error) {
    console.error('Error generating security report:', error);
    throw error;
  }
};

export default {
  // Biometric
  isBiometricAvailable,
  isBiometricEnabled,
  enableBiometric,
  disableBiometric,
  authenticateWithBiometric,

  // Session
  getSessionTimeout,
  setSessionTimeout,
  isSessionExpired,
  recordActivity,

  // Data Encryption
  isDataEncrypted,
  storeSecureData,
  getSecureData,
  deleteSecureData,

  // Analytics
  isAnalyticsEnabled,
  setAnalyticsEnabled,

  // Location History
  isLocationHistoryEnabled,
  setLocationHistoryEnabled,

  // Data Management
  clearAppData,
  exportUserData,
  generateSecurityReport,
};
