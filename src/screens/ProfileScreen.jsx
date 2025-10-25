import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { THEME_COLORS } from '../utils/constants';
import { auth } from '../config/firebaseConfig';
import { signOut } from 'firebase/auth';
import { useTheme } from '../context/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ProfileScreen = ({ navigation }) => {
  const { colors, isDarkMode, toggleDarkMode } = useTheme();
  const user = auth.currentUser;

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut(auth);
              Alert.alert('Signed Out', 'You have been signed out successfully');
            } catch (error) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const stats = [
    { icon: 'navigate', label: 'Safe Routes', value: '24', color: THEME_COLORS.SAFETY_GREEN },
    { icon: 'location', label: 'Destinations', value: '12', color: THEME_COLORS.ACCENT_BLUE },
    { icon: 'shield-checkmark', label: 'Safety Rate', value: '98%', color: THEME_COLORS.WARNING_ORANGE },
  ];

  const menuSections = [
    {
      title: 'Account',
      items: [
        { icon: 'person-outline', label: 'Edit Profile', onPress: () => Alert.alert('Edit Profile', 'Profile editing coming soon') },
        { icon: 'settings-outline', label: 'Settings', onPress: () => navigation.navigate('Settings') },
      ]
    },
    {
      title: 'Safety',
      items: [
        { icon: 'time-outline', label: 'Safety History', onPress: () => Alert.alert('Safety History', 'View your route history') },
        { icon: 'bookmark-outline', label: 'Saved Locations', onPress: () => Alert.alert('Saved Locations', 'Manage your saved places') },
        { icon: 'shield-outline', label: 'Emergency Contacts', onPress: () => navigation.navigate('SOS') },
      ]
    },
    {
      title: 'Preferences',
      items: [
        { icon: 'notifications-outline', label: 'Notifications', onPress: () => Alert.alert('Notifications', 'Manage your notifications') },
        { icon: 'lock-closed-outline', label: 'Privacy & Security', onPress: () => Alert.alert('Privacy', 'Privacy settings') },
        { icon: 'globe-outline', label: 'Language', onPress: () => Alert.alert('Language', 'Choose your language') },
        { icon: 'moon-outline', label: 'Dark Mode', onPress: toggleDarkMode, toggle: true, value: isDarkMode },
      ]
    },
    {
      title: 'Support',
      items: [
        { icon: 'help-circle-outline', label: 'Help & Support', onPress: () => Alert.alert('Help', 'Contact support@saferoute.com') },
        { icon: 'information-circle-outline', label: 'About SafeRoute', onPress: () => Alert.alert('SafeRoute v1.0.0', 'Your AI-powered safety companion') },
      ]
    }
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header with Dark Gradient */}
      <LinearGradient
        colors={[THEME_COLORS.BRAND_BLACK, '#2D2D2D']}
        style={styles.header}
      >
        <View style={styles.profileInfo}>
          {/* Avatar with Camera Icon Overlay */}
          <TouchableOpacity 
            style={styles.avatarContainer}
            onPress={() => Alert.alert('Change Photo', 'Photo upload coming soon')}
          >
            <Ionicons name="person" size={44} color="#FFFFFF" />
            <View style={styles.cameraIconOverlay}>
              <Ionicons name="camera" size={16} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
          <Text style={styles.name}>{user?.displayName || user?.email?.split('@')[0] || 'User'}</Text>
          <Text style={styles.email}>{user?.email || 'user@saferoute.com'}</Text>
        </View>

        {/* Stats with Larger Icons */}
        <View style={styles.statsContainer}>
          {stats.map((stat, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.statCard}
              onPress={() => Alert.alert(stat.label, `View ${stat.label.toLowerCase()} details`)}
            >
              <View style={[styles.statIcon, { backgroundColor: `${stat.color}20` }]}>
                <Ionicons name={stat.icon} size={28} color={stat.color} />
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Arch Curve at Bottom */}
        <Svg
          height="40"
          width={SCREEN_WIDTH}
          style={styles.archCurve}
          viewBox={`0 0 ${SCREEN_WIDTH} 40`}
        >
          <Path
            d={`M0,0 Q${SCREEN_WIDTH / 2},40 ${SCREEN_WIDTH},0 L${SCREEN_WIDTH},40 L0,40 Z`}
            fill={colors.background}
          />
        </Svg>
      </LinearGradient>

      {/* Menu Sections */}
      {menuSections.map((section, sectionIndex) => (
        <View key={sectionIndex} style={styles.menuSection}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{section.title}</Text>
          <View style={[styles.menuItemsContainer, { backgroundColor: colors.surface }]}>
            {section.items.map((item, itemIndex) => (
              <TouchableOpacity
                key={itemIndex}
                style={[
                  styles.menuItem,
                  itemIndex !== section.items.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }
                ]}
                onPress={item.onPress}
              >
                <View style={[styles.menuIconContainer, { backgroundColor: colors.background }]}>
                  <Ionicons name={item.icon} size={22} color={colors.text} />
                </View>
                <Text style={[styles.menuLabel, { color: colors.text }]}>{item.label}</Text>
                {item.toggle ? (
                  <View style={styles.toggleSwitch}>
                    <View style={[
                      styles.toggleTrack,
                      { backgroundColor: item.value ? THEME_COLORS.SAFETY_GREEN : colors.disabled }
                    ]}>
                      <View style={[
                        styles.toggleThumb,
                        item.value && styles.toggleThumbActive
                      ]} />
                    </View>
                  </View>
                ) : (
                  <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}

      {/* Sign Out Button */}
      <TouchableOpacity style={[styles.signOutButton, { backgroundColor: colors.surface }]} onPress={handleSignOut}>
        <Ionicons name="log-out-outline" size={20} color={THEME_COLORS.ALERT_RED} />
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>

      {/* Version Number */}
      <Text style={[styles.versionText, { color: colors.textSecondary }]}>SafeRoute v1.0.0</Text>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 16,
  },
  profileInfo: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    position: 'relative',
  },
  cameraIconOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: THEME_COLORS.SAFETY_GREEN,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  archCurve: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    opacity: 0.85,
    textAlign: 'center',
  },
  menuSection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuItemsContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  toggleSwitch: {
    marginLeft: 8,
  },
  toggleTrack: {
    width: 48,
    height: 28,
    borderRadius: 14,
    padding: 2,
    justifyContent: 'center',
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  toggleThumbActive: {
    transform: [{ translateX: 20 }],
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 32,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME_COLORS.ALERT_RED,
  },
  versionText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 24,
    opacity: 0.6,
  },
});

export default ProfileScreen;
