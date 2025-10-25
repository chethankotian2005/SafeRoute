# Voice Assistant for Expo - Setup Guide 🎙️

## ⚠️ Important: Expo Limitations

The voice libraries (`@react-native-voice/voice` and `react-native-tts`) **DO NOT work with Expo Go**. 

You have **2 options**:

---

## 🎯 Option 1: Use Development Build (RECOMMENDED)

This gives you full voice recognition capabilities.

### Steps:

1. **Create a development build:**
```bash
npx expo prebuild --clean
npx expo run:android
```

2. **Install on your physical device** (voice doesn't work on emulators)

3. **Test the voice assistant**:
   - Tap microphone icon on Home screen
   - Grant permission (new permission dialog will show)
   - Say "Hey SafeRoute"
   - Say commands like "I feel unsafe"

### ✅ What Works with Dev Build:
- ✅ Full voice recognition with @react-native-voice/voice
- ✅ Text-to-speech responses
- ✅ Wake word detection
- ✅ All voice commands
- ✅ Continuous listening

---

## 🔄 Option 2: Use Current Expo Go (Limited Features)

I've added fallbacks so the app works with Expo Go, but with limited voice features.

### What I Fixed:
- ✅ TTS error fixed - now uses Expo Speech as fallback
- ✅ Permission request uses Expo's permission system
- ✅ Alerts shown when voice recognition not available

### Steps:

1. **Reload your app:**
```bash
npm start
```
Then scan QR code with Expo Go

2. **Test with manual commands:**
   - Tap "View Voice Commands" on Home screen
   - Use "Test" buttons to execute commands manually
   - Voice feedback will work via Expo Speech

### ⚠️ Limitations with Expo Go:
- ❌ Voice recognition NOT available (wake words won't work)
- ❌ Microphone listening NOT available
- ✅ Manual command execution works
- ✅ Text-to-speech works (via Expo Speech)
- ✅ All app features accessible via buttons

---

## 🚀 What I Changed

### 1. Fixed TTS Error
- Added Expo Speech as primary TTS engine
- Falls back to react-native-tts for dev builds
- Shows alerts if both unavailable

### 2. Fixed Permission Request
- Uses Expo's permission system (`expo-permissions`)
- Shows proper permission dialog
- Better error messages

### 3. Installed Expo Speech
- Runs: `npm install expo-speech`
- Works with Expo Go out of the box
- Provides voice responses

---

## 📱 Testing Now (Expo Go)

### Quick Test:

1. **Reload app** (should already be running)
2. **Go to Home screen**
3. **Tap microphone icon** - you'll see permission dialog
4. **Grant permission** - tap "OK"
5. **Tap "View Voice Commands"** button
6. **Test commands manually** - use Test buttons

### What You'll See:
- Permission dialog appears properly ✅
- No TTS error anymore ✅
- Manual commands work ✅
- Voice responses via Expo Speech ✅
- Wake words won't work (need dev build) ❌

---

## 🎯 Recommended Path Forward

### For Quick Testing (Right Now):
1. Reload current app
2. Use manual command testing
3. Verify all features work

### For Full Voice Features (Later):
1. Build development build:
   ```bash
   npx expo prebuild --clean
   npx expo run:android
   ```
2. Install on physical device
3. Test full voice recognition

---

## 🔧 Current Status

After my fixes:

```
✅ TTS Error Fixed
✅ Permission Dialog Fixed  
✅ Expo Speech Installed
✅ Fallbacks Added
✅ App Works with Expo Go
⏳ Voice Recognition (need dev build)
```

---

## 💡 Quick Decision Guide

**Choose Expo Go if:**
- ✅ Want to test NOW without rebuilding
- ✅ Manual command testing is okay
- ✅ Just want to see features work

**Choose Dev Build if:**
- ✅ Want FULL voice recognition
- ✅ Want wake word detection
- ✅ Want hands-free operation
- ✅ Ready to spend 5-10 minutes building

---

## 🎬 Next Steps

**Right now, reload your app and test:**

```bash
npm start
```

The app will now:
1. ✅ Start without TTS errors
2. ✅ Show proper permission dialog
3. ✅ Speak responses using Expo Speech
4. ✅ Let you test commands manually

**When ready for full voice, run:**

```bash
npx expo prebuild --clean
npx expo run:android
```

---

## 📞 Troubleshooting

### Still seeing TTS error?
- Reload the app completely (close and restart Expo)
- Clear cache: `npm start --clear`

### Permission dialog has weird buttons?
- This is fixed! Now uses Expo permissions
- You'll see normal "Allow" / "Deny" dialog

### Voice recognition not working?
- Expected with Expo Go
- Use dev build for voice recognition
- Or use manual command testing

---

You're all set! The app should work now. 🎉
