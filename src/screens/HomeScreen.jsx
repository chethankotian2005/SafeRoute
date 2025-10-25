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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { THEME_COLORS } from '../utils/constants';
import { useLocation } from '../hooks/useLocation';
import { useTheme } from '../context/ThemeContext';
import { useVoiceAssistant } from '../hooks/useVoiceAssistant';
import { VoiceIndicator } from '../components/VoiceIndicator';
import { VoiceCommandModal } from '../components/VoiceCommandModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { location, loading } = useLocation();
  const [prioritizeSafety, setPrioritizeSafety] = useState(true);
  const [accessibilityMode, setAccessibilityMode] = useState(false);
  const [avoidDarkAreas, setAvoidDarkAreas] = useState(true);
  const [showVoiceCommands, setShowVoiceCommands] = useState(false);
  
  // Scroll animation for hero section
  const scrollY = useRef(new Animated.Value(0)).current;
  
  // Voice Assistant Hook
  const { 
    isListening, 
    isActive, 
    isRecording, 
    toggle: toggleVoiceAssistant,
    manualCommand 
  } = useVoiceAssistant({
    autoStart: false,
    onCommand: (command) => {
      console.log('Voice command executed:', command);
    },
  });

  // Store navigation reference globally for voice commands
  useEffect(() => {
    global.navigation = navigation;
    return () => {
      global.navigation = null;
    };
  }, [navigation]);
  
  // Pulsing animation for SOS button
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseRingAnim = useRef(new Animated.Value(0)).current;
  
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

  // Hero animations based on scroll
  const heroTranslateY = scrollY.interpolate({
    inputRange: [0, 200],
    outputRange: [0, -100],
    extrapolate: 'clamp',
  });

  const heroOpacity = scrollY.interpolate({
    inputRange: [0, 150],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const heroScale = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.8],
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
        {/* Hero Section - Now scrolls with content */}
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
            colors={[THEME_COLORS.BRAND_BLACK, '#2D2D2D']}
            style={styles.heroGradient}
          >
            {/* Logo Container with Background */}
            <View style={[styles.logoContainer, { backgroundColor: colors.surface }]}>
              <Image 
                source={require('../assets/logo.png')} 
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.title}>SafeRoute</Text>
            <Text style={styles.tagline}>Your AI-powered safety companion</Text>
            
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

        {/* Search Bar - Scrolls with content */}
        <View style={styles.searchBarContainer}>
          <View style={[styles.searchBar, { backgroundColor: colors.surface }]}>
            <Ionicons name="search" size={22} color={colors.textSecondary} />
            <TextInput 
              placeholder="Where do you want to go?"
              placeholderTextColor={colors.placeholder}
              style={[styles.searchInput, { color: colors.text }]}
            />
            <TouchableOpacity>
              <Ionicons name="locate" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
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
              onValueChange={setPrioritizeSafety}
            />
            
            <PreferenceCard
              icon="hand-left-outline"
              iconColor={colors.primary}
              iconBg={colors.primaryLight || '#DBEAFE'}
              title="Accessibility Mode"
              subtitle="Wheelchair-friendly routes"
              value={accessibilityMode}
              onValueChange={setAccessibilityMode}
            />
            
            <PreferenceCard
              icon="moon"
              iconColor={colors.textSecondary}
              iconBg={colors.disabled}
              title="Avoid Dark Areas"
              subtitle="Skip poorly lit streets"
              value={avoidDarkAreas}
              onValueChange={setAvoidDarkAreas}
            />
          </View>
        </View>

        {/* Voice Assistant Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderWithAction}>
            <View style={styles.sectionHeaderLeft}>
              <Ionicons name="mic" size={18} color={THEME_COLORS.SAFETY_GREEN} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>AI Safety Assistant</Text>
            </View>
            <TouchableOpacity onPress={() => setShowVoiceCommands(true)}>
              <Text style={[styles.seeAllText, { color: colors.primary }]}>View Commands</Text>
            </TouchableOpacity>
          </View>
          
          {/* Expo Go Notice */}
          <View style={[styles.infoBox, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <Ionicons name="information-circle" size={16} color={THEME_COLORS.WARNING_ORANGE} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              Voice recognition requires dev build. Use "View Commands" to test features manually.
            </Text>
          </View>
          
          <VoiceIndicator 
            isListening={isActive && isListening} 
            isRecording={isRecording}
            onToggle={toggleVoiceAssistant} 
          />
        </View>

        {/* Recent Destinations Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderWithAction}>
            <View style={styles.sectionHeaderLeft}>
              <Ionicons name="time" size={18} color={colors.textSecondary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Destinations</Text>
            </View>
            <TouchableOpacity>
              <Text style={[styles.seeAllText, { color: colors.primary }]}>See All</Text>
            </TouchableOpacity>
          </View>
          
          <RecentDestinationCard
            name="NITK College Campus"
            safetyScore={8}
            distance="2.3 km"
            lastVisit="Last visited today"
            onPress={() => navigation.navigate('Map')}
          />
          
          <RecentDestinationCard
            name="City Shopping Mall"
            safetyScore={9}
            distance="4.1 km"
            lastVisit="Last visited yesterday"
            onPress={() => navigation.navigate('Map')}
          />
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

      {/* Fixed Bottom Button Row - Find Safe Route & SOS */}
      <View style={styles.fixedButtonContainer}>
        {/* Find Safe Route Button */}
        <TouchableOpacity
          style={styles.fixedFindRouteButton}
          onPress={() => navigation.navigate('Map')}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={[THEME_COLORS.SAFE_GRADIENT_START, THEME_COLORS.SAFE_GRADIENT_END]}
            style={styles.fixedButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="navigate-circle" size={22} color="#FFFFFF" />
            <Text style={styles.fixedButtonText}>Find Safe Route</Text>
          </LinearGradient>
        </TouchableOpacity>

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
              <Text style={styles.sosText}>SOS</Text>
              <Text style={styles.sosSubtext}>911</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Voice Command Modal */}
      <VoiceCommandModal
        visible={showVoiceCommands}
        onClose={() => setShowVoiceCommands(false)}
        onTestCommand={manualCommand}
      />
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
const RecentDestinationCard = ({ name, safetyScore, distance, lastVisit, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity style={[styles.recentCard, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.recentIconContainer}>
        <Ionicons name="location" size={20} color={THEME_COLORS.SAFETY_GREEN} />
      </View>
      <View style={styles.recentContent}>
        <Text style={[styles.recentName, { color: colors.text }]}>{name}</Text>
        <View style={styles.recentScoreRow}>
          <View style={styles.safetyBadge}>
            <Text style={styles.safetyBadgeText}>{safetyScore}/10</Text>
          </View>
          <Text style={[styles.recentDetails, { color: colors.textSecondary }]}>{distance} � {lastVisit}</Text>
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
      <Ionicons name={icon} size={20} color={iconColor} />
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME_COLORS.BRAND_BLACK,
  },
  
  // Hero Section
  heroSection: {
    position: 'relative',
    backgroundColor: THEME_COLORS.BRAND_BLACK,
  },
  heroGradient: {
    paddingTop: 60,
    paddingBottom: 50,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  logo: {
    width: 80,
    height: 80,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  tagline: {
    fontSize: 15,
    fontWeight: '400',
    color: '#FFFFFF',
    opacity: 0.9,
  },
  archCurve: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  
  // Search Bar
  searchBarContainer: {
    paddingHorizontal: 16,
    marginTop: -30,
    zIndex: 10,
  },
  searchBar: {
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '400',
    color: THEME_COLORS.TEXT_PRIMARY,
  },
  
  // Scroll View
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 24,
    paddingHorizontal: 16,
    paddingBottom: 200,
  },
  
  // Sections
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionHeaderWithAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  
  // Info Box
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
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
    fontWeight: '600',
    lineHeight: 20,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Preferences Container
  preferencesContainer: {
    gap: 12,
  },
  
  // Preference Cards
  preferenceCard: {
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  preferenceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  preferenceContent: {
    flex: 1,
  },
  preferenceTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  preferenceSubtitle: {
    fontSize: 13,
    fontWeight: '400',
  },
  
  // Recent Destinations
  recentCard: {
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  recentIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  recentContent: {
    flex: 1,
  },
  recentName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  recentScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  safetyBadge: {
    backgroundColor: THEME_COLORS.SAFETY_GREEN,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  safetyBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  recentDetails: {
    fontSize: 12,
    fontWeight: '400',
    color: THEME_COLORS.TEXT_SECONDARY,
  },
  
  // Stats Section
  statsSection: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '400',
    textAlign: 'center',
  },
  
  // Fixed Bottom Buttons
  fixedButtonContainer: {
    position: 'absolute',
    bottom: 20,
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  fixedButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 8,
  },
  fixedButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  
  // SOS Button Wrapper
  sosButtonWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Pulsing Ring
  pulseRing: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  
  // SOS Button
  sosButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    shadowColor: THEME_COLORS.ALERT_RED,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  sosGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  sosSubtext: {
    fontSize: 9,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 1,
    letterSpacing: 0.5,
  },
});

export default HomeScreen;
