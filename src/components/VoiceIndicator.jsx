import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME_COLORS } from '../utils/constants';

/**
 * Voice Indicator Component
 * Shows visual feedback for voice assistant status with pulsing animation
 */
export function VoiceIndicator({ isListening, isRecording, onToggle, compact = false }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (isListening) {
      // Start pulsing animation
      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(pulseAnim, {
              toValue: 1.2,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
              toValue: 0.8,
              duration: 1000,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
              toValue: 0.3,
              duration: 1000,
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();
    } else {
      // Reset animation
      pulseAnim.setValue(1);
      opacityAnim.setValue(0.3);
    }
  }, [isListening, pulseAnim, opacityAnim]);

  if (compact) {
    return (
      <TouchableOpacity 
        onPress={onToggle}
        style={styles.compactContainer}
        activeOpacity={0.7}
      >
        <Animated.View style={[
          styles.compactIcon,
          { transform: [{ scale: pulseAnim }] },
          isListening && styles.compactIconActive
        ]}>
          <Ionicons 
            name={isListening ? "mic" : "mic-off"} 
            size={20} 
            color={isListening ? "#FFFFFF" : "#6B7280"} 
          />
        </Animated.View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity 
      onPress={onToggle}
      style={styles.container}
      activeOpacity={0.8}
    >
      <View style={styles.content}>
        {/* Pulsing background circle */}
        {isListening && (
          <Animated.View 
            style={[
              styles.pulseCircle,
              { 
                transform: [{ scale: pulseAnim }],
                opacity: opacityAnim,
              }
            ]} 
          />
        )}

        {/* Main icon container */}
        <Animated.View style={[
          styles.iconContainer,
          { transform: [{ scale: isListening ? 1 : 0.9 }] },
        ]}>
          {isListening ? (
            <LinearGradient
              colors={[THEME_COLORS.SAFETY_GREEN, '#059669']}
              style={styles.activeGradient}
            >
              <Ionicons name="mic" size={28} color="#FFFFFF" />
            </LinearGradient>
          ) : (
            <View style={styles.inactiveIcon}>
              <Ionicons name="mic-off" size={28} color="#6B7280" />
            </View>
          )}
        </Animated.View>

        {/* Status text */}
        <View style={styles.textContainer}>
          <Text style={[
            styles.statusText,
            isListening && styles.statusTextActive
          ]}>
            {isListening ? 'Voice Assistant Active' : 'Voice Assistant'}
          </Text>
          
          {isListening && (
            <Text style={styles.hintText}>
              Say "Hey SafeRoute" + your command
            </Text>
          )}
          
          {isRecording && (
            <View style={styles.recordingBadge}>
              <View style={styles.recordingDot} />
              <Text style={styles.recordingText}>Recording</Text>
            </View>
          )}
        </View>

        {/* Toggle button hint */}
        {!isListening && (
          <Text style={styles.tapHint}>Tap to activate</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginVertical: 8,
  },
  content: {
    alignItems: 'center',
    position: 'relative',
  },
  pulseCircle: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: THEME_COLORS.SAFETY_GREEN,
    top: '50%',
    marginTop: -50,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 12,
    overflow: 'hidden',
  },
  activeGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: THEME_COLORS.SAFETY_GREEN,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  inactiveIcon: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    alignItems: 'center',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  statusTextActive: {
    color: THEME_COLORS.SAFETY_GREEN,
    fontSize: 17,
    fontWeight: '700',
  },
  hintText: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 16,
  },
  tapHint: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
  },
  recordingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 8,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: THEME_COLORS.ALERT_RED,
    marginRight: 6,
  },
  recordingText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME_COLORS.ALERT_RED,
  },
  // Compact mode styles
  compactContainer: {
    padding: 8,
  },
  compactIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactIconActive: {
    backgroundColor: THEME_COLORS.SAFETY_GREEN,
    shadowColor: THEME_COLORS.SAFETY_GREEN,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
});

export default VoiceIndicator;
