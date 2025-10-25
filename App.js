/**
 * SafeRoute Main App Entry Point
 */

import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { onAuthStateChanged } from 'firebase/auth';
import * as Notifications from 'expo-notifications';

// Import navigation
import AppNavigator from './src/navigation/AppNavigator';

// Import Firebase
import { auth } from './src/config/firebaseConfig';

// Import utilities
import { requestAllPermissions } from './src/utils/permissions';
import { THEME_COLORS } from './src/utils/constants';

// Import Theme Provider
import { ThemeProvider } from './src/context/ThemeContext';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  // Initialize app and request permissions
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Request necessary permissions
        const permissions = await requestAllPermissions();
        console.log('Permissions status:', permissions);

        // Register for push notifications
        await registerForPushNotificationsAsync();
      } catch (error) {
        console.error('Error initializing app:', error);
      }
    };

    initializeApp();
  }, []);

  // Listen to authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthenticated(!!currentUser);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Register for push notifications
  const registerForPushNotificationsAsync = async () => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Push notification permission not granted');
        return;
      }

      // Get push notification token (only works with valid Expo project)
      // Skip in development/offline mode to prevent errors
      if (__DEV__) {
        console.log('Push notification token skipped in development mode');
        return;
      }

      const token = (await Notifications.getExpoPushTokenAsync()).data;
      console.log('Push notification token:', token);

      // You can save this token to Firebase for the user
      // await saveNotificationToken(user.uid, token);
    } catch (error) {
      console.error('Error getting push notification token:', error);
      // Non-critical error, app can continue without push notifications
    }
  };

  // Show loading screen while checking auth state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={THEME_COLORS.PRIMARY} />
      </View>
    );
  }

  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <AppNavigator isAuthenticated={isAuthenticated} />
      </SafeAreaProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME_COLORS.BACKGROUND,
  },
});
