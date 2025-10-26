/**
 * SOS Notification Service
 * Handles all SOS-related notifications and alerts
 */

import * as Notifications from 'expo-notifications';
import { Vibration, Platform } from 'react-native';

/**
 * Send SOS activated notification to user
 * Called when user activates SOS on their device
 */
export const sendSOSActivatedNotification = async () => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '✅ SOS Activated',
        body: 'Your emergency alert has been sent to nearby users and contacts. Stay safe!',
        sound: 'default',
        priority: 'high',
        badge: 1,
        data: { type: 'SOS_ACTIVATED' },
      },
      trigger: null, // Trigger immediately
    });
  } catch (error) {
    console.error('Error sending SOS activated notification:', error);
  }
};

/**
 * Send SOS deactivated notification to user
 * Called when user deactivates SOS on their device
 */
export const sendSOSDeactivatedNotification = async () => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'SOS Deactivated',
        body: 'Your emergency alert has been turned off.',
        sound: 'default',
        badge: 0,
        data: { type: 'SOS_DEACTIVATED' },
      },
      trigger: null,
    });
  } catch (error) {
    console.error('Error sending SOS deactivated notification:', error);
  }
};

/**
 * Send nearby SOS alert notification
 * Called when a nearby SOS is detected
 */
export const sendNearbySOSNotification = (distance, sosId) => {
  try {
    // Trigger strong vibration pattern
    const vibrationPattern = Platform.OS === 'ios' 
      ? [0, 100, 100, 100, 100, 100]
      : [0, 300, 200, 300, 200, 300];
    
    Vibration.vibrate(vibrationPattern);

    const distanceDisplay = Math.round(distance);
    const distanceText = distanceDisplay < 1000 
      ? `${distanceDisplay}m away` 
      : `${(distanceDisplay / 1000).toFixed(1)}km away`;

    return Notifications.scheduleNotificationAsync({
      content: {
        title: '🚨 SOS DEPLOYED NEARBY 🚨',
        body: `Emergency alert activated ${distanceText}. Someone needs help!`,
        sound: 'default',
        priority: 'high',
        badge: 1,
        data: { sosId, distance, type: 'NEARBY_SOS' },
        vibrate: [100, 100, 100],
      },
      trigger: null,
    });
  } catch (error) {
    console.error('Error sending nearby SOS notification:', error);
  }
};

/**
 * Clear all notifications and badge count
 */
export const clearNotifications = async () => {
  try {
    await Notifications.dismissAllNotificationsAsync();
    await Notifications.setBadgeCountAsync(0);
  } catch (error) {
    console.error('Error clearing notifications:', error);
  }
};

/**
 * Set badge count
 */
export const setBadgeCount = async (count) => {
  try {
    if (Platform.OS === 'ios') {
      await Notifications.setBadgeCountAsync(count);
    }
  } catch (error) {
    console.error('Error setting badge count:', error);
  }
};

/**
 * Configure notification handler
 */
export const configureNotificationHandler = () => {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
};

export default {
  sendSOSActivatedNotification,
  sendSOSDeactivatedNotification,
  sendNearbySOSNotification,
  clearNotifications,
  setBadgeCount,
  configureNotificationHandler,
};
