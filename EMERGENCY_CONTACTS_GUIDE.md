# Emergency Contacts System - Complete Guide

## Overview
The Emergency Contacts system allows users to add, manage, and quickly contact trusted people during emergencies. When activated, these contacts receive emergency alerts via SMS and can be called directly from the app.

---

## Features

### ✅ **Add Multiple Contacts**
- Store unlimited emergency contacts
- Each contact has a name and phone number
- Persistent storage in Firebase (survives app restarts)

### 📞 **Quick Call**
- One-tap calling to any contact
- Uses native dialer
- Confirmation dialog before calling

### 🚨 **Emergency Alerts**
- Send SMS alerts to contacts saying: *"EMERGENCY ALERT! One person from your contact list needs immediate help..."*
- Pre-filled SMS message
- Links to SafeRoute app location

### 🗑️ **Delete Contacts**
- Remove contacts you no longer need
- Confirmation dialog before deletion

### 🔄 **Integration with SOS**
- Saved contacts appear in SOS screen alongside default emergency services
- When SOS is activated, all contacts are notified
- Default services (Police, Ambulance, Fire, etc.) always available

---

## How to Use

### **1. Adding an Emergency Contact**

**Location:** Profile → Emergency Contacts → Add (+) Button

```
1. Tap on Profile tab
2. Scroll to "Emergency Contacts" in Safety section
3. Tap the contact
4. Tap the "+" button in top right
5. Enter contact name (e.g., "Mom", "Brother")
6. Enter phone number (e.g., +1-555-123-4567)
7. Tap "Add Contact"
```

**Result:** Contact is saved and appears in the list

---

### **2. Calling a Contact**

**Location:** Emergency Contacts Screen

```
1. Find the contact in the list
2. Tap the GREEN phone icon (📞)
3. Confirm the phone number
4. Tap "Call"
5. Native dialer opens with number pre-filled
6. Call is made
```

---

### **3. Sending Emergency Alert**

**Location:** Emergency Contacts Screen

```
1. Find the contact in the list
2. Tap the RED warning icon (⚠️)
3. Confirm you want to send alert
4. Tap "Send SMS Alert"
5. SMS composer opens with pre-filled emergency message
6. Send the SMS
```

**Message Example:**
```
EMERGENCY ALERT! One person from your contact list 
needs immediate help. Their location: [SafeRoute App] 
Please respond or call emergency services if needed.
```

---

### **4. Deleting a Contact**

**Location:** Emergency Contacts Screen

```
1. Find the contact in the list
2. Tap the RED trash icon (🗑️)
3. Confirm deletion
4. Contact is removed
```

---

### **5. Using Contacts in SOS**

**Location:** Emergency SOS Screen (accessed from home)

```
When SOS is activated:
1. Your location is sent to all saved contacts
2. Default emergency services are also notified
3. Nearby app users get alerts
4. You can call any contact directly from SOS screen
```

---

## Database Structure

### **Firestore Schema**

```
users/
└── {userId}/
    └── emergency_contacts/
        └── {contactId}/
            ├── name: "Mom"
            ├── number: "+1-555-123-4567"
            ├── createdAt: Timestamp
            └── updatedAt: Timestamp
```

**Example:**
```
users/abc123def/emergency_contacts/contact1/
{
  "name": "Mother",
  "number": "+91-98765-43210",
  "createdAt": "2025-10-25T14:30:00Z",
  "updatedAt": "2025-10-25T14:30:00Z"
}
```

---

## File Structure

```
src/
├── screens/
│   ├── EmergencyContactsScreen.jsx      ← Main UI for managing contacts
│   ├── ProfileScreen.jsx                ← Updated with link
│   └── SOSScreen.jsx                    ← Updated to use saved contacts
│
├── services/
│   └── firebaseService.js               ← CRUD operations
│       ├── getEmergencyContacts()
│       ├── addEmergencyContact()
│       ├── deleteEmergencyContact()
│       └── updateEmergencyContact()
│
└── navigation/
    └── AppNavigator.jsx                 ← Added EmergencyContacts route
```

---

## API Reference

### **Get All Emergency Contacts**
```javascript
import { getEmergencyContacts } from '../services/firebaseService';

const contacts = await getEmergencyContacts(userId);
// Returns: Array of contact objects
// [{ id: '...', name: 'Mom', number: '+1-555...' }, ...]
```

### **Add Emergency Contact**
```javascript
import { addEmergencyContact } from '../services/firebaseService';

await addEmergencyContact(userId, {
  name: 'Brother',
  number: '+1-555-987-6543'
});
// Returns: Contact ID
```

### **Delete Emergency Contact**
```javascript
import { deleteEmergencyContact } from '../services/firebaseService';

await deleteEmergencyContact(userId, contactId);
// Removes contact from database
```

### **Update Emergency Contact**
```javascript
import { updateEmergencyContact } from '../services/firebaseService';

await updateEmergencyContact(userId, contactId, {
  name: 'Updated Name',
  number: '+1-555-999-8888'
});
```

---

## UI Features

### **Emergency Contacts Screen**

```
╔════════════════════════════════════════╗
║  ← Emergency Contacts          +      ║  ← Header with add button
╠════════════════════════════════════════╣
║                                        ║
║  👤 Mom                                ║
║  📱 +1-555-123-4567                    ║
║  ┌──────┬──────┬──────┐               ║
║  │ 📞   │ ⚠️   │ 🗑️   │  (Action btns)║
║  └──────┴──────┴──────┘               ║
║                                        ║
║  👤 Brother                            ║
║  📱 +1-555-987-6543                    ║
║  ┌──────┬──────┬──────┐               ║
║  │ 📞   │ ⚠️   │ 🗑️   │               ║
║  └──────┴──────┴──────┘               ║
║                                        ║
╠════════════════════════════════════════╣
║ Empty state if no contacts:            ║
║                                        ║
║         📢 No emergency contacts yet    ║
║         Add contacts who will be       ║
║         notified in case of emergency  ║
╚════════════════════════════════════════╝
```

### **Add Contact Modal**

```
╔════════════════════════════════════════╗
║  ✕  Add Emergency Contact         → ║
╠════════════════════════════════════════╣
║                                        ║
║  Contact Name *                        ║
║  ┌────────────────────────────────┐  ║
║  │ 👤 e.g., Mom, Brother, Friend │  ║
║  └────────────────────────────────┘  ║
║                                        ║
║  Phone Number *                        ║
║  ┌────────────────────────────────┐  ║
║  │ 📞 e.g., +1-555-123-4567       │  ║
║  └────────────────────────────────┘  ║
║                                        ║
║  ℹ️ These contacts will receive       ║
║     emergency alerts when you          ║
║     activate SOS...                    ║
║                                        ║
╠════════════════════════════════════════╣
║  [Cancel]          [+ Add Contact]    ║
╚════════════════════════════════════════╝
```

---

## Integration Flow

### **Step 1: User navigates to Emergency Contacts**
```
Profile Screen
    ↓
Safety Section
    ↓
"Emergency Contacts" Menu Item
    ↓
EmergencyContactsScreen
```

### **Step 2: User adds a contact**
```
EmergencyContactsScreen
    ↓ (tap + button)
Add Contact Modal
    ↓ (enter name & number)
Add Contact Button
    ↓ (validate input)
Firebase: addEmergencyContact()
    ↓ (store in Firestore)
Contact added & list refreshes
```

### **Step 3: SOS activation includes contacts**
```
User presses SOS
    ↓
SOSScreen loads contacts
    ↓ (firebaseService.getEmergencyContacts)
Display default services + saved contacts
    ↓
User can call or text any contact
```

---

## Error Handling

### **Validation**
- ✅ Contact name required
- ✅ Phone number required
- ✅ Valid phone format (shown as placeholder)

### **Network Errors**
- Shows alert on failure
- User can retry
- Graceful fallback

### **Firebase Errors**
- Logged to console
- User-friendly error messages
- Auto-retry capability

---

## Security & Privacy

### **Authentication**
- Only authenticated users can manage contacts
- Each user's contacts are in their own subcollection
- Firebase rules enforce user ownership

### **Storage**
- Contacts stored in Firestore (cloud database)
- Not synced to device storage
- Encrypted in transit

### **SMS Alerts**
- Pre-filled message sent via SMS
- User can edit before sending
- Privacy: Numbers not shared with other users

---

## Common Scenarios

### **Scenario 1: Quick Emergency**
```
1. User feels unsafe
2. Goes to SOS screen (from home)
3. Sees both saved contacts + default services
4. Can tap to call Mom (saved contact)
5. Police (default service)
```

### **Scenario 2: Setup Before Travel**
```
1. User opens Profile
2. Taps Emergency Contacts
3. Adds 3 contacts:
   - Mom
   - Sister
   - Best Friend
4. Now these will be notified if SOS activated
```

### **Scenario 3: Update Contact Info**
```
1. Go to Emergency Contacts
2. Delete old contact
3. Add new contact with updated number
(Note: Direct update feature can be added later)
```

---

## Future Enhancements

- [ ] Edit existing contacts inline
- [ ] Contact groups (Family, Friends, etc.)
- [ ] WhatsApp/Telegram integration
- [ ] Voice call integration with app
- [ ] Contact import from phone
- [ ] Favorite/priority contacts
- [ ] Location sharing with emergency contacts
- [ ] Real-time alert delivery tracking

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Contact not saving | Check internet, Firebase permissions |
| Can't send SMS | Check SMS app, carrier support |
| Call not working | Check phone permissions, carrier |
| Contacts not loading | Refresh app, check authentication |
| Duplicate contacts | Delete old, add new (feature coming) |

---

## Quick Reference

### **Action Buttons in Contact List**
| Icon | Action | Color |
|------|--------|-------|
| 📞 | Call contact | Green |
| ⚠️ | Send SMS alert | Red |
| 🗑️ | Delete contact | Gray |

### **Colors Used**
- Green: `#10B981` - Call action (safe)
- Red: `#EF4444` - Alert/Emergency (urgent)
- Gray: Secondary color - Delete (neutral)

### **Key Screens**
- `EmergencyContactsScreen` - Main management UI
- `ProfileScreen` - Entry point from profile
- `SOSScreen` - Integration point for SOS

---

**Version:** 1.0.0  
**Last Updated:** October 25, 2025  
**Status:** Production Ready ✅
