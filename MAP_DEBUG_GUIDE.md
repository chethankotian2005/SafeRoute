# 🗺️ Map Loading Debug Guide

## Current Status
✅ Loading screen shows properly with emoji  
❌ Map stuck on "Initializing Google Maps..."  
✅ All required APIs are enabled in Google Cloud Console

## 🔍 Likely Issue: API Key Restrictions

Even though the APIs are enabled, the API key might have **restrictions** that prevent it from working in your app.

### Check API Key Restrictions:

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Select your project

2. **Navigate to API Credentials**
   - Click "APIs & Services" → "Credentials"
   - Find your API key (the one starting with `AIzaSyASpr...`)

3. **Click on the API Key** to view/edit restrictions

4. **Check "Application restrictions" section:**

   **CURRENT ISSUE:** If it says:
   - ❌ "HTTP referrers (web sites)" - This WON'T work for mobile apps
   - ❌ "IP addresses" - This WON'T work for mobile apps
   
   **SOLUTION:** Should be set to:
   - ✅ **"None"** (for testing) OR
   - ✅ **"Android apps"** (for production) with your app's package name and SHA-1

5. **Check "API restrictions" section:**
   
   Should have:
   - ✅ Maps JavaScript API
   - ✅ Places API
   - ✅ Directions API
   - ✅ Geocoding API

## 🛠️ Quick Fix (For Testing)

### Option 1: Remove All Restrictions (TESTING ONLY)

1. Open your API key in Google Cloud Console
2. Under "Application restrictions":
   - Select **"None"**
3. Under "API restrictions":
   - Select **"Don't restrict key"**
4. Click **"Save"**
5. Wait 1-2 minutes for changes to propagate
6. **Restart your app**

### Option 2: Create a New Unrestricted Key

1. Go to "APIs & Services" → "Credentials"
2. Click **"+ CREATE CREDENTIALS"** → "API key"
3. Copy the new API key
4. Don't add any restrictions
5. Update your `.env` file with the new key:
   ```
   GOOGLE_MAPS_API_KEY=YOUR_NEW_KEY_HERE
   ```
6. Restart Metro bundler: `npx expo start -c`

## 🧪 Test the API Key Directly

Open this URL in your browser (replace with your actual key):

```
https://maps.googleapis.com/maps/api/js?key=AIzaSyASprxP5RkR-UaRrK1_xTsZeda7zgKrAkM&libraries=places
```

**Expected Results:**

✅ **If working:** You'll see JavaScript code (the Maps API library)

❌ **If NOT working:** You'll see an error like:
- "This API key is not authorized to use this service or API"
- "RefererNotAllowedMapError"
- "ApiNotActivatedMapError"

## 📱 Alternative: Check WebView Console

To see the actual error from Google Maps:

1. **Enable Remote Debugging:**
   - If using Android: Open Chrome and go to `chrome://inspect`
   - If using iOS Simulator: Open Safari → Develop → Simulator
   
2. **Inspect the WebView** to see console errors

3. **Look for Google Maps errors** like:
   - "Google Maps JavaScript API error: RefererNotAllowedMapError"
   - "Google Maps JavaScript API error: ApiNotActivatedMapError"
   - "InvalidKeyMapError"

## 🔧 Other Potential Issues

### Issue 1: Billing Not Enabled
**Symptom:** Map loads but shows "For development purposes only" watermark

**Solution:**
1. Go to Google Cloud Console → Billing
2. Make sure billing is enabled for your project
3. Google gives $200 free credit per month

### Issue 2: Internet Connection
**Test:** Open a browser on your device and visit google.com

### Issue 3: WebView Issues
**Solution:** Clear cache and restart:
```bash
npx expo start -c
```

## 📊 Check Console Output

In your Metro bundler terminal, look for these messages:

**Good signs:**
```
LOG  MapScreen loaded, API Key present: Yes
LOG  WebView Console: Map script starting...
LOG  WebView Console: Google Maps API loaded successfully
LOG  WebView Console: Map initialization complete
```

**Bad signs:**
```
ERROR  WebView Console: Failed to load Google Maps script
ERROR  WebView Console: Google Maps API failed to load
ERROR  Map initialization error: ...
```

## ⚡ Quick Action Items

1. ✅ Go to Google Cloud Console
2. ✅ Find your API key
3. ✅ Check restrictions (should be "None" for testing)
4. ✅ Test the API key URL in browser
5. ✅ Wait 1-2 minutes after saving changes
6. ✅ Restart app with `npx expo start -c`

## 🎯 Most Likely Solution

Based on your symptoms, **99% chance** the issue is:

**API Key has HTTP referrer restrictions** which don't work for React Native WebView.

**Fix:** Set application restrictions to **"None"** in Google Cloud Console.
