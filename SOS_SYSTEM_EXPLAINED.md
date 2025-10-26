# SOS System - Complete Technical Breakdown

## Overview
The SOS (Save Our Souls/Save Our Safety) system is a real-time emergency alert network that helps vulnerable populations by notifying nearby app users when someone activates an emergency alert.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         SAFEROUTE APP                           │
└─────────────────────────────────────────────────────────────────┘
                               │
                ┌──────────────┼──────────────┐
                │              │              │
         ┌──────▼────┐  ┌──────▼────┐  ┌─────▼──────┐
         │ SOSScreen  │  │   Hooks   │  │ Services   │
         │            │  │           │  │            │
         │ User taps  │  │useSOSAlerts│  │Firebase    │
         │ SOS button │  │Listener   │  │Notification│
         └────────────┘  └───────────┘  └────────────┘
                │              │              │
                └──────────────┼──────────────┘
                               │
                    ┌──────────▼─────────┐
                    │   FIREBASE         │
                    │  (Cloud Backend)   │
                    └──────────┬─────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
    ┌───▼─────┐        ┌──────▼────┐        ┌───────▼──┐
    │Firestore│        │ Realtime  │        │ Storage  │
    │Database │        │ Database  │        │ (Images) │
    │          │        │           │        │          │
    │sos_alerts│        │live_track │        │profiles  │
    └──────────┘        └───────────┘        └──────────┘
        │                      │
        │ Real-time            │ Location
        │ listener             │ tracking
        │                      │
    ┌───▼──────────────────────▼──┐
    │  NEARBY DEVICES              │
    │  (Other app users)           │
    │                              │
    │  App is listening for:       │
    │  - Active SOS alerts         │
    │  - Device location           │
    │  - Distance calculation      │
    └──────────────────────────────┘
```

---

## Step-by-Step Flow

### **STEP 1: User Activates SOS**

**Location:** `src/screens/SOSScreen.jsx`

```javascript
// User long-presses or taps the SOS button
handleSOSActivation()
  ├─ Gets user's current GPS location
  ├─ Calls firebaseService.createSOSAlert(location, contacts)
  └─ Shows confirmation alert
```

**What data is sent to Firebase:**
```javascript
{
  userId: "user123",                    // WHO is activating
  location: GeoPoint(lat, lng),         // WHERE the emergency is
  emergencyContacts: [                  // WHO to notify
    { name: 'Police', number: '100' },
    { name: 'Ambulance', number: '108' }
  ],
  active: true,                         // Status flag
  timestamp: Date.now(),                // WHEN it happened
  radiusKm: 0.5,                        // Alert radius (500 meters)
  deactivatedAt: null
}
```

**Two databases get updated:**

1. **Firestore** - Persistent storage
   - Location: `sos_alerts/[alertId]`
   - Stores all SOS alert details
   - Queries: `WHERE active==true`

2. **Realtime Database** - Live location tracking
   - Location: `live_tracking/[alertId]`
   - Constantly updates with user's moving location
   - Used for real-time position updates

---

### **STEP 2: System Creates Real-Time Tracking**

**Location:** `src/services/firebaseService.js` → `startLiveTracking()`

```javascript
await startLiveTracking(alert.id, location)
  └─ Creates entry in Realtime Database at: live_tracking/{alertId}
     {
       userId: "user123",
       latitude: 12.9716,
       longitude: 77.5946,
       timestamp: 1698230400000,
       active: true
     }
```

**Purpose:** 
- Allows continuous location updates
- Other devices can track the SOS person's movement
- Real-time updates (no polling needed)

---

### **STEP 3: Other Users' Devices Listen for SOS Alerts**

**Location:** `src/hooks/useSOSAlertsListener.js`

This hook runs **continuously** on every user's device:

```javascript
useSOSAlertsListener()
  ├─ Mounts when app starts
  ├─ Subscribes to Firestore query:
  │  └─ SELECT * FROM sos_alerts WHERE active==true
  │
  └─ WHENEVER a new alert is created:
     ├─ Gets the new alert data
     ├─ Gets THIS device's current location
     ├─ Calculates distance using GPS coordinates
     └─ IF distance <= 0.5km THEN trigger notification
```

---

### **STEP 4: Distance Calculation**

**How nearby devices know if they're close enough:**

```javascript
// Get distances between two GPS points
const distanceMeters = calculateDistance(
  deviceLocation: { lat: 12.9720, lng: 77.5945 },  // Me
  alertLocation:  { lat: 12.9716, lng: 77.5946 }   // SOS person
)

// Using Haversine formula (maps algorithm)
// Result: ~450 meters

// Check if within alert radius
const radiusMeters = 0.5 km × 1000 = 500 meters
if (450 <= 500) {
  ✅ TRIGGER NOTIFICATION
} else {
  ❌ Ignore (too far away)
}
```

**Important:** Only devices within **500 meters** get the alert!

---

### **STEP 5: Trigger Notifications on Nearby Devices**

**Location:** `src/hooks/useSOSAlertsListener.js` + `src/services/sosNotificationService.js`

When distance check passes, **3 things happen simultaneously:**

#### **A) Vibration Alert**
```javascript
Vibration.vibrate([0, 100, 100, 100, 100, 100])
         Platform.OS === 'ios'  : Shorter pattern
         Platform.OS === 'android': Longer, more intense pattern
```
**Result:** Device vibrates urgently to grab user's attention

#### **B) Push Notification**
```javascript
Notifications.scheduleNotificationAsync({
  content: {
    title: '🚨 SOS DEPLOYED NEARBY 🚨',
    body: 'Emergency alert activated 245m away. Someone needs help!',
    sound: 'default',
    priority: 'high',
    badge: 1,
    data: { sosId, distance }
  },
  trigger: null  // Send immediately
})
```
**Result:** Notification appears in notification center with sound

#### **C) In-App Alert**
```javascript
Alert.alert(
  '🚨 SOS DEPLOYED NEARBY',
  'Emergency SOS activated 245m from your location.\n\nSomeone nearby needs help!',
  [
    { text: 'View Location', onPress: () => {...} },
    { text: 'Close', style: 'cancel' }
  ]
)
```
**Result:** Full-screen alert with action buttons

---

### **STEP 6: User Responds to Alert**

The notified user has options:

```
Option 1: View Location
  └─ User can tap to see exactly where SOS is
  
Option 2: Call Emergency Services
  └─ Quick dial: Police, Ambulance, Fire, etc.
  
Option 3: Offer Help
  └─ Share their location with SOS person
  └─ Meet at safe location
  
Option 4: Close/Ignore
  └─ User can dismiss if unable to help
```

---

### **STEP 7: SOS Person Deactivates Alert**

**Location:** `src/screens/SOSScreen.jsx`

When emergency is over:

```javascript
handleSOSActivation() // toggles to OFF
  ├─ Calls firebaseService.deactivateSOSAlert(alertId)
  │  └─ Sets active: false in Firestore
  │  └─ Stops live tracking in Realtime Database
  │
  └─ Sends confirmation notification
     └─ "✅ SOS Deactivated"
```

**Result:**
- Alert disappears from all other devices' listeners
- Live location tracking stops
- No more notifications sent

---

## Real-World Example Scenario

### **Timeline:**

```
🕐 14:30 - Sarah is walking alone in a dark area
           └─ Feels unsafe, presses SOS button

🕐 14:30:02 - STEP 1: SOS Alert Created
             Location: 12.9716°N, 77.5946°E (Bangalore)
             Radius: 500 meters
             Status: ACTIVE
             └─ Alert saved to Firebase

🕐 14:30:03 - STEP 2: Real-time Tracking Started
             └─ Sarah's location updated every second

🕐 14:30:04 - STEP 3-5: Nearby Devices React
             
    Device 1 (Raj):
      ├─ Distance: 250 meters ✅
      ├─ Receives VIBRATION
      ├─ Receives PUSH NOTIFICATION
      ├─ Sees IN-APP ALERT
      └─ "Oh no! Someone needs help nearby!"
    
    Device 2 (Priya):
      ├─ Distance: 600 meters ❌
      └─ Gets NO notification (too far)
    
    Device 3 (Amit):
      ├─ Distance: 120 meters ✅
      ├─ Receives VIBRATION
      ├─ Receives PUSH NOTIFICATION
      ├─ Sees IN-APP ALERT
      └─ "I'm close by! Let me help!"

🕐 14:32 - STEP 6: Response
           Raj and Amit both respond
           ├─ Raj: Calls Police
           ├─ Amit: Shares his location with Sarah
           └─ Amit goes to meet Sarah

🕐 14:35 - STEP 7: Resolution
           Sarah feels safe now (Amit is with her)
           └─ Presses SOS button again to DEACTIVATE
           ├─ Active status → false
           ├─ Tracking stops
           └─ Notifications clear from Raj & Amit's phones
```

---

## Database Schema

### **Firestore - sos_alerts collection**
```
Collection: sos_alerts
├─ Document: {auto-id}
│  ├─ userId: "user123"
│  ├─ location: GeoPoint(lat, lng)
│  ├─ emergencyContacts: [...]
│  ├─ active: true
│  ├─ timestamp: 2025-10-25 14:30:00
│  ├─ deactivatedAt: null
│  └─ radiusKm: 0.5
```

### **Realtime Database - live_tracking**
```
live_tracking/
├─ {alertId}/
│  ├─ userId: "user123"
│  ├─ latitude: 12.9716
│  ├─ longitude: 77.5946
│  ├─ timestamp: 1698230400000
│  └─ active: true
```

---

## Key Features Explained

### **1. Real-Time vs Persistent Storage**
- **Firestore (Persistent)**: Stores alert history, can query later
- **Realtime DB (Live)**: Instant updates, used for active tracking

### **2. Radius System**
- Default: **500 meters (0.5 km)**
- Prevents alerts from going to everyone in the city
- Only affects users in immediate vicinity
- Can be configured to different values

### **3. Duplicate Prevention**
```javascript
alertedRef = new Set()
// Stores IDs of alerts already notified

if (alertedRef.has(alert.id)) {
  return;  // Already sent notification, skip
}
alertedRef.add(alert.id);  // Mark as sent
```
- Users won't get the same alert multiple times
- Even if they update location

### **4. Background Listening**
- Hook runs even when user is in another screen
- Continuous GPS location check
- Doesn't drain battery much (efficient Firebase listeners)

---

## Security & Privacy

### **Authentication Required**
- Only logged-in users can create/receive SOS alerts
- User ID stored with alert for accountability

### **Location Privacy**
- GPS coordinates exact but not shared publicly
- Only calculating distances on user's device
- Real-time location only for active alerts

### **Emergency Contacts**
- Sent with alert but only to nearby trusted users
- Not broadcast to entire app

---

## Potential Issues & Solutions

| Issue | Solution |
|-------|----------|
| No GPS signal | Show error, require location permission |
| User too far (>500m) | They won't get notification (by design) |
| Notification not working | Check permissions in phone settings |
| Multiple alerts at same location | Each gets own alert, same radius applies |
| User moves away while alert active | Stop receiving notifications (distance > 500m) |

---

## Summary

**The SOS system creates a neighborhood watch network:**

1. ✋ Someone in danger presses SOS
2. 📍 System captures their GPS location
3. 🔊 Broadcasts to everyone within 500 meters
4. 📳 They get vibration, sound, and notification
5. 🆘 They can call police or offer help
6. 🛑 When safe, SOS person turns it off

**It's like a high-tech emergency whistle that only nearby people hear!**

