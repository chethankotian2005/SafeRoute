/**
 * SafeRoute Home Screen
 * Complete redesign with all improvements applied
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Image,
  TextInput,
  Switch,
  Animated,
  Dimensions,
  SafeAreaView,
  Platform,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { THEME_COLORS } from '../utils/constants';
import { useLocation } from '../hooks/useLocation';
import { useTheme } from '../context/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { location, loading } = useLocation();
  const [prioritizeSafety, setPrioritizeSafety] = useState(true);
  const [accessibilityMode, setAccessibilityMode] = useState(false);
  const [avoidDarkAreas, setAvoidDarkAreas] = useState(true);
  const [recentDestinations, setRecentDestinations] = useState([]);
  
  // Handler functions with alert messages
  const handlePrioritizeSafetyToggle = (value) => {
    setPrioritizeSafety(value);
    Alert.alert(
      value ? 'Safety Priority Enabled' : 'Safety Priority Disabled',
      value
        ? 'Routes will now prioritize the safest paths based on lighting, crime data, and community reports.'
        : 'Route calculation will balance safety with distance and time.',
      [{ text: 'OK' }]
    );
  };

  const handleAccessibilityToggle = (value) => {
    setAccessibilityMode(value);
    Alert.alert(
      value ? 'Accessibility Mode Enabled' : 'Accessibility Mode Disabled',
      value
        ? 'Routes will now prioritize wheelchair-accessible paths with ramps, elevators, and avoid stairs.'
        : 'Standard route calculation restored.',
      [{ text: 'OK' }]
    );
  };

  const handleAvoidDarkAreasToggle = (value) => {
    setAvoidDarkAreas(value);
    Alert.alert(
      value ? 'Dark Area Avoidance Enabled' : 'Dark Area Avoidance Disabled',
      value
        ? 'Routes will avoid poorly lit areas and prioritize well-illuminated streets for your safety.'
        : 'Lighting conditions will not affect route selection.',
      [{ text: 'OK' }]
    );
  };
  
  // Scroll animation for hero section (Uber-style)
  const scrollY = useRef(new Animated.Value(0)).current;
  
  // Pulsing animation for SOS button
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseRingAnim = useRef(new Animated.Value(0)).current;
  
  // Load recent destinations from AsyncStorage
  const loadRecentDestinations = async () => {
    try {
      const stored = await AsyncStorage.getItem('recentDestinations');
      if (stored) {
        const destinations = JSON.parse(stored);
        setRecentDestinations(destinations);
      } else {
        // If nothing stored, set to empty array
        setRecentDestinations([]);
      }
    } catch (error) {
      console.log('Error loading recent destinations:', error);
      setRecentDestinations([]);
    }
  };

  // Load recent destinations on mount and when screen comes into focus
  useEffect(() => {
    loadRecentDestinations();
    
    const unsubscribe = navigation.addListener('focus', () => {
      loadRecentDestinations();
    });

    return unsubscribe;
  }, [navigation]);
  
  useEffect(() => {
    // SOS button scale pulse
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    
    // Pulsing ring animation
    const pulseRing = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseRingAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseRingAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );
    
    pulse.start();
    pulseRing.start();
    return () => {
      pulse.stop();
      pulseRing.stop();
    };
  }, []);

  // Navigate to a specific destination
  const navigateToDestination = (destination) => {
    navigation.navigate('Navigate', {
      selectedDestination: destination,
    });
  };

  // Navigate to See All destinations screen
  const handleSeeAllDestinations = () => {
    // RecentDestinations screen removed - keeping data in HomeScreen only
    Alert.alert('Recent Destinations', 'View all recent destinations feature coming soon!');
  };

  // Hero animations based on scroll - Uber-style collapse
  const heroTranslateY = scrollY.interpolate({
    inputRange: [0, 200],
    outputRange: [0, -50],
    extrapolate: 'clamp',
  });

  const heroOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const heroScale = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.9],
    extrapolate: 'clamp',
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.background} />
      
      {/* Main Scrollable Content */}
      <Animated.ScrollView
        style={[styles.scrollView, { backgroundColor: colors.background }]}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
      >
        {/* Hero Section - Now scrolls with content and collapses */}
        <Animated.View 
          style={[
            styles.heroSection,
            {
              transform: [
                { translateY: heroTranslateY },
                { scale: heroScale },
              ],
              opacity: heroOpacity,
            },
          ]}
        >
          <LinearGradient
            colors={['#1F2937', '#374151']}
            style={styles.heroGradient}
          >
            {/* Logo Container with Background */}
            <View style={[styles.logoContainer, { backgroundColor: colors.surface }]}>
              <Image 
                source={require('../assets/logo.png')} 
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.title}>SafeRoute</Text>
            <Text style={styles.tagline}>Navigate Safely, Arrive Confidently</Text>
            
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
        </Animated.View>

        {/* Search Bar - Scrolls with content, overlaps hero */}
        <View style={styles.searchBarContainer}>
          <TouchableOpacity 
            style={[styles.searchBar, { backgroundColor: colors.surface }]}
            onPress={() => navigation.navigate('Navigate')}
            activeOpacity={0.8}
          >
            <View style={styles.searchIconContainer}>
              <Ionicons name="search" size={22} color={colors.textSecondary} />
            </View>
            <Text style={[styles.searchPlaceholder, { color: colors.placeholder }]}>
              Where do you want to go?
            </Text>
            <View style={styles.locateIconContainer}>
              <Ionicons name="navigate-circle" size={22} color={THEME_COLORS.SAFETY_GREEN} />
            </View>
          </TouchableOpacity>
        </View>
        {/* Safety Preferences Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="shield-checkmark" size={20} color={THEME_COLORS.SAFETY_GREEN} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Safety Preferences</Text>
          </View>
          
          <View style={styles.preferencesContainer}>
            <PreferenceCard
              icon="shield-checkmark"
              iconColor={THEME_COLORS.SAFETY_GREEN}
              iconBg="#D1FAE5"
              title="Prioritize Safety"
              subtitle="Choose safest routes"
              value={prioritizeSafety}
              onValueChange={handlePrioritizeSafetyToggle}
            />
            
            <PreferenceCard
              icon="hand-left-outline"
              iconColor={colors.primary}
              iconBg={colors.primaryLight || '#DBEAFE'}
              title="Accessibility Mode"
              subtitle="Wheelchair-friendly routes"
              value={accessibilityMode}
              onValueChange={handleAccessibilityToggle}
            />
            
            <PreferenceCard
              icon="moon"
              iconColor={colors.textSecondary}
              iconBg={colors.disabled}
              title="Avoid Dark Areas"
              subtitle="Skip poorly lit streets"
              value={avoidDarkAreas}
              onValueChange={handleAvoidDarkAreasToggle}
            />
          </View>
        </View>

        {/* Recent Destinations Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderWithAction}>
            <View style={styles.sectionHeaderLeft}>
              <Ionicons name="time" size={18} color={colors.textSecondary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Destinations</Text>
            </View>
            <TouchableOpacity onPress={handleSeeAllDestinations}>
              <Text style={[styles.seeAllText, { color: colors.primary }]}>See All</Text>
            </TouchableOpacity>
          </View>
          
          {recentDestinations.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <Ionicons name="location-outline" size={48} color={colors.disabled} />
              <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                No recent destinations yet
              </Text>
              <Text style={[styles.emptyStateSubtext, { color: colors.textSecondary }]}>
                Start navigating to see your history here
              </Text>
            </View>
          ) : (
            recentDestinations.slice(0, 3).map((dest, index) => (
              <RecentDestinationCard
                key={index}
                name={dest.name}
                address={dest.address}
                safetyScore={dest.safetyScore || 7}
                distance={dest.distance || 'N/A'}
                lastVisit={dest.lastVisit || 'Recently'}
                onPress={() => navigateToDestination(dest)}
              />
            ))
          )}
        </View>

        {/* Quick Stats Section */}
        <View style={styles.statsSection}>
          <StatCard
            icon="navigate"
            iconColor={THEME_COLORS.SAFETY_GREEN}
            label="Safe Routes"
            value="24"
          />
          <StatCard
            icon="shield-checkmark"
            iconColor={colors.primary}
            label="Safety Rate"
            value="98%"
          />
        </View>
      </Animated.ScrollView>

      {/* Fixed Bottom Button Row - SOS */}
      <View style={styles.fixedButtonContainer}>
        {/* SOS Button */}
        <Animated.View 
          style={[
            styles.sosButtonWrapper, 
            { transform: [{ scale: pulseAnim }] }
          ]}
        >
          {/* Pulsing Ring Animation */}
          <Animated.View 
            style={[
              styles.pulseRing,
              {
                opacity: pulseRingAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.3, 0],
                }),
                transform: [
                  {
                    scale: pulseRingAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.3],
                    }),
                  },
                ],
              },
            ]}
          />
          
          <TouchableOpacity
            style={styles.sosButton}
            onPress={() => navigation.navigate('SOS')}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#EF4444', '#DC2626']}
              style={styles.sosGradient}
            >
              <Ionicons name="warning" size={24} color="#FFFFFF" style={styles.sosIcon} />
              <Text style={styles.sosText}>SOS</Text>
              <Text style={styles.sosSubtext}>112</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
};


// Preference Card Component
const PreferenceCard = ({ icon, iconColor, iconBg, title, subtitle, value, onValueChange }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.preferenceCard, { backgroundColor: colors.surface }]}>
      <View style={[styles.preferenceIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={24} color={iconColor} />
      </View>
      <View style={styles.preferenceContent}>
        <Text style={[styles.preferenceTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.preferenceSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.disabled, true: '#D1FAE5' }}
        thumbColor={value ? THEME_COLORS.SAFETY_GREEN : '#FFFFFF'}
      />
    </View>
  );
};

// Recent Destination Card Component
const RecentDestinationCard = ({ name, address, safetyScore, distance, lastVisit, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity style={[styles.recentCard, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.recentIconContainer}>
        <Ionicons name="location" size={20} color={THEME_COLORS.SAFETY_GREEN} />
      </View>
      <View style={styles.recentContent}>
        <Text style={[styles.recentName, { color: colors.text }]}>{name}</Text>
        <Text style={[styles.recentAddress, { color: colors.textSecondary }]}>{address}</Text>
        <View style={styles.recentScoreRow}>
          <View style={styles.safetyBadge}>
            <Text style={styles.safetyBadgeText}>{safetyScore}/10</Text>
          </View>
          <Text style={[styles.recentDetails, { color: colors.textSecondary }]}>{distance} • {lastVisit}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
    </TouchableOpacity>
  );
};

// Stat Card Component
const StatCard = ({ icon, iconColor, label, value }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
      <View style={[styles.statIconContainer, { backgroundColor: `${iconColor}15` }]}>
        <Ionicons name={icon} size={22} color={iconColor} />
      </View>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  
  // Hero Section - Uber-style collapsing header
  heroSection: {
    position: 'relative',
    overflow: 'hidden',
  },
  heroGradient: {
    paddingTop: 40,
    paddingBottom: 50,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  logoImage: {
    width: 80,
    height: 80,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 16,
    fontWeight: '400',
    color: '#D1D5DB',
    textAlign: 'center',
  },
  archCurve: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  
  // Search Bar - Overlaps hero like Uber
  searchBarContainer: {
    paddingHorizontal: 16,
    marginTop: -30,
    zIndex: 10,
    marginBottom: 20,
  },
  searchBar: {
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: THEME_COLORS.SAFETY_GREEN,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.1)',
  },
  searchIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locateIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  
  // Scroll View
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 200,
  },
  
  // Sections
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionHeaderWithAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  
  // Info Box
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 20,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Preferences Container - Shows all 3 cards clearly
  preferencesContainer: {
    gap: 12,
  },
  
  // Preference Cards - Clean design with enhanced shadows
  preferenceCard: {
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  preferenceIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  preferenceContent: {
    flex: 1,
  },
  preferenceTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  preferenceSubtitle: {
    fontSize: 13,
    fontWeight: '400',
  },
  
  // Empty state
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  
  // Recent Destinations
  recentCard: {
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  recentIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  recentContent: {
    flex: 1,
  },
  recentName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  recentAddress: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 6,
  },
  recentScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  safetyBadge: {
    backgroundColor: THEME_COLORS.SAFETY_GREEN,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  safetyBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  recentDetails: {
    fontSize: 12,
    fontWeight: '400',
  },
  
  // Stats Section
  statsSection: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    marginTop: 4,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  
  // Fixed Bottom Buttons - Doesn't block content
  fixedButtonContainer: {
    position: 'absolute',
    bottom: 30,
    left: 16,
    right: 16,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  fixedFindRouteButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: THEME_COLORS.SAFETY_GREEN,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  fixedButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
    gap: 10,
  },
  fixedButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  
  // SOS Button Wrapper - Floating, not blocking
  sosButtonWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Pulsing Ring - Clear animation
  pulseRing: {
    position: 'absolute',
    width: 108,
    height: 108,
    borderRadius: 54,
    borderWidth: 3,
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  
  // SOS Button - Clean and prominent
  sosButton: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    shadowColor: THEME_COLORS.ALERT_RED,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  sosGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  sosIcon: {
    marginBottom: 2,
  },
  sosText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  sosSubtext: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 1,
    letterSpacing: 0.5,
    opacity: 0.9,
  },
});

export default HomeScreen;
