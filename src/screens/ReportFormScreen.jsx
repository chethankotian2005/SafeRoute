import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME_COLORS } from '../utils/constants';

const ReportFormScreen = ({ navigation }) => {
  const [selectedType, setSelectedType] = useState(null);
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');

  const reportTypes = [
    { id: 'harassment', label: 'Harassment', icon: 'alert-circle', color: THEME_COLORS.ALERT_RED },
    { id: 'lighting', label: 'Poor Lighting', icon: 'bulb-outline', color: THEME_COLORS.WARNING_ORANGE },
    { id: 'suspicious', label: 'Suspicious Activity', icon: 'eye-outline', color: THEME_COLORS.WARNING_ORANGE },
    { id: 'safe', label: 'Safe Area', icon: 'checkmark-circle', color: THEME_COLORS.SAFETY_GREEN },
    { id: 'accident', label: 'Accident', icon: 'medical', color: THEME_COLORS.ALERT_RED },
    { id: 'other', label: 'Other', icon: 'ellipsis-horizontal-circle', color: THEME_COLORS.ACCENT_BLUE },
  ];

  const handleSubmit = () => {
    if (!selectedType) {
      Alert.alert('Select Type', 'Please select a report type');
      return;
    }
    if (!location.trim()) {
      Alert.alert('Add Location', 'Please add a location');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Add Description', 'Please describe the incident');
      return;
    }

    Alert.alert(
      'Report Submitted',
      'Your report has been submitted successfully. Thank you for helping the community!',
      [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="close" size={28} color={THEME_COLORS.TEXT_PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report Incident</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Report Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What are you reporting?</Text>
          <View style={styles.typeGrid}>
            {reportTypes.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.typeCard,
                  selectedType === type.id && styles.typeCardActive,
                ]}
                onPress={() => setSelectedType(type.id)}
              >
                <View style={[styles.typeIcon, { backgroundColor: `${type.color}20` }]}>
                  <Ionicons
                    name={type.icon}
                    size={24}
                    color={selectedType === type.id ? type.color : THEME_COLORS.TEXT_SECONDARY}
                  />
                </View>
                <Text
                  style={[
                    styles.typeLabel,
                    selectedType === type.id && styles.typeLabelActive,
                  ]}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="location" size={20} color={THEME_COLORS.TEXT_SECONDARY} />
            <TextInput
              style={styles.input}
              placeholder="Enter or select location"
              placeholderTextColor="#9CA3AF"
              value={location}
              onChangeText={setLocation}
            />
            <TouchableOpacity onPress={() => Alert.alert('Map', 'Map picker coming soon')}>
              <Ionicons name="map" size={20} color={THEME_COLORS.SAFETY_GREEN} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.currentLocationButton}
            onPress={() => setLocation('Current Location')}
          >
            <Ionicons name="navigate" size={18} color={THEME_COLORS.SAFETY_GREEN} />
            <Text style={styles.currentLocationText}>Use current location</Text>
          </TouchableOpacity>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Describe what happened..."
            placeholderTextColor="#9CA3AF"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        </View>

        {/* Add Photo */}
        <TouchableOpacity
          style={styles.photoButton}
          onPress={() => Alert.alert('Camera', 'Photo upload coming soon')}
        >
          <Ionicons name="camera-outline" size={24} color={THEME_COLORS.SAFETY_GREEN} />
          <Text style={styles.photoButtonText}>Add Photo (Optional)</Text>
        </TouchableOpacity>

        {/* Anonymous Option */}
        <View style={styles.anonymousContainer}>
          <Ionicons name="eye-off-outline" size={20} color={THEME_COLORS.TEXT_SECONDARY} />
          <Text style={styles.anonymousText}>Your report will be anonymous</Text>
        </View>

        {/* Submit Button */}
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Submit Report</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
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
    backgroundColor: '#FFFFFF',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: THEME_COLORS.TEXT_PRIMARY,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME_COLORS.TEXT_PRIMARY,
    marginBottom: 12,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeCard: {
    width: '30%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  typeCardActive: {
    borderColor: THEME_COLORS.SAFETY_GREEN,
    backgroundColor: '#F0FDF4',
  },
  typeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  typeLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: THEME_COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
  typeLabelActive: {
    color: THEME_COLORS.TEXT_PRIMARY,
    fontWeight: '600',
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: THEME_COLORS.TEXT_PRIMARY,
  },
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingVertical: 8,
  },
  currentLocationText: {
    fontSize: 14,
    fontWeight: '500',
    color: THEME_COLORS.SAFETY_GREEN,
  },
  textArea: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: THEME_COLORS.TEXT_PRIMARY,
    minHeight: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  photoButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    marginBottom: 16,
  },
  photoButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: THEME_COLORS.SAFETY_GREEN,
  },
  anonymousContainer: {
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  anonymousText: {
    fontSize: 14,
    color: THEME_COLORS.TEXT_SECONDARY,
  },
  submitButton: {
    backgroundColor: THEME_COLORS.SAFETY_GREEN,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: THEME_COLORS.SAFETY_GREEN,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default ReportFormScreen;
