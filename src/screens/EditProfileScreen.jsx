import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  TextInput,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { auth } from '../config/firebaseConfig';
import { updateProfile } from 'firebase/auth';
import { updateUserDocument, uploadImage, getUserDocument } from '../services/firebaseService';
import { useTheme } from '../context/ThemeContext';
import { THEME_COLORS } from '../utils/constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const EditProfileScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const user = auth.currentUser;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');
  const [imageChanged, setImageChanged] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const userData = await getUserDocument(user.uid);
      if (userData) {
        setDisplayName(userData.displayName || '');
        setBio(userData.bio || '');
        setPhone(userData.phone || '');
        if (userData.profileImage) {
          setProfileImage(userData.profileImage);
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setProfileImage(result.assets[0].uri);
        setImageChanged(true);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setProfileImage(result.assets[0].uri);
        setImageChanged(true);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      'Update Profile Photo',
      'Choose how you want to update your photo',
      [
        {
          text: 'Take Photo',
          onPress: takePhoto,
        },
        {
          text: 'Choose from Library',
          onPress: pickImage,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const saveProfile = async () => {
    if (!displayName.trim()) {
      Alert.alert('Validation', 'Please enter your name');
      return;
    }

    try {
      setSaving(true);
      console.log('✅ Starting profile save...');
      console.log('User ID:', user.uid);
      console.log('Image changed:', imageChanged);

      let profileImageUrl = profileImage;

      // Upload image if changed
      if (imageChanged && profileImage && profileImage.startsWith('file://')) {
        try {
          console.log('📤 Uploading image to:', `profile_pictures/${user.uid}/profile.jpg`);
          profileImageUrl = await uploadImage(
            profileImage,
            `profile_pictures/${user.uid}/profile.jpg`
          );
          console.log('Image uploaded successfully:', profileImageUrl);
        } catch (imageError) {
          console.error('Image upload error:', imageError);
          Alert.alert('Image Upload', 'Failed to upload image. Profile will be saved without image update.');
          profileImageUrl = profileImage; // Keep existing image
        }
      }

      // Update Firebase Auth profile
      console.log('📝 Updating Firebase Auth profile...');
      await updateProfile(user, {
        displayName: displayName.trim(),
      });
      console.log('Firebase Auth profile updated');

      // Update Firestore user document
      console.log('Updating Firestore user document...');
      await updateUserDocument(user.uid, {
        displayName: displayName.trim(),
        bio: bio.trim(),
        phone: phone.trim(),
        profileImage: profileImageUrl,
      });
      console.log('Firestore user document updated');

      Alert.alert('Success', 'Profile updated successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={THEME_COLORS.PRIMARY} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Profile Picture Section with Gradient */}
      <LinearGradient
        colors={['#10B981', '#059669']}
        style={styles.pictureSection}
      >
        <TouchableOpacity
          style={styles.imageContainer}
          onPress={showImageOptions}
        >
          {profileImage ? (
            <Image
              source={{ uri: profileImage }}
              style={styles.profileImage}
            />
          ) : (
            <View style={[styles.profileImage, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
              <Ionicons name="person" size={60} color="#FFFFFF" />
            </View>
          )}
          <View style={styles.cameraOverlay}>
            <Ionicons name="camera" size={20} color="#10B981" />
          </View>
        </TouchableOpacity>
        <Text style={styles.profileImageText}>Tap to change photo</Text>
      </LinearGradient>

      {/* Form Fields */}
      <View style={[styles.formSection, { backgroundColor: colors.surface }]}>
        {/* Name Field */}
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Full Name *</Text>
          <View style={[styles.inputContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Ionicons name="person-outline" size={20} color="#10B981" />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Enter your full name"
              placeholderTextColor="#9CA3AF"
              value={displayName}
              onChangeText={setDisplayName}
            />
          </View>
        </View>

        {/* Email Field (Read-only) */}
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Email Address</Text>
          <View style={[styles.inputContainer, { backgroundColor: colors.border, borderColor: colors.border }]}>
            <Ionicons name="mail-outline" size={20} color="#6B7280" />
            <TextInput
              style={[styles.input, { color: '#6B7280' }]}
              placeholder="your@email.com"
              placeholderTextColor="#9CA3AF"
              value={user?.email || ''}
              editable={false}
            />
          </View>
          <Text style={[styles.helperText, { color: colors.textSecondary }]}>
            Email address cannot be changed
          </Text>
        </View>

        {/* Bio Field */}
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Bio</Text>
          <View style={[styles.inputContainer, { height: 100, paddingVertical: 12, alignItems: 'flex-start', backgroundColor: colors.background, borderColor: colors.border }]}>
            <TextInput
              style={[styles.input, { marginLeft: 0, textAlignVertical: 'top', height: '100%', color: colors.text }]}
              placeholder="Tell us about yourself..."
              placeholderTextColor="#9CA3AF"
              value={bio}
              onChangeText={setBio}
              multiline
              maxLength={150}
            />
          </View>
          <Text style={[styles.charCount, { color: colors.textSecondary }]}>
            {bio.length}/150 characters
          </Text>
        </View>

        {/* Phone Field */}
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Phone Number</Text>
          <View style={[styles.inputContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Ionicons name="call-outline" size={20} color="#10B981" />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="e.g., +1 (555) 123-4567"
              placeholderTextColor="#9CA3AF"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* Info Box - Emergency Contacts */}
        <View style={[styles.infoBox, { backgroundColor: `${colors.surface}`, borderColor: colors.border }]}>
          <Ionicons name="information-circle" size={20} color="#10B981" />
          <Text style={[styles.infoBoxText, { color: colors.text }]}>
            Emergency contacts are managed in the Safety section
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.cancelButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={saveProfile}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator color={colors.text} size="small" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={18} color={colors.text} />
              <Text style={[styles.saveButtonText, { color: colors.text }]}>Save Changes</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  pictureSection: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  profileImageText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
  },
  formSection: {
    marginHorizontal: 16,
    marginTop: -30,
    marginBottom: 20,
    borderRadius: 20,
    padding: 24,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#374151',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
  },
  helperText: {
    fontSize: 12,
    marginTop: 6,
    fontStyle: 'italic',
    color: '#6B7280',
  },
  charCount: {
    fontSize: 12,
    marginTop: 6,
    textAlign: 'right',
    color: '#6B7280',
  },
  infoBox: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#10B981',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 4,
  },
  infoBoxText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: '#065F46',
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 20,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#000000',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#000000',
  },
  saveButtonDisabled: {
    backgroundColor: '#F3F4F6',
    borderColor: '#9CA3AF',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
});

export default EditProfileScreen;
