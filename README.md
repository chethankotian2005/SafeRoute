# SafeRoute - AI-Powered Community Safety Navigation App

SafeRoute is a React Native mobile application designed to prioritize safety over speed in navigation. Built specifically for vulnerable populations (women, elderly, disabled users) in India, it uses Google Maps API, AI vision analysis, and community-driven data to provide the safest routes, not just the fastest ones.

## 🌟 Core Features

- **Safety-Scored Routing**: Routes rated 1-10 based on lighting, foot traffic, time of day, and community data
- **Real-Time Community Reporting**: Users can report and view safety concerns in real-time
- **Time-Aware Routing**: Same route scored differently for day vs. night travel
- **Accessibility Mode**: Special routing for wheelchair users with ramp access and flat terrain
- **One-Tap SOS**: Emergency alert with live location sharing to trusted contacts
- **Safe Spot Mapping**: Hospitals, police stations, pharmacies, and 24/7 stores highlighted
- **Multi-Language Support**: English, Hindi, Tamil, Telugu, and more

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Firebase Setup](#firebase-setup)
- [Google Cloud Setup](#google-cloud-setup)
- [Environment Configuration](#environment-configuration)
- [Running the App](#running-the-app)
- [Project Structure](#project-structure)
- [Safety Scoring Algorithm](#safety-scoring-algorithm)
- [Development Workflow](#development-workflow)
- [Troubleshooting](#troubleshooting)

## 🔧 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher): [Download](https://nodejs.org/)
- **npm** or **yarn**: Comes with Node.js
- **Expo CLI**: `npm install -g expo-cli`
- **Git**: [Download](https://git-scm.com/)
- **Android Studio** (for Android development)
- **Xcode** (for iOS development, macOS only)

### Required Accounts

- Google Cloud Platform account (for Maps, Places, Cloud Vision APIs)
- Firebase account (for authentication, database, storage)
- Expo account (for deployment and OTA updates)

## 📥 Installation

### 1. Clone or Navigate to the Repository

```bash
cd "C:\Users\chethan kotian\Desktop\SafeRoute"
```

### 2. Install Dependencies

```bash
npm install
```

Or if using yarn:

```bash
yarn install
```

## 🔥 Firebase Setup

### Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **Add Project**
3. Enter project name: `saferoute` (or your preferred name)
4. Disable Google Analytics (optional for development)
5. Click **Create Project**

### Step 2: Register Your App

1. In Firebase Console, click on **Web icon** (</>) to add a web app
2. Register app with nickname: `SafeRoute`
3. Copy the Firebase configuration object (you'll need this later)

### Step 3: Enable Authentication

1. Go to **Authentication** → **Sign-in method**
2. Enable the following providers:
   - **Email/Password**
   - **Phone** (for OTP-based login)
   - **Google** (optional)

### Step 4: Create Firestore Database

1. Go to **Firestore Database** → **Create database**
2. Start in **test mode** (we'll deploy security rules later)
3. Choose a location close to your users (e.g., `asia-south1` for India)

### Step 5: Create Realtime Database

1. Go to **Realtime Database** → **Create database**
2. Start in **locked mode**
3. Same location as Firestore

### Step 6: Set Up Storage

1. Go to **Storage** → **Get started**
2. Start in **test mode**
3. Same location

### Step 7: Deploy Security Rules

From your project directory:

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project
firebase init

# Select:
# - Firestore
# - Realtime Database
# - Storage
# - Functions (if you want to use Cloud Functions)

# Deploy security rules
firebase deploy --only firestore:rules
firebase deploy --only database
firebase deploy --only storage
```

## 🗺️ Google Cloud Setup

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project: `SafeRoute`
3. Note your **Project ID**

### Step 2: Enable Required APIs

In the Google Cloud Console, enable the following APIs:

1. **Maps JavaScript API**
2. **Directions API**
3. **Places API**
4. **Geocoding API**
5. **Street View Static API**
6. **Cloud Vision API**

To enable APIs:
- Go to **APIs & Services** → **Library**
- Search for each API and click **Enable**

### Step 3: Create API Keys

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **API Key**
3. Create **three separate API keys**:
   - **Google Maps API Key** (for general maps usage)
   - **Google Places API Key** (for places searches)
   - **Google Cloud Vision API Key** (for image analysis)

### Step 4: Restrict API Keys (IMPORTANT for Security)

For **Google Maps API Key**:
- Application restrictions: **Android apps** and **iOS apps**
- Add your app's package name/bundle identifier
- API restrictions: Restrict to **Maps JavaScript API, Directions API, Geocoding API, Street View Static API**

For **Google Cloud Vision API Key**:
- Application restrictions: **Android apps** and **iOS apps**
- API restrictions: Restrict to **Cloud Vision API**

### Step 5: Enable Billing

⚠️ **Important**: Most Google Maps APIs require billing to be enabled
- Set up a billing account
- Set budget alerts to avoid unexpected charges
- Take advantage of the $200 monthly free credit

## 🔐 Environment Configuration

### Step 1: Copy Environment Template

```bash
cp .env.example .env
```

### Step 2: Fill in Your Credentials

Open `.env` and add your credentials:

```env
# Google Maps & Places API
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
GOOGLE_PLACES_API_KEY=your_google_places_api_key_here
GOOGLE_CLOUD_VISION_API_KEY=your_cloud_vision_api_key_here

# Firebase Configuration
FIREBASE_API_KEY=your_firebase_api_key_here
FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
FIREBASE_APP_ID=your_firebase_app_id
FIREBASE_MEASUREMENT_ID=your_measurement_id
FIREBASE_DATABASE_URL=https://your_project_id.firebaseio.com
```

### Step 3: Update app.json

1. Open `app.json`
2. Replace placeholder Google Maps API keys:
   - For iOS: `config.googleMapsApiKey`
   - For Android: `config.googleMaps.apiKey`

```json
"ios": {
  "config": {
    "googleMapsApiKey": "YOUR_IOS_GOOGLE_MAPS_API_KEY"
  }
},
"android": {
  "config": {
    "googleMaps": {
      "apiKey": "YOUR_ANDROID_GOOGLE_MAPS_API_KEY"
    }
  }
}
```

## 🚀 Running the App

### Start Expo Development Server

```bash
npm start
```

Or:

```bash
expo start
```

### Run on Android

```bash
npm run android
```

Or press `a` in the Expo CLI

### Run on iOS (macOS only)

```bash
npm run ios
```

Or press `i` in the Expo CLI

### Run on Web (for testing only)

```bash
npm run web
```

Or press `w` in the Expo CLI

### Using Expo Go App

1. Install **Expo Go** on your phone from Play Store/App Store
2. Scan the QR code shown in your terminal
3. App will load on your device

## 📁 Project Structure

```
SafeRoute/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── MapView.jsx
│   │   ├── RouteCard.jsx
│   │   ├── SafetyScore.jsx
│   │   ├── SOSButton.jsx
│   │   └── CommunityAlert.jsx
│   ├── screens/             # Main app screens
│   │   ├── HomeScreen.jsx
│   │   ├── MapScreen.jsx
│   │   ├── CommunityScreen.jsx
│   │   ├── ProfileScreen.jsx
│   │   └── SOSScreen.jsx
│   ├── navigation/          # Navigation configuration
│   │   └── AppNavigator.jsx
│   ├── services/            # API and business logic
│   │   ├── googleMapsService.js
│   │   ├── safetyScoring.js
│   │   ├── firebaseService.js
│   │   └── locationService.js
│   ├── hooks/               # Custom React hooks
│   │   ├── useLocation.js
│   │   ├── useSafetyData.js
│   │   └── useCommunityAlerts.js
│   ├── utils/               # Helper functions
│   │   ├── validators.js
│   │   ├── constants.js
│   │   ├── permissions.js
│   │   └── helpers.js
│   ├── config/              # Configuration files
│   │   └── firebaseConfig.js
│   └── assets/              # Images, fonts, etc.
├── functions/               # Firebase Cloud Functions
├── App.js                   # Main entry point
├── app.json                 # Expo configuration
├── package.json             # Dependencies
├── firebase.json            # Firebase configuration
└── .env                     # Environment variables (DO NOT COMMIT)
```

## 🧮 Safety Scoring Algorithm

Routes are scored from **1-10** based on:

### Factors (100% total weight)

1. **Street Lighting** (30%): Analyzed using Google Cloud Vision API on Street View images
2. **Foot Traffic Density** (25%): Based on Google Places popular times data
3. **Time of Day** (20%): Day travel (+2 bonus), night travel (-2 penalty)
4. **Safe Spot Proximity** (15%): Distance to hospitals, police stations within 500m
5. **Community Reports** (10%): Recent incident reports near the route

### Score Ranges

- **8-10**: Excellent (Green) - Highly recommended
- **6-7**: Good (Yellow) - Generally safe
- **4-5**: Moderate (Orange) - Use caution
- **1-3**: Poor (Red) - Consider alternative route

## 🛠️ Development Workflow

### 1. Start Development Server

```bash
npm start
```

### 2. Make Changes

Edit files in the `src/` directory. Changes will hot-reload automatically.

### 3. Test on Device

Use Expo Go app or simulator/emulator

### 4. Debug

- Use **React Native Debugger**
- Check console logs in terminal
- Use Expo DevTools (press `d` in terminal)

### 5. Build for Production

```bash
# For Android
eas build --platform android

# For iOS
eas build --platform ios
```

## 🐛 Troubleshooting

### Issue: "Module not found" errors

**Solution:**
```bash
rm -rf node_modules
npm install
```

### Issue: "Google Maps not showing"

**Solution:**
- Verify API key in `.env` and `app.json`
- Check if Maps JavaScript API is enabled
- Ensure billing is enabled on Google Cloud

### Issue: "Firebase authentication failed"

**Solution:**
- Verify Firebase config in `.env`
- Check if authentication providers are enabled in Firebase Console
- Clear app cache and restart

### Issue: "Location permission denied"

**Solution:**
- Check `app.json` for permission strings
- On Android: Enable location in device settings
- On iOS: Check Info.plist for location usage descriptions

### Issue: Expo build fails

**Solution:**
```bash
expo doctor
npm install --legacy-peer-deps
```

## 📱 Testing Checklist

- [ ] User can sign up and login
- [ ] Location permission is requested
- [ ] Map displays user's current location
- [ ] Routes are fetched and displayed
- [ ] Safety scores are calculated
- [ ] Community reports can be submitted
- [ ] SOS button activates emergency flow
- [ ] Navigation works between screens

## 🔒 Security Checklist

- [ ] `.env` file is in `.gitignore`
- [ ] API keys are restricted in Google Cloud Console
- [ ] Firebase security rules are deployed
- [ ] User input is sanitized
- [ ] HTTPS is used for all API calls

## 📞 Support & Contact

For issues or questions:
- Create an issue in the repository
- Contact: [Your Contact Info]

## 📄 License

MIT License - See LICENSE file for details

---

**Built with ❤️ for safer communities**
