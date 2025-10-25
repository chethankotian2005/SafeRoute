/**
 * ConfidenceRating Component
 * Allows users to rate their comfort level with the route
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

const COMFORT_LEVELS = [
  {
    id: 'comfortable',
    label: 'Comfortable',
    icon: '😊',
    color: '#4CAF50',
    description: 'I feel safe taking this route',
  },
  {
    id: 'uncertain',
    label: 'Uncertain',
    icon: '😐',
    color: '#FFC107',
    description: "I'm not sure about this route",
  },
  {
    id: 'uncomfortable',
    label: 'Uncomfortable',
    icon: '😟',
    color: '#FF5252',
    description: "I'd prefer a different route",
  },
];

const ConfidenceRating = ({
  onRatingSubmit,
  onRequestAlternative,
  showAlternativeButton = true,
}) => {
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSelect = (level) => {
    setSelectedLevel(level);
  };

  const handleSubmit = () => {
    if (selectedLevel && onRatingSubmit) {
      onRatingSubmit(selectedLevel);
      setSubmitted(true);
    }
  };

  const handleAlternative = () => {
    if (onRequestAlternative) {
      onRequestAlternative();
    }
  };

  if (submitted) {
    return (
      <View style={styles.container}>
        <View style={styles.thankYouContainer}>
          <Text style={styles.thankYouIcon}>✓</Text>
          <Text style={styles.thankYouText}>
            Thank you for your feedback!
          </Text>
          <Text style={styles.thankYouSubtext}>
            Your input helps us improve route safety recommendations
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>How do you feel about this route?</Text>
      <Text style={styles.subtitle}>
        Your feedback helps us improve safety recommendations
      </Text>

      {/* Comfort level options */}
      <View style={styles.optionsContainer}>
        {COMFORT_LEVELS.map((level) => (
          <TouchableOpacity
            key={level.id}
            style={[
              styles.optionButton,
              selectedLevel?.id === level.id && styles.optionButtonSelected,
              selectedLevel?.id === level.id && { borderColor: level.color },
            ]}
            onPress={() => handleSelect(level)}
            activeOpacity={0.7}
          >
            <Text style={styles.optionIcon}>{level.icon}</Text>
            <Text
              style={[
                styles.optionLabel,
                selectedLevel?.id === level.id && styles.optionLabelSelected,
              ]}
            >
              {level.label}
            </Text>
            <Text style={styles.optionDescription}>{level.description}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Submit button */}
      {selectedLevel && (
        <TouchableOpacity
          style={[
            styles.submitButton,
            { backgroundColor: selectedLevel.color },
          ]}
          onPress={handleSubmit}
          activeOpacity={0.8}
        >
          <Text style={styles.submitButtonText}>
            {selectedLevel.id === 'comfortable'
              ? 'Start Navigation'
              : 'Submit Feedback'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Alternative route button */}
      {showAlternativeButton && selectedLevel?.id !== 'comfortable' && (
        <TouchableOpacity
          style={styles.alternativeButton}
          onPress={handleAlternative}
          activeOpacity={0.7}
        >
          <Text style={styles.alternativeButtonText}>
            🔄 Show Me Another Route
          </Text>
        </TouchableOpacity>
      )}

      {/* Quick thumbs up/down */}
      <View style={styles.quickRatingContainer}>
        <Text style={styles.quickRatingLabel}>Quick rating:</Text>
        <View style={styles.quickRatingButtons}>
          <TouchableOpacity
            style={[
              styles.thumbButton,
              selectedLevel?.id === 'comfortable' && styles.thumbButtonActive,
            ]}
            onPress={() => {
              handleSelect(COMFORT_LEVELS[0]);
              setTimeout(handleSubmit, 300);
            }}
          >
            <Text style={styles.thumbIcon}>👍</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.thumbButton,
              selectedLevel?.id === 'uncomfortable' && styles.thumbButtonActive,
            ]}
            onPress={() => {
              handleSelect(COMFORT_LEVELS[2]);
              setTimeout(handleSubmit, 300);
            }}
          >
            <Text style={styles.thumbIcon}>👎</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  optionsContainer: {
    marginBottom: 20,
  },
  optionButton: {
    padding: 16,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#fafafa',
    alignItems: 'center',
  },
  optionButtonSelected: {
    borderWidth: 3,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  optionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  optionLabelSelected: {
    fontWeight: 'bold',
  },
  optionDescription: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  submitButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  alternativeButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  alternativeButtonText: {
    color: '#2196F3',
    fontSize: 15,
    fontWeight: '600',
  },
  quickRatingContainer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickRatingLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 12,
  },
  quickRatingButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  thumbButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  thumbButtonActive: {
    borderColor: '#2196F3',
    backgroundColor: '#E3F2FD',
  },
  thumbIcon: {
    fontSize: 24,
  },
  thankYouContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  thankYouIcon: {
    fontSize: 64,
    color: '#4CAF50',
    marginBottom: 16,
  },
  thankYouText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  thankYouSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});

export default ConfidenceRating;
