import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { THEME_COLORS } from '../utils/constants';
import { addCommunityReport, uploadReportImage, updateCommunityReport } from '../services/firebaseService';
import { useLocation } from '../hooks/useLocation';
import { LinearGradient } from 'expo-linear-gradient';

const reportTypes = [
  { id: 'harassment', label: 'Harassment', icon: 'alert-circle', color: THEME_COLORS.ALERT_RED },
  { id: 'lighting', label: 'Poor Lighting', icon: 'bulb-outline', color: THEME_COLORS.WARNING_ORANGE },
  { id: 'suspicious', label: 'Suspicious Activity', icon: 'eye-outline', color: THEME_COLORS.WARNING_ORANGE },
  { id: 'safe', label: 'Safe Area', icon: 'checkmark-circle', color: THEME_COLORS.SAFETY_GREEN },
  { id: 'accident', label: 'Accident', icon: 'medical', color: THEME_COLORS.ALERT_RED },
  { id: 'other', label: 'Other', icon: 'ellipsis-horizontal-circle', color: THEME_COLORS.ACCENT_BLUE },
];

const ReportFormScreen = ({ navigation }) => {
  const { location: userLocation } = useLocation();
  const [selectedType, setSelectedType] = useState(null);
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
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

    setSubmitting(true);
    try {
      // Prepare base report data (without image first)
      const reportData = {
        type: selectedType,
        title: getTitleFromType(selectedType),
        description,
        locationDescription: location,
        location: userLocation || { latitude: 0, longitude: 0 }, // Fallback if no location
        imageUrl: null,
      };

      // 1) Create the report first to get the ID
      const reportId = await addCommunityReport(reportData);

      // 2) If an image was selected, upload and attach URL
      if (selectedImage) {
        try {
          const downloadUrl = await uploadReportImage(selectedImage.uri, reportId);
          await updateCommunityReport(reportId, { imageUrl: downloadUrl });
        } catch (uploadErr) {
          // Upload failed; keep report without image
          console.warn('Image upload failed, report saved without photo:', uploadErr);
        }
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
    } catch (error) {
      console.error('Error submitting report:', error);
      Alert.alert('Error', 'Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getTitleFromType = (type) => {
    const titleMap = {
      'harassment': 'Harassment Reported',
      'lighting': 'Poor Street Lighting',
      'suspicious': 'Suspicious Activity',
      'safe': 'Safe Area Reported',
      'accident': 'Accident Reported',
      'other': 'Incident Reported'
    };
    return titleMap[type] || 'Incident Reported';
  };

  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Camera Permission', 'Camera access is required to take a photo.');
      return false;
    }
    return true;
  };

  const requestLibraryPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Photos Permission', 'Photo library access is required to choose a photo.');
      return false;
    }
    return true;
  };

  const pickImageFromCamera = async () => {
    try {
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) return;

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setSelectedImage(result.assets[0]);
      }
    } catch (e) {
      console.warn('Camera error:', e);
      Alert.alert('Camera Error', 'Could not open the camera.');
    }
  };

  const pickImageFromLibrary = async () => {
    try {
      const hasPermission = await requestLibraryPermission();
      if (!hasPermission) return;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setSelectedImage(result.assets[0]);
      }
    } catch (e) {
      console.warn('Library picker error:', e);
      Alert.alert('Photo Picker Error', 'Could not open the photo library.');
    }
  };

  const showImagePickerOptions = () => {
    Alert.alert(
      'Add Photo',
      'Choose how to add a photo',
      [
        { text: 'Take Photo', onPress: pickImageFromCamera },
        { text: 'Choose from Library', onPress: pickImageFromLibrary },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Modern Header with Gradient */}
      <LinearGradient
        colors={[THEME_COLORS.SAFETY_GREEN, '#22C55E']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Report Incident</Text>
          <View style={{ width: 40 }} />
        </View>
        <Text style={styles.headerSubtitle}>Help keep your community safe</Text>
      </LinearGradient>

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
        {selectedImage ? (
          <View style={styles.photoSection}>
            <Text style={styles.sectionTitle}>Photo</Text>
            <View style={styles.selectedImageContainer}>
              <Image source={{ uri: selectedImage.uri }} style={styles.selectedImage} />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => setSelectedImage(null)}
              >
                <Ionicons name="close-circle" size={24} color={THEME_COLORS.ALERT_RED} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.changePhotoButton}
              onPress={showImagePickerOptions}
            >
              <Ionicons name="camera-outline" size={20} color={THEME_COLORS.SAFETY_GREEN} />
              <Text style={styles.changePhotoText}>Change Photo</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.photoButton}
            onPress={showImagePickerOptions}
          >
            <Ionicons name="camera-outline" size={24} color={THEME_COLORS.SAFETY_GREEN} />
            <Text style={styles.photoButtonText}>Add Photo (Optional)</Text>
          </TouchableOpacity>
        )}

        {/* Anonymous Option */}
        <View style={styles.anonymousContainer}>
          <Ionicons name="eye-off-outline" size={20} color={THEME_COLORS.TEXT_SECONDARY} />
          <Text style={styles.anonymousText}>Your report will be anonymous</Text>
        </View>

        {/* Submit Button */}
        <TouchableOpacity 
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]} 
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <View style={styles.submitButtonContent}>
              <Ionicons name="refresh-circle" size={20} color="#FFFFFF" />
              <Text style={styles.submitButtonText}>Submitting...</Text>
            </View>
          ) : (
            <Text style={styles.submitButtonText}>Submit Report</Text>
          )}
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
    paddingTop: 50,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
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
  photoSection: {
    marginBottom: 16,
  },
  selectedImageContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  selectedImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
  },
  changePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME_COLORS.SAFETY_GREEN,
  },
  changePhotoText: {
    fontSize: 14,
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
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default ReportFormScreen;
