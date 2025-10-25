# SafeRoute - Complete Setup Instructions

## 🎯 Step-by-Step Installation Guide

Follow these steps carefully to set up SafeRoute on your development machine.

---

## STEP 1: Install Required Software

### 1.1 Install Node.js
- Download from: https://nodejs.org/
- Choose **LTS version** (v18 or higher)
- Run installer and follow prompts
- Verify installation:
  ```powershell
  node --version
  npm --version
  ```

### 1.2 Install Git
- Download from: https://git-scm.com/
- Run installer with default settings
- Verify:
  ```powershell
  git --version
  ```

### 1.3 Install Expo CLI
```powershell
npm install -g expo-cli
```

Verify:
```powershell
expo --version
```

---

## STEP 2: Navigate to Project & Install Dependencies

```powershell
# Navigate to project
cd "C:\Users\chethan kotian\Desktop\SafeRoute"

# Install all dependencies
npm install
```

**Expected time**: 2-5 minutes (depending on internet speed)

---

## STEP 3: Set Up Firebase

### 3.1 Create Firebase Project
1. Go to: https://console.firebase.google.com/
2. Click **"Add project"**
3. Enter project name: `saferoute`
4. Click **Continue**
5. Disable Google Analytics (optional)
6. Click **"Create project"**
7. Wait for project creation (30 seconds)

### 3.2 Register Web App
1. Click on **Web icon** (</>)
2. App nickname: `SafeRoute`
3. **Do NOT** check "Firebase Hosting"
4. Click **"Register app"**
5. **IMPORTANT**: Copy the Firebase configuration object:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIza...",
     authDomain: "saferoute-xxxx.firebaseapp.com",
     projectId: "saferoute-xxxx",
     storageBucket: "saferoute-xxxx.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abcdef",
     measurementId: "G-XXXXXXXXXX"
   };
   ```
6. Save this somewhere safe (Notepad)
7. Click **"Continue to console"**

### 3.3 Enable Authentication
1. In Firebase Console, click **"Authentication"** in left sidebar
2. Click **"Get started"**
3. Click **"Email/Password"**
4. Toggle **Enable**
5. Click **"Save"**

### 3.4 Create Firestore Database
1. Click **"Firestore Database"** in left sidebar
2. Click **"Create database"**
3. Select **"Start in test mode"**
4. Choose location: **asia-south1** (for India)
5. Click **"Enable"**
6. Wait for creation (30 seconds)

### 3.5 Create Realtime Database
1. Click **"Realtime Database"** in left sidebar
2. Click **"Create Database"**
3. Choose location: **United States** (or closest)
4. Select **"Start in locked mode"**
5. Click **"Enable"**

### 3.6 Enable Storage
1. Click **"Storage"** in left sidebar
2. Click **"Get started"**
3. Click **"Next"** (keep default rules)
4. Choose location: **asia-south1**
5. Click **"Done"**

---

## STEP 4: Set Up Google Cloud Platform

### 4.1 Create Google Cloud Project
1. Go to: https://console.cloud.google.com/
2. Click on project dropdown (top-left)
3. Click **"New Project"**
4. Project name: `SafeRoute`
5. Click **"Create"**
6. Wait for project creation
7. **Select the new project** from dropdown

### 4.2 Enable Billing
⚠️ **REQUIRED** - Most APIs won't work without billing
1. Click **"Billing"** in hamburger menu (top-left)
2. Click **"Link a billing account"**
3. Follow prompts to add credit card
4. **Don't worry**: You get $200 free credit per month
5. Set up budget alerts (recommended):
   - Go to **Billing** → **Budgets & Alerts**
   - Create budget: $10-20/month
   - Set email alerts at 50%, 90%, 100%

### 4.3 Enable Required APIs
1. Go to: **APIs & Services** → **Library**
2. Search and enable each of these:

   #### Enable Maps JavaScript API
   - Search: "Maps JavaScript API"
   - Click on it
   - Click **"Enable"**
   - Wait 30 seconds

   #### Enable Directions API
   - Search: "Directions API"
   - Click **"Enable"**

   #### Enable Places API
   - Search: "Places API"
   - Click **"Enable"**

   #### Enable Geocoding API
   - Search: "Geocoding API"
   - Click **"Enable"**

   #### Enable Street View Static API
   - Search: "Street View Static API"
   - Click **"Enable"**

   #### Enable Cloud Vision API
   - Search: "Cloud Vision API"
   - Click **"Enable"**

### 4.4 Create API Keys
1. Go to: **APIs & Services** → **Credentials**
2. Click **"Create Credentials"** → **"API Key"**
3. API key created! (like: `AIzaSyAbc123...`)
4. **IMMEDIATELY** click **"Restrict Key"**

#### Restrict API Key (IMPORTANT)
1. Name: `SafeRoute-Maps-Key`
2. Application restrictions:
   - Select **"Android apps"**
   - Click **"Add an item"**
   - Package name: `com.saferoute.app`
   - Click **"Done"**
3. API restrictions:
   - Select **"Restrict key"**
   - Check these APIs:
     - Maps JavaScript API
     - Directions API
     - Geocoding API
     - Places API
     - Street View Static API
4. Click **"Save"**
5. **Copy the API key** - save it in Notepad

#### Create Second API Key (for Cloud Vision)
1. Click **"Create Credentials"** → **"API Key"**
2. Click **"Restrict Key"**
3. Name: `SafeRoute-Vision-Key`
4. API restrictions: **Cloud Vision API**
5. Click **"Save"**
6. **Copy this key** too

---

## STEP 5: Configure Environment Variables

### 5.1 Create .env File
```powershell
Copy-Item .env.example .env
```

### 5.2 Open .env in Notepad
```powershell
notepad .env
```

### 5.3 Fill in Your Credentials

Replace the placeholder values with your actual credentials:

```env
# Google Maps API Keys (from Step 4.4)
GOOGLE_MAPS_API_KEY=AIzaSyAbc123...  # Your Maps API key
GOOGLE_PLACES_API_KEY=AIzaSyAbc123...  # Same as above
GOOGLE_CLOUD_VISION_API_KEY=AIzaSyDef456...  # Your Vision API key

# Firebase Configuration (from Step 3.2)
FIREBASE_API_KEY=AIza...
FIREBASE_AUTH_DOMAIN=saferoute-xxxx.firebaseapp.com
FIREBASE_PROJECT_ID=saferoute-xxxx
FIREBASE_STORAGE_BUCKET=saferoute-xxxx.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789
FIREBASE_APP_ID=1:123456789:web:abcdef
FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
FIREBASE_DATABASE_URL=https://saferoute-xxxx.firebaseio.com
```

**Save and close** the file.

---

## STEP 6: Update app.json

Open `app.json` and update Google Maps API keys:

```json
"android": {
  "config": {
    "googleMaps": {
      "apiKey": "YOUR_GOOGLE_MAPS_API_KEY_HERE"
    }
  }
},
"ios": {
  "config": {
    "googleMapsApiKey": "YOUR_GOOGLE_MAPS_API_KEY_HERE"
  }
}
```

Replace `YOUR_GOOGLE_MAPS_API_KEY_HERE` with your actual key from Step 4.4.

---

## STEP 7: Deploy Firebase Security Rules

### 7.1 Install Firebase Tools
```powershell
npm install -g firebase-tools
```

### 7.2 Login to Firebase
```powershell
firebase login
```
- Browser will open
- Select your Google account
- Click **"Allow"**

### 7.3 Initialize Firebase
```powershell
firebase init
```

When prompted:
- **Which Firebase features?**: Select:
  - ◉ Firestore
  - ◉ Realtime Database
  - ◉ Storage
  - (Use Space to select, Enter to confirm)
- **Use existing project**: Yes
- **Select project**: saferoute (your project)
- **Firestore rules**: Press Enter (use default: `firestore.rules`)
- **Firestore indexes**: Press Enter (use default: `firestore.indexes.json`)
- **Database rules**: Press Enter (use default: `database.rules.json`)
- **Storage rules**: Press Enter (use default: `storage.rules`)

### 7.4 Deploy Rules
```powershell
firebase deploy --only firestore:rules,database,storage
```

✅ **Success!** Rules are now deployed.

---

## STEP 8: Run the App!

### 8.1 Start Development Server
```powershell
npm start
```

You should see:
```
› Metro waiting on exp://192.168.x.x:19000
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)
```

### 8.2 Install Expo Go on Your Phone
- **Android**: Play Store → Search "Expo Go" → Install
- **iOS**: App Store → Search "Expo Go" → Install

### 8.3 Run on Your Phone
- **Android**: Open Expo Go → Tap "Scan QR Code" → Scan the QR code in terminal
- **iOS**: Open Camera app → Point at QR code → Tap notification

**App will load on your phone in 30-60 seconds!** 🎉

---

## STEP 9: Verify Everything Works

### 9.1 Test Location Permission
- App should ask for location permission
- Grant permission

### 9.2 Test Authentication (when implemented)
- Try to sign up with email/password
- Should create account in Firebase

### 9.3 Check Firebase Console
- Go to Firebase Console → Authentication
- You should see your test user

---

## 🎉 Success! You're Ready to Develop

Your development environment is now fully set up. You can:
- Edit code in `src/` folder
- Changes will hot-reload on your phone
- Check console in terminal for logs

---

## 🚨 Troubleshooting

### "npm install" fails
```powershell
# Clear cache and retry
npm cache clean --force
Remove-Item -Recurse -Force node_modules
npm install
```

### "Google Maps not loading"
- Verify billing is enabled in Google Cloud
- Check API key in `.env` matches key in Google Cloud Console
- Verify Maps JavaScript API is enabled

### "Firebase authentication failed"
- Double-check all Firebase config values in `.env`
- Make sure you copied them exactly (no extra spaces)
- Verify Email/Password is enabled in Firebase Console

### "Expo Go won't connect"
- Make sure phone and computer are on same Wi-Fi
- Try running: `expo start --tunnel`
- Restart the Expo server (Ctrl+C then `npm start`)

### "Metro bundler error"
```powershell
# Clear Metro cache
npx react-native start --reset-cache
```

---

## 📞 Need More Help?

1. Check `README.md` for detailed documentation
2. Review `ROADMAP.md` for next steps
3. See `QUICKSTART.md` for common commands
4. Create an issue if stuck

**Happy Coding! 🚀**
