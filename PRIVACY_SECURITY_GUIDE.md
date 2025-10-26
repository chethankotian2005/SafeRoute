# Privacy & Security Settings - Complete Guide

## Overview
The Privacy & Security screen provides comprehensive control over app permissions, security features, and data privacy preferences. Users can manage what data the app can access and enable advanced security features.

---

## Features

### 🔐 **App Permissions Management**
- Camera access control
- Location access (foreground & background)
- Contacts access
- Notifications access
- Media library access

### 🛡️ **Security Features**
- Biometric authentication (fingerprint/face recognition)
- Session timeout auto-logout
- Data encryption (always-on)
- Secure data storage

### 👁️ **Privacy Settings**
- Analytics tracking control
- Location history tracking
- Data export and import
- Clear app cache and data

---

## How to Access

**Navigation Path:**
```
Profile Tab 
    ↓
Preferences Section
    ↓
"Privacy & Security"
    ↓
PrivacySecurityScreen
```

---

## Sections & Settings

### **1. App Permissions Section**

#### **Camera** 📷
- **Purpose:** Profile photos, incident photos
- **Default:** Disabled
- **Action:** Toggle to enable/disable
- **Effect:** Allows app to access device camera

#### **Location** 📍
- **Purpose:** Navigation, safety features, SOS
- **Default:** Disabled
- **Action:** Toggle to enable/disable
- **Effect:** Allows app to get precise GPS coordinates
- **Note:** Can request background location for SOS

#### **Contacts** 👥
- **Purpose:** Emergency contact management
- **Default:** Disabled
- **Action:** Toggle to enable/disable
- **Effect:** Allows app to read and access contacts

#### **Notifications** 🔔
- **Purpose:** Safety alerts, SOS notifications, app updates
- **Default:** Disabled
- **Action:** Toggle to enable/disable
- **Effect:** Allows app to send push notifications

#### **Media Library** 🖼️
- **Purpose:** Photo uploads for profiles and reports
- **Default:** Disabled
- **Action:** Toggle to enable/disable
- **Effect:** Allows app to access photos and videos

---

### **2. Security Features Section**

#### **Biometric Authentication** 🔐
- **Purpose:** Unlock app with fingerprint or face
- **Availability:** Only on devices with biometric hardware
- **How to Enable:**
  1. Toggle switch to ON
  2. Authenticate with your fingerprint or face
  3. Setting is saved
- **Requirements:** Device must have enrolled fingerprint/face
- **Benefit:** Quick and secure access to app

#### **Session Timeout** ⏱️
- **Purpose:** Auto-logout if inactive
- **Options:**
  - 5 minutes
  - 15 minutes (default)
  - 30 minutes
  - 1 hour
  - Never (not recommended)
- **How It Works:**
  1. Timer starts when user closes app
  2. If inactive > set duration, session ends
  3. User must log in again
  4. Activity resets timer

#### **Data Encryption** 🔒
- **Status:** Always enabled (cannot be disabled)
- **Scope:** All sensitive user data
- **Types Protected:**
  - Location history
  - Route data
  - Emergency contacts
  - Personal information

---

### **3. Privacy Settings Section**

#### **Analytics** 📊
- **Purpose:** Help improve app with usage data
- **Default:** Enabled
- **Data Collected:**
  - Feature usage
  - Crash reports
  - Performance metrics
- **Data Not Collected:**
  - Personal information
  - Location details
  - Contact information
- **Benefit:** Help make app safer and better

#### **Location History** 🗺️
- **Purpose:** Store your navigation history
- **Default:** Enabled
- **Uses:**
  - Route statistics
  - Safety analytics
  - Travel patterns
- **Benefit:** Personalized safety insights

---

### **4. Data Management Section**

#### **Export My Data** 📥
- **Purpose:** Download your data in JSON format
- **Includes:**
  - Profile information
  - Routes and history
  - Safety reports
  - Preferences
- **Excludes:**
  - Authentication data
  - Sensitive tokens
- **Steps:**
  1. Tap "Export My Data"
  2. Confirm action
  3. Data is prepared
  4. Download link provided
- **Format:** JSON file
- **GDPR Compliant:** Yes

#### **Clear App Data** 🗑️
- **Purpose:** Delete all cached data
- **Warning:** This cannot be undone
- **Effect:**
  - Clears app cache
  - Removes local storage
  - Does NOT delete server data
  - Requires re-login
- **When to Use:**
  - Before selling device
  - To fix app issues
  - For privacy

---

## Permission Behavior

### **On First Request**
```
User toggles permission ON
    ↓
App shows system permission dialog
    ↓
User grants/denies in system dialog
    ↓
Result reflected in app settings
```

### **If Permission Denied**
```
If user denies:
    ↓
Feature disabled (grayed out)
    ↓
Can be re-enabled in:
  - App Settings
  - Device Settings → Apps → SafeRoute → Permissions
```

### **Background Location**
```
For SOS to work in background:
    ↓
1. Foreground location must be enabled
    ↓
2. iOS: Request background location
    ↓
3. Android: Automatic with foreground permission
```

---

## Security Features Explained

### **Biometric Authentication Flow**

```
User enables biometric
    ↓
Device prompts for fingerprint/face
    ↓
Authentication successful?
    ├─ YES → Save setting, enable biometric
    └─ NO → Stay disabled
    
Later, at app launch:
    ↓
System detects biometric enabled
    ↓
Request biometric authentication
    ├─ SUCCESS → Unlock app
    └─ FAILURE → Show password login
```

### **Session Timeout Flow**

```
User closes app
    ↓
Timer starts (hidden)
    
User returns within timeout
    └─ App unlocks normally
    
User returns after timeout
    ├─ Session expired
    ├─ User logged out
    └─ Must re-authenticate
```

### **Data Encryption**

```
Sensitive Data:
    ├─ Location history
    ├─ Routes
    ├─ Contact numbers
    ├─ Personal info
    └─ All stored encrypted

Encryption Method:
    ├─ AES-256 (standard)
    ├─ Device keystore
    └─ Server-side encryption

Decryption:
    └─ Only with user authentication
```

---

## Security Best Practices

### ✅ **Recommended Settings**
- ✓ Enable location for safety
- ✓ Enable notifications for alerts
- ✓ Enable biometric if available
- ✓ Session timeout: 15 minutes
- ✓ Keep analytics enabled (helps safety)
- ✓ Location history: ON (for patterns)

### ❌ **NOT Recommended**
- ✗ Session timeout: Never (security risk)
- ✗ Disable location (can't use safety features)
- ✗ Disable notifications (miss emergencies)
- ✗ Clear data frequently (inconvenient)

### 🔒 **Before Traveling Alone**
1. ✅ Ensure location is enabled
2. ✅ Enable biometric authentication
3. ✅ Add emergency contacts
4. ✅ Set session timeout to 30 minutes
5. ✅ Share location with trusted contacts

---

## File Structure

```
src/
├── screens/
│   └── PrivacySecurityScreen.jsx      ← Main UI
│
└── services/
    ├── permissionsService.js           ← Permission management
    └── securityService.js              ← Security settings
```

---

## API Reference

### **Permissions Service**

```javascript
import permissionsService from '../services/permissionsService';

// Check permissions
const status = await permissionsService.checkCameraPermission();
// Returns: 'granted', 'denied', 'undetermined'

// Request permissions
const result = await permissionsService.requestLocationPermission();

// Check multiple
const all = await permissionsService.checkMultiplePermissions();
// Returns: { camera, location, contacts, notifications, mediaLibrary }
```

### **Security Service**

```javascript
import securityService from '../services/securityService';

// Biometric
const available = await securityService.isBiometricAvailable();
await securityService.enableBiometric();

// Session
await securityService.setSessionTimeout('15');
const expired = await securityService.isSessionExpired();

// Secure storage
await securityService.storeSecureData('key', 'value');
const data = await securityService.getSecureData('key');

// Analytics
await securityService.setAnalyticsEnabled(true);
```

---

## UI Components

### **Permission Row**
- Icon (colored if enabled)
- Label and description
- Toggle switch
- Visual feedback

### **Session Timeout Selector**
- Current setting display
- Dropdown menu
- Quick options
- Confirmation dialog

### **Action Buttons**
- Export Data (blue)
- Clear Data (red)
- Each with confirmation

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Biometric not showing | Check device supports biometric & fingerprint enrolled |
| Permission not sticking | Grant in system settings, then toggle in app |
| Session not timing out | Check AsyncStorage permissions |
| Can't export data | Ensure storage permission enabled |
| Background location not working | Enable foreground first, then background |

---

## GDPR Compliance

### ✅ **Compliant Features**
- Data export functionality
- Clear/delete data option
- Granular permission controls
- Transparent data collection
- No mandatory tracking
- Privacy policy available

### **User Rights**
- Right to access: Via data export
- Right to delete: Via clear data
- Right to opt-out: Toggle analytics/history
- Right to know: Privacy settings show all tracking

---

## Device Compatibility

| Feature | iOS | Android |
|---------|-----|---------|
| Camera permission | ✅ | ✅ |
| Location | ✅ | ✅ |
| Contacts | ✅ | ✅ |
| Notifications | ✅ | ✅ |
| Media Library | ✅ | ✅ |
| Biometric (fingerprint) | ✅ | ✅ |
| Biometric (face) | ✅ (Face ID) | ✅ (Limited) |
| Secure storage | ✅ | ✅ |
| Session timeout | ✅ | ✅ |

---

## Security Features Summary

| Feature | Type | Status | Requirement |
|---------|------|--------|------------|
| Biometric Auth | Security | Optional | Device support |
| Session Timeout | Security | Configurable | AsyncStorage |
| Data Encryption | Security | Always-on | Built-in |
| Secure Storage | Security | Integrated | Secure keystore |
| Permission Control | Privacy | Granular | System OS |
| Analytics Toggle | Privacy | Optional | User choice |
| Data Export | GDPR | Required | Enabled |
| Data Deletion | GDPR | Required | Enabled |

---

## Future Enhancements

- [ ] PIN code authentication
- [ ] Password strength meter
- [ ] Two-factor authentication (2FA)
- [ ] Device fingerprinting
- [ ] Anomaly detection
- [ ] Login activity log
- [ ] Trusted device list
- [ ] Advanced encryption options

---

**Version:** 1.0.0  
**Last Updated:** October 25, 2025  
**Status:** Production Ready ✅
