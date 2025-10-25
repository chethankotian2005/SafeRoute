# Voice Assistant Quick Start Guide 🎙️

## ✅ Step 1: Permissions Configured
I've already added the voice permissions to your `app.json`:
- ✅ Android: RECORD_AUDIO, INTERNET
- ✅ iOS: Microphone & Speech Recognition

## 📱 Step 2: Install on Physical Device

**IMPORTANT**: Voice recognition does NOT work on emulators. Use a real phone!

### For Android:
```bash
npx expo run:android
```

### For iOS:
```bash
npx expo run:ios
```

Or use Expo Go app:
```bash
npm start
```
Then scan the QR code with Expo Go app on your phone.

---

## 🎯 Step 3: Test the Voice Assistant

### A. Basic Activation Test

1. **Open the app** and navigate to the **Home Screen**
2. **Look for the Voice Assistant section** (blue/purple gradient card with microphone icon)
3. **Tap the microphone icon** to activate
4. **Grant permission** when asked for microphone access
5. **Watch for "Listening" state** (pulsing animation)

### B. Test Wake Words

Say clearly into your phone:
- **"Hey SafeRoute"** 
- **"SafeRoute help me"**
- **"SafeRoute"**

**Expected Response**: Voice says "Yes, how can I help you?"

### C. Test Voice Commands

After hearing "Yes, how can I help you?", say one of these:

#### 🚨 Emergency Commands:
```
"I feel unsafe"
"Help me"
"Emergency"
"I need help"
```
**Expected**: Activates SOS screen, starts emergency recording

#### 🏠 Navigation Commands:
```
"Take me home"
"Navigate to home"
"Go home safely"
```
**Expected**: Opens navigation to your home address (set in Profile first!)

#### 🏥 Safe Spot Commands:
```
"Find nearest police station"
"Show me hospitals nearby"
"Find a pharmacy"
"Where is the nearest safe spot?"
```
**Expected**: Shows nearby safe locations on map

#### 📞 Call Commands:
```
"Call emergency contact"
"Call my emergency number"
```
**Expected**: Dials your emergency contact (set in Profile first!)

#### 🎙️ Recording Commands:
```
"Start recording"
"Stop recording"
```
**Expected**: Starts/stops emergency audio recording

#### 📍 Location Commands:
```
"Where am I?"
"What's my location?"
"Tell me my current location"
```
**Expected**: Speaks your current address

#### ℹ️ Status Commands:
```
"Status update"
"How am I doing?"
"What's my safety status?"
```
**Expected**: Provides safety score and status info

#### ❓ Help Commands:
```
"Help"
"What can you do?"
"List commands"
```
**Expected**: Lists all available commands

---

## 🧪 Step 4: Manual Testing (If Voice Doesn't Work)

If voice recognition isn't working yet:

1. **Tap "View Voice Commands"** button on Home screen
2. **Browse all available commands** in the modal
3. **Use "Test" buttons** to manually execute each command
4. This helps verify the commands work even without voice

---

## 🛠️ Troubleshooting

### ❌ "Voice Assistant Demo Mode" Alert
**Problem**: Libraries not properly linked
**Solution**: 
```bash
# Rebuild the app
npx expo run:android
# or
npx expo run:ios
```

### ❌ Voice Not Detecting
**Check these**:
- ✅ Using physical device (not emulator)
- ✅ Microphone permission granted
- ✅ Internet connection active
- ✅ Speaking clearly and loudly
- ✅ Quiet environment (minimal background noise)

### ❌ "Permission Denied"
**Solution**: 
1. Go to phone Settings > Apps > SafeRoute
2. Enable Microphone permission
3. Restart the app

### ❌ Commands Not Executing
**Check these**:
- ✅ Set emergency contact in Profile screen
- ✅ Set home address in Settings screen
- ✅ Location services enabled
- ✅ Check console logs for errors

### ❌ No TTS Voice Response
**Check these**:
- ✅ Phone volume not muted
- ✅ Media volume turned up (Android)
- ✅ Not in silent/do-not-disturb mode

---

## 🎬 Complete Test Scenario

Here's a full test flow you can follow:

### Scenario: Walking Home at Night

1. **Activate Voice Assistant**
   - Tap microphone icon on Home screen
   - Grant permissions

2. **Wake the Assistant**
   - Say: "Hey SafeRoute"
   - Listen for: "Yes, how can I help you?"

3. **Navigate Home**
   - Say: "Take me home"
   - Verify: Map opens with route

4. **Feel Unsafe**
   - Say: "Hey SafeRoute"
   - Say: "I feel unsafe"
   - Verify: SOS screen activates, recording starts

5. **Find Help**
   - Say: "Hey SafeRoute"
   - Say: "Find nearest police station"
   - Verify: Map shows police stations

6. **Call for Help**
   - Say: "Hey SafeRoute"
   - Say: "Call emergency contact"
   - Verify: Dialer opens with emergency number

7. **Check Status**
   - Say: "Hey SafeRoute"
   - Say: "Status update"
   - Listen for: Safety score and status info

---

## ✅ Pre-Testing Checklist

Before you start testing, make sure:

- [ ] Libraries installed (`@react-native-voice/voice`, `react-native-tts`)
- [ ] App built on physical device (not emulator)
- [ ] Microphone permission granted
- [ ] Internet connection active
- [ ] Emergency contact set in Profile
- [ ] Home address set in Settings/Profile
- [ ] Location services enabled
- [ ] Phone volume turned up

---

## 📊 Expected Behavior Summary

| Action | Expected Result |
|--------|----------------|
| Tap microphone | Starts listening, shows pulsing animation |
| Say wake word | Voice says "Yes, how can I help you?" |
| Say command | Voice confirms and executes action |
| Emergency command | Opens SOS screen + starts recording |
| Navigation command | Opens map with route |
| Safe spot command | Shows nearby locations |
| Call command | Opens phone dialer |
| Status command | Speaks current safety status |

---

## 🐛 Debug Mode

To see what's happening behind the scenes:

1. **Open browser console** if using Expo Go
2. **Or use React Native Debugger**
3. **Look for these logs**:
   - "Voice Assistant initialized successfully"
   - "Started listening for wake words..."
   - "Speech recognized: [your speech]"
   - "Wake word detected: [wake word]"
   - "Processing command: [command]"
   - "Speaking: [TTS response]"

---

## 🎉 Success Indicators

You'll know it's working when:
- ✅ Microphone icon shows pulsing animation when listening
- ✅ Voice responds "Yes, how can I help you?" to wake words
- ✅ Commands execute the correct actions
- ✅ TTS provides audio feedback for all interactions
- ✅ No errors in console logs
- ✅ Continuous listening (auto-restarts after each command)

---

## 📞 Need Help?

Common issues and solutions:

1. **"Cannot read property 'start' of undefined"**
   - Rebuild app: `npx expo run:android` or `npx expo run:ios`

2. **Wake word not detected**
   - Speak louder and clearer
   - Try different wake word: "SafeRoute help me"
   - Check internet connection

3. **Commands execute but no navigation happens**
   - Check if home address is set
   - Verify location permissions granted
   - Check console for navigation errors

4. **Recording not working**
   - This is normal - recording is a framework only
   - You'll see "Recording started/stopped" messages
   - Full implementation requires additional audio library

---

## 🚀 Ready to Test!

You're all set! Follow the steps above and enjoy testing your voice-activated safety assistant.

**Quick Test Command**: 
1. Tap microphone
2. Say "Hey SafeRoute"
3. Say "Status update"

This is the quickest way to verify everything is working!
