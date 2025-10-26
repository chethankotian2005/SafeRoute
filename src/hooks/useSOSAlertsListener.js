import { useEffect, useRef } from 'react';
import { Alert, Vibration, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import firebaseService from '../services/firebaseService';
import useLocation from './useLocation';
import { calculateDistance } from '../utils/helpers';
import { getCurrentUser } from '../services/firebaseService';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Hook: useSOSAlertsListener
 * Listens to active SOS alerts and notifies the user if an alert originates
 * within the specified radius from the device's current location.
 * 
 * Features:
 * - Sends push notifications with sound and vibration
 * - Shows in-app alerts for nearby SOS events
 * - Prevents duplicate notifications for the same alert
 * - Calculates distance and radius to determine alerts
 *
 * Mount this once (e.g., in App.js) so the app can alert users to nearby SOS events.
 */
const useSOSAlertsListener = () => {
  const alertedRef = useRef(new Set());
  const { getCurrentLocation } = useLocation(false);

  // Request notification permissions
  useEffect(() => {
    const requestPermissions = async () => {
      try {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
          console.warn('Notification permissions not granted');
        }
      } catch (error) {
        console.log('Notification permissions skipped:', error.message);
        // Non-critical - app can function without notifications
      }
    };

    requestPermissions();
  }, []);

  useEffect(() => {
    let unsubscribe = null;

    try {
      unsubscribe = firebaseService.listenToActiveSOSAlerts(async (alerts) => {
        if (!alerts || alerts.length === 0) return;

        let deviceLocation = null;
        try {
          deviceLocation = await getCurrentLocation();
        } catch (err) {
          console.warn('Could not get device location for SOS listener:', err);
          return;
        }

        for (const alert of alerts) {
          try {
            if (!alert || !alert.id) continue;

            // Don't notify about your own SOS alert
            const currentUser = getCurrentUser();
            if (currentUser && alert.userId === currentUser.uid) continue;

            // Avoid notifying about the same alert repeatedly
            if (alertedRef.current.has(alert.id)) continue;

            // Ensure alert has location and radius
            if (!alert.location) continue;

            const alertLocation = {
              latitude: alert.location.latitude,
              longitude: alert.location.longitude,
            };

            const distanceMeters = calculateDistance(deviceLocation, alertLocation);
            const radiusMeters = (alert.radiusKm || 0.5) * 1000;

            if (distanceMeters <= radiusMeters) {
              // Mark as alerted
              alertedRef.current.add(alert.id);

              // Trigger strong vibration pattern for urgent alert
              try {
                const vibrationPattern = Platform.OS === 'ios' 
                  ? [0, 100, 100, 100, 100, 100]  // Pattern: wait, vibrate, wait, vibrate...
                  : [0, 300, 200, 300, 200, 300]; // Longer for Android
                Vibration.vibrate(vibrationPattern);
              } catch (vibErr) {
                console.warn('Failed to trigger vibration:', vibErr);
              }

              const distanceDisplay = Math.round(distanceMeters);
              const distanceText = distanceDisplay < 1000 
                ? `${distanceDisplay}m away` 
                : `${(distanceDisplay / 1000).toFixed(1)}km away`;

              // Schedule a local push notification with high priority
              try {
                await Notifications.scheduleNotificationAsync({
                  content: {
                    title: '🚨 SOS DEPLOYED NEARBY 🚨',
                    body: `Emergency alert activated ${distanceText}. Someone needs help!`,
                    sound: 'default',
                    priority: 'high',
                    badge: 1,
                    data: { sosId: alert.id, distance: distanceMeters },
                    vibrate: [100, 100, 100],
                  },
                  trigger: null, // Trigger immediately
                });
              } catch (notifErr) {
                console.warn('Failed to schedule local notification:', notifErr);
              }

              // Show in-app alert with action buttons
              Alert.alert(
                '🚨 SOS DEPLOYED NEARBY',
                `Emergency SOS activated ${distanceText} from your location.\n\nSomeone nearby needs help!`,
                [
                  { 
                    text: 'View Location', 
                    onPress: () => {
                      console.log('User viewing SOS location:', alert.id);
                    } 
                  },
                  { 
                    text: 'Close', 
                    style: 'cancel'
                  },
                ],
                { cancelable: false }
              );
            }
          } catch (err) {
            console.error('Error handling sos alert:', err);
          }
        }
      });
    } catch (error) {
      console.error('Error starting SOS listener:', error);
    }

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [getCurrentLocation]);
};

export default useSOSAlertsListener;
