import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Linking, ScrollView, ActivityIndicator, Share, Platform, Modal, PermissionsAndroid } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME_COLORS } from '../utils/constants';
import { auth } from '../config/firebaseConfig';
import firebaseService from '../services/firebaseService';
import { getCurrentLocation } from '../services/locationService';

const SOSScreen = ({ navigation }) => {
  const [isEmergencyActive, setIsEmergencyActive] = useState(false);
  const [sosAlertId, setSosAlertId] = useState(null);
  const [emergencyContacts, setEmergencyContacts] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const countdownTimerRef = useRef(null);
  const user = auth.currentUser;

  // Get current location on mount
  useEffect(() => {
    loadEmergencyContacts();
    loadCurrentLocation();
  }, []);

  const loadCurrentLocation = async () => {
    try {
      const location = await getCurrentLocation();
      setCurrentLocation(location);
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const loadEmergencyContacts = async () => {
    try {
      setLoadingContacts(true);
      const contacts = await firebaseService.getEmergencyContacts(user.uid);
      
      // Add default emergency services if no contacts exist
      const defaultServices = [
        { name: 'Police', number: '100', icon: 'shield' },
        { name: 'Ambulance', number: '108', icon: 'medical' },
        { name: 'Fire', number: '101', icon: 'flame' },
        { name: 'Women Helpline', number: '1091', icon: 'woman' },
      ];
      
      setEmergencyContacts([...defaultServices, ...(contacts || [])]);
    } catch (error) {
      console.error('Error loading emergency contacts:', error);
      // Fallback to default services only
      const defaultServices = [
        { name: 'Police', number: '100', icon: 'shield' },
        { name: 'Ambulance', number: '108', icon: 'medical' },
        { name: 'Fire', number: '101', icon: 'flame' },
        { name: 'Women Helpline', number: '1091', icon: 'woman' },
      ];
      setEmergencyContacts(defaultServices);
    } finally {
      setLoadingContacts(false);
    }
  };

  // Choose a number to call. Pick the first emergency contact; else default to 112
  const pickSOSNumber = () => {
    try {
      const valid = (emergencyContacts || []).filter(c => typeof c.number === 'string' && c.number.replace(/\D/g, '').length >= 3);
      if (valid.length > 0) {
        // Always use the first emergency contact (most important one)
        return valid[0].number;
      }
    } catch (e) {}
    return '112'; // Emergency number fallback
  };

  // Attempt to place an immediate phone call when possible (Android native module), otherwise open the dialer
  const initiateCall = async (number) => {
    const sanitized = number.toString();

    if (Platform.OS === 'android') {
      try {
        // Request call permission
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CALL_PHONE
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          // Use Linking to initiate call
          await Linking.openURL(`tel:${sanitized}`);
          return;
        }
      } catch (e) {
        console.error('Error requesting call permission:', e);
        // Fall through to other strategies
      }

      // Optional fallback to a native module if the app has it
      try {
        // eslint-disable-next-line global-require
        const ImmediatePhoneCall = require('react-native-immediate-phone-call');
        if (ImmediatePhoneCall?.immediatePhoneCall) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.CALL_PHONE
          );
          if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            ImmediatePhoneCall.immediatePhoneCall(sanitized);
            return;
          }
        }
      } catch (_) {}
    }

    // Fallback: open the dialer with number prefilled
    try {
      await Linking.openURL(`tel:${sanitized}`);
    } catch (err) {
      Alert.alert('Call Failed', 'Unable to initiate the call on this device.');
    }
  };

  const startCountdownAndCall = (skipConfirmation = false) => {
    if (showCountdown) return;
    
    // Get the emergency number (first contact or 112)
    const number = pickSOSNumber();
    const contactName = emergencyContacts && emergencyContacts.length > 0 
      ? emergencyContacts[0].name 
      : 'Emergency Services (112)';
    
    // If long-pressed, call immediately without countdown
    if (skipConfirmation) {
      setIsEmergencyActive(true);
      initiateCall(number);
      Alert.alert('📞 Emergency Call', `Calling ${contactName}...`);
      setTimeout(() => {
        setIsEmergencyActive(false);
      }, 2000);
      return;
    }
    
    // Show countdown overlay and auto-call
    setIsEmergencyActive(true);
    setShowCountdown(true);
    setCountdown(3);

    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }

    let t = 3;
    countdownTimerRef.current = setInterval(() => {
      t -= 1;
      setCountdown(t);
      if (t <= 0) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
        setShowCountdown(false);
        // Automatically call after countdown
        initiateCall(number);
        // Show confirmation
        Alert.alert('📞 Calling Emergency', `Connecting to ${contactName}...`);
        setTimeout(() => {
          setIsEmergencyActive(false);
        }, 2000);
      }
    }, 1000);
  };

  const handleEmergencyCall = (number, name) => {
    Alert.alert(
      'Emergency Call',
      `Call ${name} (${number})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call Now',
          style: 'destructive',
          onPress: () => {
            Linking.openURL(`tel:${number}`);
          },
        },
      ]
    );
  };

  const handleQuickSOS = async () => {
    try {
      // Get current location
      let location = currentLocation;
      if (!location) {
        location = await getCurrentLocation();
        setCurrentLocation(location);
      }

      // Share location via SMS/WhatsApp
      const locationUrl = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
      const message = `EMERGENCY! I need help!\n\nMy current location:\n${locationUrl}\n\nSent from SafeRoute`;

      // Show options
      Alert.alert(
        'Emergency Actions',
        'Choose your action:',
        [
          {
            text: 'Call Police (100)',
            onPress: () => {
              Linking.openURL('tel:100');
            },
          },
          {
            text: 'Share Location',
            onPress: async () => {
              try {
                await Share.share({
                  message: message,
                  title: 'Emergency Location',
                });
              } catch (error) {
                console.error('Error sharing:', error);
              }
            },
          },
          {
            text: 'Both',
            style: 'destructive',
            onPress: async () => {
              // Call police
              Linking.openURL('tel:100');
              
              // Share location after a delay
              setTimeout(async () => {
                try {
                  await Share.share({
                    message: message,
                    title: 'Emergency Location',
                  });
                } catch (error) {
                  console.error('Error sharing:', error);
                }
              }, 1000);
            },
          },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    } catch (error) {
      console.error('Quick SOS error:', error);
      Alert.alert('Error', 'Could not get your location. Please check permissions.');
    }
  };

  const handleSOSActivation = async () => {
    if (!isEmergencyActive) {
      Alert.alert(
        'Activate SOS',
        'This will send your location to emergency contacts and notify nearby app users.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Activate',
            style: 'destructive',
            onPress: async () => {
              try {
                setIsEmergencyActive(true);

                // Get current location
                const currentLocation = await getCurrentLocation();

                // Create SOS alert in Firebase (defaults to 0.5 km radius)
                const alertId = await firebaseService.createSOSAlert(currentLocation, emergencyContacts);
                setSosAlertId(alertId);

                // Notification service removed - using Firebase Cloud Messaging instead
                // await sosNotificationService.sendSOSActivatedNotification();

                Alert.alert('SOS ACTIVATED', 'Your emergency alert has been sent to your contacts and nearby users!');
              } catch (err) {
                console.error('Failed to activate SOS:', err);
                Alert.alert('Error', 'Could not activate SOS. Please ensure location permission is granted.');
                setIsEmergencyActive(false);
              }
            },
          },
        ]
      );
    } else {
      // Deactivate existing SOS
      Alert.alert(
        'Deactivate SOS',
        'Are you sure you want to turn off the emergency alert?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Deactivate',
            style: 'destructive',
            onPress: async () => {
              if (sosAlertId) {
                try {
                  await firebaseService.deactivateSOSAlert(sosAlertId);
                  // Notification service removed - using Firebase Cloud Messaging instead
                  // await sosNotificationService.sendSOSDeactivatedNotification();
                } catch (err) {
                  console.error('Failed to deactivate SOS:', err);
                }
              }

              setIsEmergencyActive(false);
              setSosAlertId(null);
              Alert.alert('SOS Deactivated', 'Emergency mode has been turned off.');
            },
          },
        ]
      );
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Emergency SOS</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Quick SOS Actions */}
        <View style={styles.quickActionsContainer}>
          <Text style={styles.quickActionsTitle}>Quick Emergency Actions</Text>
          <TouchableOpacity 
            style={styles.quickSOSButton}
            onPress={handleQuickSOS}
          >
            <LinearGradient
              colors={['#DC2626', '#991B1B']}
              style={styles.quickSOSGradient}
            >
              <Ionicons name="warning" size={32} color="#FFFFFF" />
              <Text style={styles.quickSOSText}>Emergency Help</Text>
              <Text style={styles.quickSOSSubtext}>Share Location & Call Police</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* SOS Button */}
        <View style={styles.sosContainer}>
          <Text style={styles.sosTitle}>Emergency Call</Text>
          <Text style={styles.sosSubtitle}>
            {emergencyContacts && emergencyContacts.length > 0
              ? `Will call: ${emergencyContacts[0].name} (${emergencyContacts[0].number})`
              : 'Will call: Emergency Services (112)'}
          </Text>
          
          <TouchableOpacity
            onPress={() => startCountdownAndCall(false)}
            onLongPress={() => startCountdownAndCall(true)}
            delayLongPress={800}
            style={styles.sosButtonWrapper}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={isEmergencyActive ? ['#DC2626', '#991B1B'] : ['#EF4444', '#DC2626']}
              style={styles.sosButton}
            >
              <Ionicons name="alert-circle" size={60} color="#FFFFFF" />
              <Text style={styles.sosButtonText}>SOS</Text>
              {isEmergencyActive ? (
                <Text style={styles.activeText}>ACTIVE</Text>
              ) : (
                <Text style={styles.longPressHint}>Long-press for instant call</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Emergency Contacts */}
        <View style={styles.contactsSection}>
          <Text style={styles.sectionTitle}>Quick Dial</Text>
          
          {emergencyContacts.map((contact, index) => (
            <TouchableOpacity
              key={index}
              style={styles.contactCard}
              onPress={() => handleEmergencyCall(contact.number, contact.name)}
            >
              <View style={styles.contactIcon}>
                <Ionicons name={contact.icon} size={24} color={THEME_COLORS.ALERT_RED} />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{contact.name}</Text>
                <Text style={styles.contactNumber}>{contact.number}</Text>
              </View>
              <Ionicons name="call" size={24} color={THEME_COLORS.SAFETY_GREEN} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Safety Tips */}
        <View style={styles.tipsSection}>
          <Text style={styles.sectionTitle}>Safety Tips</Text>
          <View style={styles.tipCard}>
            <Ionicons name="information-circle" size={20} color={THEME_COLORS.ACCENT_BLUE} />
            <Text style={styles.tipText}>
              Stay calm and move to a safe, well-lit area
            </Text>
          </View>
          <View style={styles.tipCard}>
            <Ionicons name="people" size={20} color={THEME_COLORS.ACCENT_BLUE} />
            <Text style={styles.tipText}>
              Stay near other people if possible
            </Text>
          </View>
          <View style={styles.tipCard}>
            <Ionicons name="shield-checkmark" size={20} color={THEME_COLORS.ACCENT_BLUE} />
            <Text style={styles.tipText}>
              Share your live location with trusted contacts
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Fullscreen Countdown Overlay */}
      <Modal visible={showCountdown} transparent animationType="fade">
        <View style={styles.overlayContainer}>
          <View style={styles.overlayBackdrop} />
          <View style={styles.countdownCard}>
            <Ionicons name="warning" size={36} color="#FFFFFF" />
            <Text style={styles.countdownTitle}>Calling Emergency</Text>
            <Text style={styles.countdownNumber}>{countdown}</Text>
            <Text style={styles.countdownHint}>Connecting to help...</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: THEME_COLORS.ALERT_RED,
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
    paddingBottom: 40,
  },
  quickActionsContainer: {
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  quickActionsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  quickSOSButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  quickSOSGradient: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickSOSText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 12,
  },
  quickSOSSubtext: {
    fontSize: 13,
    color: '#FFFFFF',
    opacity: 0.9,
    marginTop: 4,
  },
  sosContainer: {
    alignItems: 'center',
    marginBottom: 32,
    paddingVertical: 24,
  },
  sosTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: THEME_COLORS.TEXT_PRIMARY,
    marginBottom: 8,
  },
  sosSubtitle: {
    fontSize: 14,
    color: THEME_COLORS.TEXT_SECONDARY,
    marginBottom: 24,
  },
  sosButtonWrapper: {
    shadowColor: THEME_COLORS.ALERT_RED,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  sosButton: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 6,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosButtonText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 8,
    letterSpacing: 2,
  },
  activeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 4,
    letterSpacing: 1,
  },
  longPressHint: {
    fontSize: 10,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 6,
    letterSpacing: 0.5,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  countdownCard: {
    width: 260,
    borderRadius: 20,
    backgroundColor: 'rgba(239, 68, 68, 0.95)',
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
  },
  countdownTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 8,
  },
  countdownNumber: {
    fontSize: 64,
    fontWeight: '800',
    color: '#FFFFFF',
    marginVertical: 8,
  },
  countdownHint: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
  },
  contactsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: THEME_COLORS.TEXT_PRIMARY,
    marginBottom: 16,
  },
  contactCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME_COLORS.TEXT_PRIMARY,
    marginBottom: 2,
  },
  contactNumber: {
    fontSize: 14,
    color: THEME_COLORS.TEXT_SECONDARY,
  },
  tipsSection: {
    marginTop: 8,
  },
  tipCard: {
    backgroundColor: '#DBEAFE',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: THEME_COLORS.TEXT_PRIMARY,
    marginLeft: 12,
  },
});

export default SOSScreen;
