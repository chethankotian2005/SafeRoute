import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Switch,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { Camera } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import * as Notifications from 'expo-notifications';
import { useTheme } from '../context/ThemeContext';
import { THEME_COLORS } from '../utils/constants';
import * as permissionsService from '../services/permissionsService';
import * as securityService from '../services/securityService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PrivacySecurityScreen = ({ navigation }) => {
  const { colors } = useTheme();

  // Permissions state
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [contactsEnabled, setContactsEnabled] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [mediaLibraryEnabled, setMediaLibraryEnabled] = useState(false);

  // Security state
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState('15');
  const [dataEncryption, setDataEncryption] = useState(true);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);
  const [locationHistoryEnabled, setLocationHistoryEnabled] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    initializeSettings();
  }, []);

  const initializeSettings = async () => {
    try {
      setLoading(true);

      // Check permissions
      const cameraStatus = await permissionsService.checkCameraPermission();
      setCameraEnabled(cameraStatus === 'granted');

      const locationStatus = await permissionsService.checkLocationPermission();
      setLocationEnabled(locationStatus === 'granted');

      const contactsStatus = await permissionsService.checkContactsPermission();
      setContactsEnabled(contactsStatus === 'granted');

      const notificationStatus = await permissionsService.checkNotificationPermission();
      setNotificationsEnabled(notificationStatus === 'granted');

      const mediaStatus = await permissionsService.checkMediaLibraryPermission();
      setMediaLibraryEnabled(mediaStatus === 'granted');

      // Check security settings
      const biometricAvail = await securityService.isBiometricAvailable();
      setBiometricAvailable(biometricAvail);

      const biometricEnabled = await securityService.isBiometricEnabled();
      setBiometricEnabled(biometricEnabled);

      const timeout = await securityService.getSessionTimeout();
      setSessionTimeout(timeout);

      const encrypted = await securityService.isDataEncrypted();
      setDataEncryption(encrypted);

      const analytics = await securityService.isAnalyticsEnabled();
      setAnalyticsEnabled(analytics);

      const history = await securityService.isLocationHistoryEnabled();
      setLocationHistoryEnabled(history);
    } catch (error) {
      console.error('Error initializing settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCameraToggle = async (value) => {
    try {
      if (value) {
        const status = await permissionsService.requestCameraPermission();
        if (status === 'granted') {
          setCameraEnabled(true);
          Alert.alert('Permission Granted', 'Camera access enabled');
        } else {
          Alert.alert('Permission Denied', 'Camera permission was not granted');
        }
      } else {
        setCameraEnabled(false);
        Alert.alert('Camera Disabled', 'You can re-enable this in app settings');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update camera permission');
    }
  };

  const handleLocationToggle = async (value) => {
    try {
      if (value) {
        const status = await permissionsService.requestLocationPermission();
        if (status === 'granted') {
          setLocationEnabled(true);
          Alert.alert('Permission Granted', 'Location access enabled');
        } else {
          Alert.alert('Permission Denied', 'Location permission was not granted');
        }
      } else {
        setLocationEnabled(false);
        Alert.alert('Location Disabled', 'You can re-enable this in app settings');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update location permission');
    }
  };

  const handleContactsToggle = async (value) => {
    try {
      if (value) {
        const status = await permissionsService.requestContactsPermission();
        if (status === 'granted') {
          setContactsEnabled(true);
          Alert.alert('Permission Granted', 'Contacts access enabled');
        } else {
          Alert.alert('Permission Denied', 'Contacts permission was not granted');
        }
      } else {
        setContactsEnabled(false);
        Alert.alert('Contacts Disabled', 'You can re-enable this in app settings');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update contacts permission');
    }
  };

  const handleNotificationsToggle = async (value) => {
    try {
      if (value) {
        const status = await permissionsService.requestNotificationPermission();
        if (status === 'granted') {
          setNotificationsEnabled(true);
          Alert.alert('Permission Granted', 'Notifications enabled');
        } else {
          Alert.alert('Permission Denied', 'Notification permission was not granted');
        }
      } else {
        setNotificationsEnabled(false);
        Alert.alert('Notifications Disabled', 'You can re-enable this in app settings');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update notification permission');
    }
  };

  const handleMediaToggle = async (value) => {
    try {
      if (value) {
        const status = await permissionsService.requestMediaLibraryPermission();
        if (status === 'granted') {
          setMediaLibraryEnabled(true);
          Alert.alert('Permission Granted', 'Media library access enabled');
        } else {
          Alert.alert('Permission Denied', 'Media library permission was not granted');
        }
      } else {
        setMediaLibraryEnabled(false);
        Alert.alert('Media Access Disabled', 'You can re-enable this in app settings');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update media permission');
    }
  };

  const handleBiometricToggle = async (value) => {
    try {
      if (value) {
        if (biometricAvailable) {
          await securityService.enableBiometric();
          setBiometricEnabled(true);
          Alert.alert('Success', 'Biometric authentication enabled');
        } else {
          Alert.alert('Not Available', 'Biometric authentication is not available on this device');
        }
      } else {
        await securityService.disableBiometric();
        setBiometricEnabled(false);
        Alert.alert('Disabled', 'Biometric authentication disabled');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update biometric setting');
    }
  };

  const handleAnalyticsToggle = async (value) => {
    try {
      await securityService.setAnalyticsEnabled(value);
      setAnalyticsEnabled(value);
    } catch (error) {
      Alert.alert('Error', 'Failed to update analytics setting');
    }
  };

  const handleLocationHistoryToggle = async (value) => {
    try {
      await securityService.setLocationHistoryEnabled(value);
      setLocationHistoryEnabled(value);
    } catch (error) {
      Alert.alert('Error', 'Failed to update location history setting');
    }
  };

  const handleSessionTimeoutChange = (timeout) => {
    Alert.alert(
      'Session Timeout',
      `Set session timeout to ${timeout} minutes?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Set',
          onPress: async () => {
            try {
              await securityService.setSessionTimeout(timeout);
              setSessionTimeout(timeout);
              Alert.alert('Updated', `Session timeout set to ${timeout} minutes`);
            } catch (error) {
              Alert.alert('Error', 'Failed to update session timeout');
            }
          },
        },
      ]
    );
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear App Data',
      'This will delete all cached data and local storage. You will need to log in again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await securityService.clearAppData();
              Alert.alert('Success', 'App data cleared');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear app data');
            }
          },
        },
      ]
    );
  };

  const handleExportData = () => {
    Alert.alert(
      'Export Data',
      'Your data will be prepared for download. This may take a few moments.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export',
          onPress: async () => {
            try {
              const dataUrl = await securityService.exportUserData();
              Alert.alert('Success', 'Your data has been exported and is ready for download');
            } catch (error) {
              Alert.alert('Error', 'Failed to export data');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={THEME_COLORS.PRIMARY} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <LinearGradient
        colors={[THEME_COLORS.BRAND_BLACK, '#2D2D2D']}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy & Security</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      {/* Content */}
      <View style={styles.content}>
        {/* Permissions Section */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="lock-open-outline" size={24} color={THEME_COLORS.PRIMARY} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>App Permissions</Text>
          </View>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            Control what data SafeRoute can access on your device
          </Text>

          {/* Camera */}
          <PermissionRow
            icon="camera-outline"
            label="Camera"
            description="For profile photos and incident photos"
            enabled={cameraEnabled}
            onToggle={handleCameraToggle}
            colors={colors}
          />

          {/* Location */}
          <PermissionRow
            icon="location-outline"
            label="Location"
            description="For navigation and safety features"
            enabled={locationEnabled}
            onToggle={handleLocationToggle}
            colors={colors}
          />

          {/* Contacts */}
          <PermissionRow
            icon="contacts-outline"
            label="Contacts"
            description="For emergency contact management"
            enabled={contactsEnabled}
            onToggle={handleContactsToggle}
            colors={colors}
          />

          {/* Notifications */}
          <PermissionRow
            icon="notifications-outline"
            label="Notifications"
            description="For safety alerts and updates"
            enabled={notificationsEnabled}
            onToggle={handleNotificationsToggle}
            colors={colors}
          />

          {/* Media Library */}
          <PermissionRow
            icon="image-outline"
            label="Media Library"
            description="For photo uploads"
            enabled={mediaLibraryEnabled}
            onToggle={handleMediaToggle}
            colors={colors}
          />
        </View>

        {/* Security Section */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="shield-checkmark-outline" size={24} color={THEME_COLORS.SAFETY_GREEN} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Security Features</Text>
          </View>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            Enhanced security options to protect your account
          </Text>

          {/* Biometric Authentication */}
          {biometricAvailable && (
            <PermissionRow
              icon="finger-print-outline"
              label="Biometric Authentication"
              description="Use fingerprint or face recognition to unlock"
              enabled={biometricEnabled}
              onToggle={handleBiometricToggle}
              colors={colors}
            />
          )}

          {/* Session Timeout */}
          <View style={[styles.rowContainer, { borderBottomColor: colors.border }]}>
            <View style={styles.rowContent}>
              <Ionicons name="time-outline" size={22} color={colors.textSecondary} />
              <View style={styles.rowText}>
                <Text style={[styles.rowLabel, { color: colors.text }]}>Session Timeout</Text>
                <Text style={[styles.rowDescription, { color: colors.textSecondary }]}>
                  Auto logout after {sessionTimeout} minutes of inactivity
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.dropdownButton, { backgroundColor: colors.background }]}
              onPress={() => {
                Alert.alert(
                  'Session Timeout',
                  'Choose timeout duration:',
                  [
                    { text: '5 minutes', onPress: () => handleSessionTimeoutChange('5') },
                    { text: '15 minutes', onPress: () => handleSessionTimeoutChange('15') },
                    { text: '30 minutes', onPress: () => handleSessionTimeoutChange('30') },
                    { text: '1 hour', onPress: () => handleSessionTimeoutChange('60') },
                    { text: 'Never', onPress: () => handleSessionTimeoutChange('never') },
                    { text: 'Cancel', style: 'cancel' },
                  ]
                );
              }}
            >
              <Text style={{ color: THEME_COLORS.PRIMARY, fontWeight: '600' }}>
                {sessionTimeout === 'never' ? 'Never' : `${sessionTimeout}m`}
              </Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Data Encryption */}
          <PermissionRow
            icon="lock-closed-outline"
            label="Data Encryption"
            description="All sensitive data is encrypted"
            enabled={dataEncryption}
            onToggle={() => {}}
            disabled={true}
            colors={colors}
          />
        </View>

        {/* Privacy Section */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="eye-off-outline" size={24} color={THEME_COLORS.ACCENT_BLUE} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Privacy Settings</Text>
          </View>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            Control your data collection preferences
          </Text>

          {/* Analytics */}
          <PermissionRow
            icon="bar-chart-outline"
            label="Analytics"
            description="Help improve app by sharing usage data"
            enabled={analyticsEnabled}
            onToggle={handleAnalyticsToggle}
            colors={colors}
          />

          {/* Location History */}
          <PermissionRow
            icon="navigate-outline"
            label="Location History"
            description="Store your navigation history for statistics"
            enabled={locationHistoryEnabled}
            onToggle={handleLocationHistoryToggle}
            colors={colors}
          />
        </View>

        {/* Data Management Section */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="server-outline" size={24} color={THEME_COLORS.WARNING_ORANGE} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Data Management</Text>
          </View>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: `${THEME_COLORS.ACCENT_BLUE}15`, borderColor: THEME_COLORS.ACCENT_BLUE }]}
            onPress={handleExportData}
          >
            <Ionicons name="download-outline" size={20} color={THEME_COLORS.ACCENT_BLUE} />
            <Text style={[styles.actionButtonText, { color: THEME_COLORS.ACCENT_BLUE }]}>
              Export My Data
            </Text>
            <Ionicons name="chevron-forward" size={20} color={THEME_COLORS.ACCENT_BLUE} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: `${THEME_COLORS.ALERT_RED}15`, borderColor: THEME_COLORS.ALERT_RED, marginTop: 12 }]}
            onPress={handleClearData}
          >
            <Ionicons name="trash-outline" size={20} color={THEME_COLORS.ALERT_RED} />
            <Text style={[styles.actionButtonText, { color: THEME_COLORS.ALERT_RED }]}>
              Clear App Data
            </Text>
            <Ionicons name="chevron-forward" size={20} color={THEME_COLORS.ALERT_RED} />
          </TouchableOpacity>
        </View>

        {/* Info Section */}
        <View style={[styles.infoSection, { backgroundColor: `${THEME_COLORS.ACCENT_BLUE}15`, borderColor: THEME_COLORS.ACCENT_BLUE }]}>
          <Ionicons name="information-circle-outline" size={20} color={THEME_COLORS.ACCENT_BLUE} />
          <Text style={[styles.infoText, { color: colors.text }]}>
            Your privacy is important to us. All data is encrypted and stored securely. We never sell your personal information.
          </Text>
        </View>
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
};

// Permission Row Component
const PermissionRow = ({ icon, label, description, enabled, onToggle, disabled, colors }) => {
  return (
    <View style={[styles.rowContainer, { borderBottomColor: colors.border }]}>
      <View style={styles.rowContent}>
        <Ionicons
          name={icon}
          size={22}
          color={enabled ? THEME_COLORS.PRIMARY : colors.textSecondary}
        />
        <View style={styles.rowText}>
          <Text style={[styles.rowLabel, { color: colors.text }]}>{label}</Text>
          <Text style={[styles.rowDescription, { color: colors.textSecondary }]}>
            {description}
          </Text>
        </View>
      </View>
      <Switch
        value={enabled}
        onValueChange={onToggle}
        disabled={disabled}
        trackColor={{ false: colors.border, true: `${THEME_COLORS.PRIMARY}80` }}
        thumbColor={enabled ? THEME_COLORS.PRIMARY : colors.textSecondary}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  content: {
    padding: 16,
    gap: 16,
  },
  section: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  sectionDescription: {
    fontSize: 12,
    marginBottom: 16,
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  rowContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginRight: 12,
  },
  rowText: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  rowDescription: {
    fontSize: 12,
  },
  dropdownButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 12,
  },
  actionButtonText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  infoSection: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
});

export default PrivacySecurityScreen;
