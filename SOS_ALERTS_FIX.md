# SOS Alerts System Fix

## Problem Summary
User reported three critical issues with the SOS alert system:
1. **App startup notifications**: "Bunch of SOS alerts" when opening the app
2. **Duplicate SMS sends**: Multiple SMS notifications instead of one
3. **Self-notifications**: User receiving alerts for their own SOS activation

## Root Causes Identified

### Issue 1: Self-Notifications (FIXED ✅)
**Location**: `src/hooks/useSOSAlertsListener.js`
**Root Cause**: The listener was alerting the user for ALL nearby SOS alerts without checking if they were the creator
**Fix**: Added userId check to exclude user's own SOS alerts from notifications

### Issue 2: Missing SMS to Emergency Contacts (FIXED ✅)
**Location**: `src/screens/SOSScreen.jsx`
**Root Cause**: No SMS was being sent to user's emergency contacts on SOS activation
**Fix**: Added SMS sending functionality that calls `twilioService.sendEmergencySMSToMultiple()`

### Issue 3: App Startup Alerts (PARTIALLY FIXED)
**Location**: `src/hooks/useSOSAlertsListener.js`
**Root Cause**: Hook was triggering on any existing SOS alert in Firestore when app launched
**Fix**: With userId filter in place, app should no longer alert for existing alerts from other users

## Code Changes

### 1. useSOSAlertsListener.js - Added userId Filter

**Before:**
```javascript
for (const alert of alerts) {
  try {
    if (!alert || !alert.id) continue;

    // Avoid notifying about the same alert repeatedly
    if (alertedRef.current.has(alert.id)) continue;
```

**After:**
```javascript
for (const alert of alerts) {
  try {
    if (!alert || !alert.id) continue;

    // Don't notify about your own SOS alert
    const currentUser = getCurrentUser();
    if (currentUser && alert.userId === currentUser.uid) continue;

    // Avoid notifying about the same alert repeatedly
    if (alertedRef.current.has(alert.id)) continue;
```

**Key Addition**: 
- Imported `getCurrentUser` from firebaseService
- Check if `alert.userId === currentUser.uid` before notifying
- This prevents user from receiving notifications for their own SOS

### 2. SOSScreen.jsx - Added SMS Sending

**Import Addition:**
```javascript
import twilioService from '../services/twilioService';
```

**Functionality Addition in handleSOSActivation:**
```javascript
// Send SMS to user's emergency contacts only (not default services)
const userContacts = emergencyContacts.filter(contact => contact.id);
if (userContacts.length > 0) {
  try {
    const userName = user.displayName || 'Someone';
    await twilioService.sendEmergencySMSToMultiple(userContacts, currentLocation, userName);
  } catch (smsErr) {
    console.error('Failed to send SMS:', smsErr);
    // Continue even if SMS fails - SOS alert is still created
  }
}
```

**Key Details:**
- Filters emergency contacts to only include user-added contacts (those with `id` property)
- Excludes default emergency services (Police, Ambulance, Fire, Women Helpline)
- Sends SMS only once when SOS is activated
- Continues even if SMS fails (graceful degradation)

## How It Works Now

### User Activates SOS:
1. **Create Alert**: SOS alert stored in Firestore with `userId` and `status: 'active'`
2. **Send SMS**: Single SMS sent to all user's emergency contacts with location link
3. **In-app Notification**: User receives confirmation that SOS was activated
4. **Nearby Alerts**: Nearby users (except the SOS creator) receive notifications

### App Opens with Existing SOS:
1. **Old Alerts Ignored**: Only active SOS alerts from OTHER users within 0.5km trigger alerts
2. **User's Own Alert Ignored**: User's own SOS (if still active) won't create self-notifications
3. **Duplicate Prevention**: Set-based tracking prevents notifying about same alert twice

## Testing Checklist

- [ ] Open app without any active SOS - should NOT show alerts
- [ ] Add emergency contact
- [ ] Activate SOS - should send SMS to contact only once
- [ ] Check SMS was received by emergency contact (with location)
- [ ] User should NOT receive SOS notification for their own alert
- [ ] Deactivate SOS - alert should be deactivated
- [ ] Other nearby users should still receive notifications for existing SOS

## Emergency SMS Format

When user activates SOS, emergency contacts receive:
```
Emergency SOS alert from [UserName]!
Location: [Google Maps Link with Coordinates]
They need help now!
```

## Security Notes

- ⚠️ **Twilio Credentials**: Currently hardcoded in `twilioService.js`
  - Should be moved to Firebase Cloud Functions or environment variables
  - Consider using Firebase Realtime Database for phone numbers instead of storing in Firestore
