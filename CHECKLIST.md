# SafeRoute Setup Checklist

Use this checklist to track your progress setting up SafeRoute.

## ✅ Phase 1: Installation (COMPLETED)
- [x] Navigate to project folder
- [x] Run `npm install`
- [x] Verify installation successful

---

## 📋 Phase 2: Environment Setup (TODO)

### Firebase Setup
- [ ] Go to https://console.firebase.google.com/
- [ ] Create new project "saferoute"
- [ ] Enable Email/Password authentication
- [ ] Create Firestore Database (test mode, asia-south1)
- [ ] Create Realtime Database (locked mode)
- [ ] Enable Cloud Storage (test mode)
- [ ] Copy Firebase config values
- [ ] Add Firebase config to `.env` file

### Google Cloud Setup
- [ ] Go to https://console.cloud.google.com/
- [ ] Create new project "SafeRoute"
- [ ] Enable billing (required!)
- [ ] Enable Maps JavaScript API
- [ ] Enable Directions API
- [ ] Enable Places API
- [ ] Enable Geocoding API
- [ ] Enable Street View Static API
- [ ] Enable Cloud Vision API
- [ ] Create API key for Maps
- [ ] Create API key for Cloud Vision
- [ ] Restrict API keys (security!)
- [ ] Add API keys to `.env` file

### Local Configuration
- [ ] Copy `.env.example` to `.env`
- [ ] Fill in all Firebase values in `.env`
- [ ] Fill in all Google API keys in `.env`
- [ ] Update `app.json` with Google Maps API key (2 places)

---

## 🔐 Phase 3: Security & Rules (TODO)

### Firebase Security
- [ ] Install Firebase CLI: `npm install -g firebase-tools`
- [ ] Login to Firebase: `firebase login`
- [ ] Initialize Firebase: `firebase init`
- [ ] Select: Firestore, Realtime Database, Storage
- [ ] Deploy rules: `firebase deploy --only firestore:rules,database,storage`

---

## 🚀 Phase 4: First Run (TODO)

### Run the App
- [ ] Start server: `npm start`
- [ ] Install Expo Go on phone (Play Store/App Store)
- [ ] Scan QR code with Expo Go
- [ ] App loads successfully
- [ ] Home screen displays
- [ ] Navigation works between screens

### Test Permissions
- [ ] Location permission requested
- [ ] Location permission granted
- [ ] Notification permission requested

---

## 🧪 Phase 5: Feature Testing (TODO)

### Basic Features
- [ ] Map screen displays
- [ ] Current location shows on map
- [ ] Can search for destination
- [ ] Routes are calculated
- [ ] Safety scores display

### Authentication (when implemented)
- [ ] Can create account
- [ ] Can login
- [ ] Can logout
- [ ] User session persists

### Community Features (when implemented)
- [ ] Can view community reports
- [ ] Can submit report
- [ ] Can upvote report

---

## 📝 Notes & Issues

### Issues Encountered:


### Solutions Applied:


### API Keys Obtained:
- Firebase API Key: _______________
- Google Maps API Key: _______________
- Cloud Vision API Key: _______________

---

## ⏱️ Time Tracking

| Phase | Estimated | Actual | Status |
|-------|-----------|--------|--------|
| Installation | 5 min | _____ | ✅ Done |
| Firebase Setup | 15 min | _____ | ⏳ Pending |
| Google Cloud Setup | 15 min | _____ | ⏳ Pending |
| Configuration | 5 min | _____ | ⏳ Pending |
| Security Rules | 5 min | _____ | ⏳ Pending |
| First Run | 5 min | _____ | ⏳ Pending |
| **Total** | **50 min** | **_____** | |

---

## 🎯 Current Status

**Last Updated:** October 22, 2025  
**Current Phase:** Phase 2 - Environment Setup  
**Blocking Issues:** None  
**Next Step:** Create Firebase project (see SETUP.md)

---

## 💡 Quick Reference

### Important Commands
```powershell
npm start              # Start development server
npm start --clear      # Start with cache cleared
npm run android        # Run on Android
firebase login         # Login to Firebase
firebase deploy        # Deploy rules
```

### Important Files
- `.env` - Your API keys (must create this!)
- `app.json` - Expo configuration
- `SETUP.md` - Detailed setup guide
- `INSTALL_SUCCESS.md` - What to do next

### Important Links
- Firebase Console: https://console.firebase.google.com/
- Google Cloud Console: https://console.cloud.google.com/
- Expo Documentation: https://docs.expo.dev/

---

**Keep this file updated as you progress through setup!**
