import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { THEME_COLORS } from '../utils/constants';
import { useTheme } from '../context/ThemeContext';

const SettingsScreen = ({ navigation }) => {
  const { isDarkMode, toggleDarkMode, colors } = useTheme();
  const [pushNotifications, setPushNotifications] = useState(true);
  const [locationAlways, setLocationAlways] = useState(false);
  const [autoReroute, setAutoReroute] = useState(true);
  const [voiceGuidance, setVoiceGuidance] = useState(true);
  const [wheelchairMode, setWheelchairMode] = useState(false);
  const [prioritizeSafety, setPrioritizeSafety] = useState(true);
  const [avoidDarkAreas, setAvoidDarkAreas] = useState(true);
  const [emergencyAlerts, setEmergencyAlerts] = useState(true);
  const [mapStyle, setMapStyle] = useState('standard');
  const [showMapStyleModal, setShowMapStyleModal] = useState(false);

  const mapStyles = [
    { id: 'standard', name: 'Standard', icon: 'map-outline', description: 'Default map view' },
    { id: 'satellite', name: 'Satellite', icon: 'globe-outline', description: 'Aerial satellite imagery' },
    { id: 'terrain', name: 'Terrain', icon: 'trending-up-outline', description: 'Topographic terrain view' },
    { id: 'hybrid', name: 'Hybrid', icon: 'layers-outline', description: 'Satellite with labels' },
  ];

  // Load saved map style on mount
  useEffect(() => {
    const loadMapStyle = async () => {
      try {
        const savedStyle = await AsyncStorage.getItem('mapStyle');
        if (savedStyle) {
          setMapStyle(savedStyle);
        }
      } catch (error) {
        // Silently ignore storage errors
      }
    };
    loadMapStyle();
  }, []);

  const SettingItem = ({ icon, title, subtitle, value, onValueChange, type = 'switch' }) => (
    <View style={[styles.settingItem, { backgroundColor: colors.surface }]}>
      <View style={[styles.settingIcon, { backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.2)' : '#D1FAE5' }]}>
        <Ionicons name={icon} size={22} color={THEME_COLORS.SAFETY_GREEN} />
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, { color: colors.text }]}>{title}</Text>
        {subtitle && <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
      </View>
      {type === 'switch' && (
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: colors.disabled, true: '#D1FAE5' }}
          thumbColor={value ? THEME_COLORS.SAFETY_GREEN : '#FFFFFF'}
        />
      )}
      {type === 'chevron' && (
        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
      )}
    </View>
  );

  const SettingSection = ({ title, children }) => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{title}</Text>
      {children}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Safety Preferences */}
        <SettingSection title="Safety Preferences">
          <SettingItem
            icon="shield-checkmark-outline"
            title="Prioritize Safety"
            subtitle="Always choose safest routes"
            value={prioritizeSafety}
            onValueChange={(value) => {
              setPrioritizeSafety(value);
              Alert.alert(
                value ? 'Safety Priority Enabled' : 'Safety Priority Disabled',
                value 
                  ? 'Routes will now prioritize the safest paths based on lighting, crime data, and community reports.'
                  : 'Route calculation will balance safety with distance and time.',
                [{ text: 'OK' }]
              );
            }}
          />
          <SettingItem
            icon="moon-outline"
            title="Avoid Dark Areas"
            subtitle="Skip poorly lit streets"
            value={avoidDarkAreas}
            onValueChange={(value) => {
              setAvoidDarkAreas(value);
              Alert.alert(
                value ? 'Dark Area Avoidance Enabled' : 'Dark Area Avoidance Disabled',
                value 
                  ? 'Routes will avoid poorly lit areas and prioritize well-illuminated streets for your safety.'
                  : 'Lighting conditions will not affect route selection.',
                [{ text: 'OK' }]
              );
            }}
          />
          <SettingItem
            icon="hand-left-outline"
            title="Accessibility Mode"
            subtitle="Wheelchair-friendly routes"
            value={wheelchairMode}
            onValueChange={(value) => {
              setWheelchairMode(value);
              Alert.alert(
                value ? 'Accessibility Mode Enabled' : 'Accessibility Mode Disabled',
                value 
                  ? 'Routes will now prioritize wheelchair-accessible paths with ramps, elevators, and avoid stairs.'
                  : 'Standard route calculation restored.',
                [{ text: 'OK' }]
              );
            }}
          />
        </SettingSection>

        {/* Notifications */}
        <SettingSection title="Notifications">
          <SettingItem
            icon="notifications-outline"
            title="Push Notifications"
            subtitle="Receive safety alerts"
            value={pushNotifications}
            onValueChange={setPushNotifications}
          />
          <SettingItem
            icon="alert-circle-outline"
            title="Emergency Alerts"
            subtitle="Critical safety warnings"
            value={emergencyAlerts}
            onValueChange={(value) => {
              if (!value) {
                // Show warning when trying to disable
                Alert.alert(
                  '⚠️ Warning',
                  'Disabling emergency alerts may put you at risk. You will not receive critical safety warnings, SOS notifications, or urgent community alerts in dangerous situations.\n\nAre you sure you want to disable this feature?',
                  [
                    {
                      text: 'Cancel',
                      style: 'cancel',
                      onPress: () => {}
                    },
                    {
                      text: 'Disable',
                      style: 'destructive',
                      onPress: () => {
                        setEmergencyAlerts(false);
                        Alert.alert(
                          'Emergency Alerts Disabled',
                          'You will no longer receive critical safety notifications. You can re-enable this anytime in Settings.',
                          [{ text: 'OK' }]
                        );
                      }
                    }
                  ]
                );
              } else {
                // Enable without warning
                setEmergencyAlerts(true);
                Alert.alert(
                  'Emergency Alerts Enabled',
                  'You will now receive critical safety warnings and SOS notifications to keep you protected.',
                  [{ text: 'OK' }]
                );
              }
            }}
          />
        </SettingSection>

        {/* Location */}
        <SettingSection title="Location">
          <SettingItem
            icon="location-outline"
            title="Background Location"
            subtitle="Track location when app is closed"
            value={locationAlways}
            onValueChange={setLocationAlways}
          />
          <SettingItem
            icon="navigate-outline"
            title="Auto Re-route"
            subtitle="Automatically find safer routes"
            value={autoReroute}
            onValueChange={setAutoReroute}
          />
        </SettingSection>

        {/* Navigation */}
        <SettingSection title="Navigation">
          <SettingItem
            icon="volume-high-outline"
            title="Voice Guidance"
            subtitle="Turn-by-turn voice instructions"
            value={voiceGuidance}
            onValueChange={setVoiceGuidance}
          />
          <TouchableOpacity
            style={[styles.settingItem, { backgroundColor: colors.surface }]}
            onPress={() => setShowMapStyleModal(true)}
          >
            <View style={[styles.settingIcon, { backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.2)' : '#D1FAE5' }]}>
              <Ionicons name="map-outline" size={22} color={THEME_COLORS.SAFETY_GREEN} />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Map Style</Text>
              <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                {mapStyles.find(s => s.id === mapStyle)?.name || 'Standard'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </SettingSection>

        {/* Appearance */}
        <SettingSection title="Appearance">
          <SettingItem
            icon="moon-outline"
            title="Dark Mode"
            subtitle={isDarkMode ? "Dark theme enabled" : "Light theme enabled"}
            value={isDarkMode}
            onValueChange={toggleDarkMode}
          />
        </SettingSection>

        {/* Privacy & Security */}
        <SettingSection title="Privacy & Security">
          <TouchableOpacity
            style={[styles.settingItem, { backgroundColor: colors.surface }]}
            onPress={() => Alert.alert('Privacy', 'Privacy policy coming soon')}
          >
            <View style={[styles.settingIcon, { backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.2)' : '#D1FAE5' }]}>
              <Ionicons name="document-text-outline" size={22} color={THEME_COLORS.SAFETY_GREEN} />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Privacy Policy</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.settingItem, { backgroundColor: colors.surface }]}
            onPress={() => Alert.alert('Terms', 'Terms of service coming soon')}
          >
            <View style={[styles.settingIcon, { backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.2)' : '#D1FAE5' }]}>
              <Ionicons name="shield-outline" size={22} color={THEME_COLORS.SAFETY_GREEN} />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Terms of Service</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </SettingSection>

        {/* About */}
        <SettingSection title="About">
          <View style={[styles.settingItem, { backgroundColor: colors.surface }]}>
            <View style={[styles.settingIcon, { backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.2)' : '#D1FAE5' }]}>
              <Ionicons name="information-circle-outline" size={22} color={THEME_COLORS.SAFETY_GREEN} />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Version</Text>
              <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>1.0.0</Text>
            </View>
          </View>
        </SettingSection>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Map Style Modal */}
      <Modal
        visible={showMapStyleModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowMapStyleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select Map Style</Text>
              <TouchableOpacity onPress={() => setShowMapStyleModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.mapStyleOptions}>
              {mapStyles.map((style) => (
                <TouchableOpacity
                  key={style.id}
                  style={[
                    styles.mapStyleOption,
                    { backgroundColor: colors.background },
                    mapStyle === style.id && styles.mapStyleOptionSelected
                  ]}
                  onPress={async () => {
                    try {
                      await AsyncStorage.setItem('mapStyle', style.id);
                      setMapStyle(style.id);
                      setShowMapStyleModal(false);
                      Alert.alert(
                        'Map Style Updated',
                        `Map style changed to ${style.name}. This will be reflected in the navigation panel.`,
                        [{ text: 'OK' }]
                      );
                    } catch (error) {
                      setMapStyle(style.id);
                      setShowMapStyleModal(false);
                      Alert.alert(
                        'Map Style Updated',
                        `Map style changed to ${style.name}. This will be reflected in the navigation panel.`,
                        [{ text: 'OK' }]
                      );
                    }
                  }}
                >
                  <View style={[
                    styles.mapStyleIconContainer,
                    { backgroundColor: mapStyle === style.id ? THEME_COLORS.SAFETY_GREEN : (isDarkMode ? 'rgba(16, 185, 129, 0.2)' : '#D1FAE5') }
                  ]}>
                    <Ionicons 
                      name={style.icon} 
                      size={24} 
                      color={mapStyle === style.id ? '#FFFFFF' : THEME_COLORS.SAFETY_GREEN} 
                    />
                  </View>
                  <View style={styles.mapStyleInfo}>
                    <Text style={[styles.mapStyleName, { color: colors.text }]}>{style.name}</Text>
                    <Text style={[styles.mapStyleDescription, { color: colors.textSecondary }]}>
                      {style.description}
                    </Text>
                  </View>
                  {mapStyle === style.id && (
                    <Ionicons name="checkmark-circle" size={24} color={THEME_COLORS.SAFETY_GREEN} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 12,
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  settingItem: {
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  settingIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 3,
  },
  settingSubtitle: {
    fontSize: 13,
    fontWeight: '400',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  mapStyleOptions: {
    gap: 12,
  },
  mapStyleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  mapStyleOptionSelected: {
    borderColor: THEME_COLORS.SAFETY_GREEN,
  },
  mapStyleIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  mapStyleInfo: {
    flex: 1,
  },
  mapStyleName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  mapStyleDescription: {
    fontSize: 13,
    fontWeight: '400',
  },
});

export default SettingsScreen;
