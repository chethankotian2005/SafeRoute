/**
 * Firebase Service
 * Handles all Firebase operations: Authentication, Firestore, Realtime Database
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  PhoneAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  GeoPoint,
} from 'firebase/firestore';
import { ref, set, onValue, off, update, remove } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, firestore, realtimeDb, storage } from '../config/firebaseConfig';
import { validateEmail, validatePassword, validatePhone } from '../utils/validators';

// ==================== AUTHENTICATION ====================

/**
 * Sign up with email and password
 */
export const signUpWithEmail = async (email, password, displayName) => {
  try {
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      throw new Error(emailValidation.error);
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      throw new Error(passwordValidation.error);
    }

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update display name
    if (displayName) {
      await updateProfile(userCredential.user, { displayName });
    }

    // Create user document in Firestore
    await createUserDocument(userCredential.user.uid, {
      email,
      displayName: displayName || '',
      createdAt: serverTimestamp(),
    });

    return userCredential.user;
  } catch (error) {
    console.error('Sign up error:', error);
    throw error;
  }
};

/**
 * Sign in with email and password
 */
export const signInWithEmail = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  }
};

/**
 * Sign out current user
 */
export const signOutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
};

/**
 * Send password reset email
 */
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error('Password reset error:', error);
    throw error;
  }
};

/**
 * Get current user
 */
export const getCurrentUser = () => {
  return auth.currentUser;
};

// ==================== USER MANAGEMENT ====================

/**
 * Create user document in Firestore
 */
export const createUserDocument = async (userId, userData) => {
  try {
    const userRef = doc(firestore, 'users', userId);
    await setDoc(userRef, {
      ...userData,
      emergencyContacts: [],
      preferences: {
        language: 'en',
        navigationMode: 'walking',
        routePreference: 'safest',
        accessibilityMode: false,
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error creating user document:', error);
    throw error;
  }
};

/**
 * Get user document from Firestore
 */
export const getUserDocument = async (userId) => {
  try {
    const userRef = doc(firestore, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return { id: userSnap.id, ...userSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting user document:', error);
    throw error;
  }
};

/**
 * Update user document
 */
export const updateUserDocument = async (userId, updates) => {
  try {
    const userRef = doc(firestore, 'users', userId);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating user document:', error);
    throw error;
  }
};

// ==================== COMMUNITY REPORTS ====================

/**
 * Add community report
 */
export const addCommunityReport = async (reportData) => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) throw new Error('User not authenticated');

    const reportsRef = collection(firestore, 'community_reports');
    const report = await addDoc(reportsRef, {
      ...reportData,
      userId: currentUser.uid,
      location: new GeoPoint(reportData.location.latitude, reportData.location.longitude),
      timestamp: serverTimestamp(),
      verified: false,
      upvotes: 0,
      upvotedBy: [],
    });

    return report.id;
  } catch (error) {
    console.error('Error adding community report:', error);
    throw error;
  }
};

/**
 * Get community reports near location
 */
export const getCommunityReportsNearLocation = async (location, radiusKm = 5) => {
  try {
    // Note: For production, implement geohashing for efficient geo queries
    // This is a simplified version
    const reportsRef = collection(firestore, 'community_reports');
    const q = query(
      reportsRef,
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const querySnapshot = await getDocs(q);
    const reports = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      reports.push({
        id: doc.id,
        ...data,
        location: {
          latitude: data.location.latitude,
          longitude: data.location.longitude,
        },
      });
    });

    return reports;
  } catch (error) {
    console.error('Error getting community reports:', error);
    throw error;
  }
};

/**
 * Upvote community report
 */
export const upvoteCommunityReport = async (reportId) => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) throw new Error('User not authenticated');

    const reportRef = doc(firestore, 'community_reports', reportId);
    const reportSnap = await getDoc(reportRef);

    if (reportSnap.exists()) {
      const data = reportSnap.data();
      const upvotedBy = data.upvotedBy || [];

      if (!upvotedBy.includes(currentUser.uid)) {
        await updateDoc(reportRef, {
          upvotes: (data.upvotes || 0) + 1,
          upvotedBy: [...upvotedBy, currentUser.uid],
        });
      }
    }
  } catch (error) {
    console.error('Error upvoting report:', error);
    throw error;
  }
};

// ==================== SOS ALERTS ====================

/**
 * Create SOS alert
 */
export const createSOSAlert = async (location, emergencyContacts) => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) throw new Error('User not authenticated');

    const sosRef = collection(firestore, 'sos_alerts');
    const alert = await addDoc(sosRef, {
      userId: currentUser.uid,
      location: new GeoPoint(location.latitude, location.longitude),
      emergencyContacts,
      active: true,
      timestamp: serverTimestamp(),
      deactivatedAt: null,
    });

    // Also create real-time tracking entry
    await startLiveTracking(alert.id, location);

    return alert.id;
  } catch (error) {
    console.error('Error creating SOS alert:', error);
    throw error;
  }
};

/**
 * Deactivate SOS alert
 */
export const deactivateSOSAlert = async (alertId) => {
  try {
    const alertRef = doc(firestore, 'sos_alerts', alertId);
    await updateDoc(alertRef, {
      active: false,
      deactivatedAt: serverTimestamp(),
    });

    // Stop live tracking
    await stopLiveTracking(alertId);
  } catch (error) {
    console.error('Error deactivating SOS alert:', error);
    throw error;
  }
};

// ==================== REAL-TIME LOCATION TRACKING ====================

/**
 * Start live location tracking
 */
export const startLiveTracking = async (trackingId, location) => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) throw new Error('User not authenticated');

    const trackingRef = ref(realtimeDb, `live_tracking/${trackingId}`);
    await set(trackingRef, {
      userId: currentUser.uid,
      latitude: location.latitude,
      longitude: location.longitude,
      timestamp: Date.now(),
      active: true,
    });
  } catch (error) {
    console.error('Error starting live tracking:', error);
    throw error;
  }
};

/**
 * Update live location
 */
export const updateLiveLocation = async (trackingId, location) => {
  try {
    const trackingRef = ref(realtimeDb, `live_tracking/${trackingId}`);
    await update(trackingRef, {
      latitude: location.latitude,
      longitude: location.longitude,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Error updating live location:', error);
    throw error;
  }
};

/**
 * Stop live tracking
 */
export const stopLiveTracking = async (trackingId) => {
  try {
    const trackingRef = ref(realtimeDb, `live_tracking/${trackingId}`);
    await update(trackingRef, { active: false });
  } catch (error) {
    console.error('Error stopping live tracking:', error);
    throw error;
  }
};

/**
 * Listen to live location updates
 */
export const listenToLiveLocation = (trackingId, callback) => {
  const trackingRef = ref(realtimeDb, `live_tracking/${trackingId}`);
  onValue(trackingRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      callback(data);
    }
  });

  // Return unsubscribe function
  return () => off(trackingRef);
};

// ==================== FILE UPLOAD ====================

/**
 * Upload image to Firebase Storage
 */
export const uploadImage = async (uri, path) => {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    
    const imageRef = storageRef(storage, path);
    await uploadBytes(imageRef, blob);
    
    const downloadURL = await getDownloadURL(imageRef);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

/**
 * Upload report image
 */
export const uploadReportImage = async (imageUri, reportId) => {
  const path = `report_images/${reportId}/${Date.now()}.jpg`;
  return await uploadImage(imageUri, path);
};

// ==================== SAFE SPOTS ====================

/**
 * Get safe spots near location
 */
export const getSafeSpotsNearLocation = async (location, radiusKm = 1) => {
  try {
    const spotsRef = collection(firestore, 'safe_spots');
    const q = query(spotsRef, limit(50));

    const querySnapshot = await getDocs(q);
    const spots = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      spots.push({
        id: doc.id,
        ...data,
        location: {
          latitude: data.location.latitude,
          longitude: data.location.longitude,
        },
      });
    });

    return spots;
  } catch (error) {
    console.error('Error getting safe spots:', error);
    throw error;
  }
};

export default {
  // Auth
  signUpWithEmail,
  signInWithEmail,
  signOutUser,
  resetPassword,
  getCurrentUser,
  
  // User
  createUserDocument,
  getUserDocument,
  updateUserDocument,
  
  // Reports
  addCommunityReport,
  getCommunityReportsNearLocation,
  upvoteCommunityReport,
  
  // SOS
  createSOSAlert,
  deactivateSOSAlert,
  
  // Tracking
  startLiveTracking,
  updateLiveLocation,
  stopLiveTracking,
  listenToLiveLocation,
  
  // Storage
  uploadImage,
  uploadReportImage,
  
  // Safe Spots
  getSafeSpotsNearLocation,
};
