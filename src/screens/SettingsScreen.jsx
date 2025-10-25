import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME_COLORS } from '../utils/constants';
import { useTheme } from '../context/ThemeContext';

const SettingsScreen = ({ navigation }) => {
  const { isDarkMode, toggleDarkMode, colors } = useTheme();
  const [pushNotifications, setPushNotifications] = useState(true);
  const [locationAlways, setLocationAlways] = useState(false);
  const [autoReroute, setAutoReroute] = useState(true);
  const [voiceGuidance, setVoiceGuidance] = useState(true);

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
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Ionicons name="settings" size={22} color={THEME_COLORS.SAFETY_GREEN} style={{ marginRight: 8 }} />
          <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Safety Preferences */}
        <SettingSection title="Safety Preferences">
          <SettingItem
            icon="shield-checkmark-outline"
            title="Prioritize Safety"
            subtitle="Always choose safest routes"
            value={true}
            onValueChange={() => {}}
          />
          <SettingItem
            icon="moon-outline"
            title="Avoid Dark Areas"
            subtitle="Skip poorly lit streets"
            value={true}
            onValueChange={() => {}}
          />
          <SettingItem
            icon="hand-left-outline"
            title="Accessibility Mode"
            subtitle="Wheelchair-friendly routes"
            value={false}
            onValueChange={() => {}}
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
            value={true}
            onValueChange={() => {}}
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
            style={styles.settingItem}
            onPress={() => Alert.alert('Map Style', 'Map style options coming soon')}
          >
            <View style={styles.settingIcon}>
              <Ionicons name="map-outline" size={22} color={THEME_COLORS.SAFETY_GREEN} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Map Style</Text>
              <Text style={styles.settingSubtitle}>Standard</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={THEME_COLORS.TEXT_SECONDARY} />
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
            style={styles.settingItem}
            onPress={() => Alert.alert('Privacy', 'Privacy policy coming soon')}
          >
            <View style={styles.settingIcon}>
              <Ionicons name="document-text-outline" size={22} color={THEME_COLORS.SAFETY_GREEN} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Privacy Policy</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={THEME_COLORS.TEXT_SECONDARY} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => Alert.alert('Terms', 'Terms of service coming soon')}
          >
            <View style={styles.settingIcon}>
              <Ionicons name="shield-outline" size={22} color={THEME_COLORS.SAFETY_GREEN} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Terms of Service</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={THEME_COLORS.TEXT_SECONDARY} />
          </TouchableOpacity>
        </SettingSection>

        {/* About */}
        <SettingSection title="About">
          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Ionicons name="information-circle-outline" size={22} color={THEME_COLORS.SAFETY_GREEN} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Version</Text>
              <Text style={styles.settingSubtitle}>1.0.0</Text>
            </View>
          </View>
        </SettingSection>

        <View style={{ height: 40 }} />
      </ScrollView>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
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
});

export default SettingsScreen;
