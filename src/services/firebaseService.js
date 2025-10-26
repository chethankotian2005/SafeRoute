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
  onSnapshot,
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
 * Update user document (creates if doesn't exist)
 */
export const updateUserDocument = async (userId, updates) => {
  try {
    const userRef = doc(firestore, 'users', userId);
    
    // Check if document exists
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      // Update existing document
      await updateDoc(userRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } else {
      // Create new document
      await setDoc(userRef, {
        ...updates,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error('Error updating user document:', error);
    throw error;
  }
};

/**
 * Update user profile with image upload support
 */
export const updateUserProfile = async (userId, profileData) => {
  try {
    let uploadedImageUrl = null;

    // Upload profile image if provided and it's a file URI
    if (profileData.profileImage && profileData.profileImage.startsWith('file://')) {
      try {
        uploadedImageUrl = await uploadImage(
          profileData.profileImage,
          `profile_pictures/${userId}/profile.jpg`
        );
      } catch (imageError) {
        console.error('Image upload failed:', imageError);
        // Continue without uploading image
      }
    }

    // Update Firebase Auth profile
    const authUser = auth.currentUser;
    if (authUser && profileData.displayName) {
      await updateProfile(authUser, {
        displayName: profileData.displayName,
      });
    }

    // Update Firestore user document
    const userRef = doc(firestore, 'users', userId);
    const updateData = {
      displayName: profileData.displayName || '',
      bio: profileData.bio || '',
      phone: profileData.phone || '',
      emergencyContact: profileData.emergencyContact || '',
      updatedAt: serverTimestamp(),
    };

    // Only update profileImage if upload succeeded
    if (uploadedImageUrl) {
      updateData.profileImage = uploadedImageUrl;
    }

    await updateDoc(userRef, updateData);
  } catch (error) {
    console.error('Error updating user profile:', error);
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
 * Update a community report document
 */
export const updateCommunityReport = async (reportId, updates) => {
  try {
    const reportRef = doc(firestore, 'community_reports', reportId);
    await updateDoc(reportRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating community report:', error);
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
      const lat = data?.location?.latitude;
      const lng = data?.location?.longitude;

      // Compute distance in km if we have current location and report coords
      let distanceKm = null;
      if (location && typeof lat === 'number' && typeof lng === 'number') {
        distanceKm = haversineKm(
          location.latitude,
          location.longitude,
          lat,
          lng
        );
      }

      reports.push({
        id: doc.id,
        ...data,
        location: {
          latitude: lat,
          longitude: lng,
        },
        distanceKm,
      });
    });

    // Filter by radius if distance is available
    // If a radius was provided, return only those within the radius.
    if (typeof radiusKm === 'number') {
      const filtered = Array.isArray(reports)
        ? reports.filter((r) => typeof r.distanceKm === 'number' && r.distanceKm <= radiusKm)
        : [];
      return filtered;
    }

    return reports;
  } catch (error) {
    console.error('Error getting community reports:', error);
    throw error;
  }
};

/**
 * Haversine distance in kilometers
 */
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const toRad = (v) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

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
    // Default radius to 0.5 km if not supplied
    const alertPayload = {
      userId: currentUser.uid,
      location: new GeoPoint(location.latitude, location.longitude),
      emergencyContacts,
      active: true,
      timestamp: serverTimestamp(),
      deactivatedAt: null,
      radiusKm: 0.5,
    };

    const alert = await addDoc(sosRef, alertPayload);

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

/**
 * Listen for active SOS alerts (client-side listener)
 * callback will be called with an array of alert objects when there are changes
 */
export const listenToActiveSOSAlerts = (callback) => {
  try {
    const sosRef = collection(firestore, 'sos_alerts');
    const q = query(
      sosRef,
      where('active', '==', true),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const alerts = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        alerts.push({ id: docSnap.id, ...data });
      });

      callback(alerts);
    }, (err) => {
      console.error('Error listening to SOS alerts:', err);
    });

    return unsubscribe;
  } catch (error) {
    console.error('Error setting up SOS alerts listener:', error);
    return () => {};
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
    const imageRef = storageRef(storage, path);

    // Try using fetch -> blob first (works in many Expo environments)
    let blob = null;
    try {
      const response = await fetch(uri);
      blob = await response.blob();
    } catch (e) {
      // Fallback for content:// URIs or environments where fetch->blob fails
      blob = await uriToBlob(uri);
    }

    await uploadBytes(imageRef, blob);

    // Close blob if supported to free memory
    if (blob && typeof blob.close === 'function') {
      try { blob.close(); } catch (_) {}
    }

    const downloadURL = await getDownloadURL(imageRef);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

// Helper: convert URI to Blob using XMLHttpRequest (robust on Android content://)
async function uriToBlob(uri) {
  return await new Promise((resolve, reject) => {
    try {
      const xhr = new XMLHttpRequest();
      xhr.onerror = () => reject(new TypeError('Network request failed'));
      xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            resolve(xhr.response);
          } else {
            reject(new TypeError(`Blob request failed with status ${xhr.status}`));
          }
        }
      };
      xhr.open('GET', uri);
      xhr.responseType = 'blob';
      xhr.send();
    } catch (e) {
      reject(e);
    }
  });
}

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

// ==================== EMERGENCY CONTACTS ====================

/**
 * Get all emergency contacts for a user
 */
export const getEmergencyContacts = async (userId) => {
  try {
    const contactsRef = collection(firestore, 'users', userId, 'emergency_contacts');
    const querySnapshot = await getDocs(contactsRef);
    const contacts = [];

    querySnapshot.forEach((doc) => {
      contacts.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return contacts;
  } catch (error) {
    console.error('Error getting emergency contacts:', error);
    throw error;
  }
};

/**
 * Add emergency contact for a user
 */
export const addEmergencyContact = async (userId, contactData) => {
  try {
    const contactsRef = collection(firestore, 'users', userId, 'emergency_contacts');
    const docRef = await addDoc(contactsRef, {
      name: contactData.name,
      number: contactData.number,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return docRef.id;
  } catch (error) {
    console.error('Error adding emergency contact:', error);
    throw error;
  }
};

/**
 * Delete emergency contact for a user
 */
export const deleteEmergencyContact = async (userId, contactId) => {
  try {
    const contactRef = doc(firestore, 'users', userId, 'emergency_contacts', contactId);
    await deleteDoc(contactRef);
  } catch (error) {
    console.error('Error deleting emergency contact:', error);
    throw error;
  }
};

/**
 * Update emergency contact for a user
 */
export const updateEmergencyContact = async (userId, contactId, contactData) => {
  try {
    const contactRef = doc(firestore, 'users', userId, 'emergency_contacts', contactId);
    await updateDoc(contactRef, {
      name: contactData.name,
      number: contactData.number,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating emergency contact:', error);
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
  updateUserProfile,
  
  // Reports
  addCommunityReport,
  getCommunityReportsNearLocation,
  upvoteCommunityReport,
  
  // SOS
  createSOSAlert,
  deactivateSOSAlert,
  listenToActiveSOSAlerts,
  
  // Emergency Contacts
  getEmergencyContacts,
  addEmergencyContact,
  deleteEmergencyContact,
  updateEmergencyContact,
  
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
