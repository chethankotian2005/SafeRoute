import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Linking, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME_COLORS } from '../utils/constants';

const SOSScreen = ({ navigation }) => {
  const [isEmergencyActive, setIsEmergencyActive] = useState(false);

  const emergencyContacts = [
    { name: 'Police', number: '100', icon: 'shield' },
    { name: 'Ambulance', number: '108', icon: 'medical' },
    { name: 'Fire', number: '101', icon: 'flame' },
    { name: 'Women Helpline', number: '1091', icon: 'woman' },
  ];

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

  const handleSOSActivation = () => {
    if (!isEmergencyActive) {
      Alert.alert(
        'Activate SOS',
        'This will send your location to emergency contacts and call 100.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Activate',
            style: 'destructive',
            onPress: () => {
              setIsEmergencyActive(true);
              Alert.alert('SOS Activated', 'Emergency alert sent to your contacts!');
              // TODO: Implement actual SOS functionality
            },
          },
        ]
      );
    } else {
      setIsEmergencyActive(false);
      Alert.alert('SOS Deactivated', 'Emergency mode turned off.');
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
        {/* SOS Button */}
        <View style={styles.sosContainer}>
          <Text style={styles.sosTitle}>Emergency Alert</Text>
          <Text style={styles.sosSubtitle}>Press and hold to activate</Text>
          
          <TouchableOpacity
            onLongPress={handleSOSActivation}
            onPress={() => Alert.alert('Hold Button', 'Press and hold to activate SOS')}
            style={styles.sosButtonWrapper}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={isEmergencyActive ? ['#DC2626', '#991B1B'] : ['#EF4444', '#DC2626']}
              style={styles.sosButton}
            >
              <Ionicons name="alert-circle" size={60} color="#FFFFFF" />
              <Text style={styles.sosButtonText}>SOS</Text>
              {isEmergencyActive && (
                <Text style={styles.activeText}>ACTIVE</Text>
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
