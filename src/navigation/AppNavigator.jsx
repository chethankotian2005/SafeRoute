/**
 * App Navigator
 * Main navigation structure for the app
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

// Import screens (we'll create these next)
import HomeScreen from '../screens/HomeScreen';
import MapScreen from '../screens/MapScreen';
import NavigateScreen from '../screens/NavigateScreen';
import CommunityScreen from '../screens/CommunityScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import EmergencyContactsScreen from '../screens/EmergencyContactsScreen';
import PrivacySecurityScreen from '../screens/PrivacySecurityScreen';
import SOSScreen from '../screens/SOSScreen';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import RouteDetailsScreen from '../screens/RouteDetailsScreen';
import ReportFormScreen from '../screens/ReportFormScreen';
import SettingsScreen from '../screens/SettingsScreen';
import RecentDestinationsScreen from '../screens/RecentDestinationsScreen';
import LiveNavigationScreen from '../screens/LiveNavigationScreen';

import { THEME_COLORS } from '../utils/constants';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

/**
 * Tab Navigator for main app screens
 */
const MainTabNavigator = () => {
  const { colors, isDarkMode } = useTheme();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Navigate':
              iconName = focused ? 'navigate' : 'navigate-outline';
              break;
            case 'Community':
              iconName = focused ? 'people' : 'people-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'help-circle-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: isDarkMode ? THEME_COLORS.PRIMARY : THEME_COLORS.PRIMARY,
        tabBarInactiveTintColor: isDarkMode ? '#808080' : colors.textSecondary,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
          color: isDarkMode ? '#FFFFFF' : '#1F2937',
        },
        tabBarStyle: {
          backgroundColor: isDarkMode ? '#121212' : '#FFFFFF',
          borderTopColor: isDarkMode ? '#333333' : '#E5E7EB',
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        headerStyle: {
          backgroundColor: THEME_COLORS.PRIMARY,
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'SafeRoute' }}
      />
      <Tab.Screen
        name="Navigate"
        component={NavigateScreen}
        options={{ 
          title: 'Navigate',
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Community"
        component={CommunityScreen}
        options={{ 
          title: 'Community',
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

/**
 * Authentication Navigator
 */
const AuthNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Signup"
      screenOptions={{
        headerStyle: {
          backgroundColor: THEME_COLORS.PRIMARY,
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="Signup"
        component={SignupScreen}
        options={{ title: 'Create Account' }}
      />
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

/**
 * Main App Navigator
 */
const AppNavigator = ({ isAuthenticated }) => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: THEME_COLORS.PRIMARY,
          },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        {isAuthenticated ? (
          <>
            <Stack.Screen
              name="MainTabs"
              component={MainTabNavigator}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="EditProfile"
              component={EditProfileScreen}
              options={{ title: 'Edit Profile' }}
            />
            <Stack.Screen
              name="EmergencyContacts"
              component={EmergencyContactsScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="PrivacySecurity"
              component={PrivacySecurityScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="SOS"
              component={SOSScreen}
              options={{
                // Hide default stack header to avoid duplicate title with custom in-screen header
                headerShown: false,
                presentation: 'modal',
              }}
            />
            <Stack.Screen
              name="RouteDetails"
              component={RouteDetailsScreen}
              options={{ title: 'Route Details' }}
            />
            <Stack.Screen
              name="ReportForm"
              component={ReportFormScreen}
              options={{
                title: 'Report Safety Concern',
                presentation: 'modal',
              }}
            />
            <Stack.Screen
              name="Settings"
              component={SettingsScreen}
              options={{ title: 'Settings' }}
            />
            <Stack.Screen
              name="RecentDestinations"
              component={RecentDestinationsScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="LiveNavigation"
              component={LiveNavigationScreen}
              options={{ 
                headerShown: false,
                presentation: 'fullScreenModal',
              }}
            />
          </>
        ) : (
          <Stack.Screen
            name="Auth"
            component={AuthNavigator}
            options={{ headerShown: false }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
