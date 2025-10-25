/**
 * Safety Score Component
 * Displays a color-coded safety score badge with breakdown
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SAFETY_SCORE, getRouteColor, THEME_COLORS } from '../utils/constants';

const SafetyScore = ({ score, breakdown, onPress, size = 'medium' }) => {
  // Determine score color
  const scoreColor = getRouteColor(score);

  // Determine score label
  const getScoreLabel = () => {
    if (score >= SAFETY_SCORE.EXCELLENT) return 'Excellent';
    if (score >= SAFETY_SCORE.GOOD) return 'Good';
    if (score >= SAFETY_SCORE.MODERATE) return 'Moderate';
    return 'Poor';
  };

  // Determine icon based on score
  const getScoreIcon = () => {
    if (score >= SAFETY_SCORE.EXCELLENT) return 'shield-checkmark';
    if (score >= SAFETY_SCORE.GOOD) return 'shield';
    if (score >= SAFETY_SCORE.MODERATE) return 'shield-outline';
    return 'warning';
  };

  // Size configurations
  const sizeConfig = {
    small: {
      container: 50,
      fontSize: 16,
      iconSize: 16,
    },
    medium: {
      container: 80,
      fontSize: 24,
      iconSize: 24,
    },
    large: {
      container: 120,
      fontSize: 36,
      iconSize: 36,
    },
  };

  const config = sizeConfig[size] || sizeConfig.medium;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {/* Score Badge */}
      <View
        style={[
          styles.scoreBadge,
          {
            backgroundColor: scoreColor,
            width: config.container,
            height: config.container,
          },
        ]}
      >
        <Text style={[styles.scoreText, { fontSize: config.fontSize }]}>
          {score}
        </Text>
        <Text style={styles.maxScore}>/10</Text>
      </View>

      {/* Score Label */}
      <View style={styles.labelContainer}>
        <Ionicons
          name={getScoreIcon()}
          size={config.iconSize}
          color={scoreColor}
        />
        <Text style={[styles.label, { color: scoreColor }]}>
          {getScoreLabel()}
        </Text>
      </View>

      {/* Breakdown Hint (if breakdown provided) */}
      {breakdown && onPress && (
        <Text style={styles.hint}>Tap for details</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 10,
  },
  scoreBadge: {
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  scoreText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  maxScore: {
    color: '#FFF',
    fontSize: 12,
    marginTop: -4,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
  },
  hint: {
    fontSize: 12,
    color: THEME_COLORS.TEXT_SECONDARY,
    marginTop: 4,
  },
});

export default SafetyScore;
