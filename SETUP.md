# Quick Setup Guide

Get SafeRoute running on your machine in under 10 minutes.

## Prerequisites

Make sure you have:
- Node.js 16 or higher
- npm or yarn
- Git
- Expo CLI (`npm install -g expo-cli`)

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/chethankotian2005/SafeRoute.git
cd SafeRoute
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required packages including React Native, Expo, Firebase, and Google Maps dependencies.

### 3. Set Up Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Then edit `.env` and add your API keys:

```
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id
GOOGLE_MAPS_API_KEY=your_google_maps_key
GOOGLE_CLOUD_VISION_API_KEY=your_vision_key
```

### 4. Configure Firebase

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Authentication (Email/Password)
3. Create a Firestore database
4. Enable Storage
5. Copy your config to `.env`

### 5. Configure Google Cloud

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Enable these APIs:
   - Maps JavaScript API
   - Places API
   - Directions API
   - Geocoding API
   - Cloud Vision API
3. Create an API key
4. Add it to `.env`

## Running the App

### Development Mode

```bash
npx expo start
```

Then:
- Press `a` for Android emulator
- Press `i` for iOS simulator
- Scan QR code with Expo Go app on physical device

### Building APK

```bash
# Production build
eas build --platform android --profile production

# Preview build (for testing)
eas build --platform android --profile preview
```

## Common Issues

**"Cannot find module 'expo'"**
- Run `npm install` again

**"Invalid API key"**
- Check your `.env` file has correct keys
- Make sure APIs are enabled in Google Cloud

**"Firebase not initialized"**
- Verify all Firebase config values in `.env`
- Check Firebase project settings

**Metro bundler errors**
- Try `npx expo start --clear`

## Project Structure

```
SafeRoute/
├── src/
│   ├── screens/         # Main app screens
│   ├── components/      # Reusable UI components
│   ├── services/        # API and business logic
│   ├── navigation/      # App navigation setup
│   └── utils/          # Helper functions
├── .env                # Your API keys (don't commit!)
├── app.json           # Expo configuration
└── package.json       # Dependencies
```

## Next Steps

1. Read the main README for feature details
2. Check CONTRIBUTING.md if you want to help
3. Try building your first feature
4. Join discussions in Issues

Need help? Open an issue on GitHub!
