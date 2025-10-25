# Voice Assistant Test Checklist ✅

## Current Status
- ✅ Permissions configured in `app.json`
- ✅ Voice libraries installed (`@react-native-voice/voice`, `react-native-tts`)
- ✅ Voice assistant service implemented
- ✅ UI components ready on Home screen

---

## 🎯 What You Need to Do Now

### Step 1: Rebuild the App (REQUIRED)
Since we added new permissions, you need to rebuild:

**Option A - Using Expo Go (Easiest)**
```bash
npm start
```
Then scan QR code with Expo Go app on your phone.

**Option B - Development Build (For full native features)**
```bash
npx expo prebuild --clean
npx expo run:android
```

### Step 2: Test on Physical Device
📱 **CRITICAL**: Voice recognition ONLY works on real phones, NOT emulators!

---

## 📋 Testing Checklist

### ✅ Part 1: Basic Setup (5 minutes)

- [ ] **1.1** Open SafeRoute app on physical device
- [ ] **1.2** Navigate to **Home Screen**
- [ ] **1.3** Look for **Voice Assistant section** (blue gradient card with microphone)
- [ ] **1.4** Tap on **Profile** screen first
- [ ] **1.5** Set your **Emergency Contact** number
- [ ] **1.6** Go to **Settings** screen
- [ ] **1.7** Set your **Home Address**

### ✅ Part 2: Voice Activation (2 minutes)

- [ ] **2.1** Go back to **Home Screen**
- [ ] **2.2** Tap the **microphone icon** in Voice Assistant section
- [ ] **2.3** When prompted, **Grant Microphone Permission**
- [ ] **2.4** Watch for **pulsing animation** (means listening)
- [ ] **2.5** Check console for "Voice Assistant initialized successfully"

### ✅ Part 3: Wake Word Test (3 minutes)

- [ ] **3.1** Speak clearly: **"Hey SafeRoute"**
- [ ] **3.2** Listen for response: **"Yes, how can I help you?"**
- [ ] **3.3** If no response, try: **"SafeRoute help me"**
- [ ] **3.4** If still no response, try: **"SafeRoute"**
- [ ] **3.5** Check console logs for "Wake word detected"

### ✅ Part 4: Command Testing (10 minutes)

Test each command type. After wake word, say:

#### Emergency Commands
- [ ] **4.1** "I feel unsafe" → Should activate SOS screen
- [ ] **4.2** "Emergency" → Should activate SOS screen
- [ ] **4.3** "Help me" → Should activate SOS screen

#### Navigation Commands
- [ ] **4.4** "Take me home" → Should open Map with route
- [ ] **4.5** "Navigate to home" → Should open Map with route

#### Safe Spot Commands
- [ ] **4.6** "Find nearest police station" → Shows police on map
- [ ] **4.7** "Show me hospitals nearby" → Shows hospitals on map
- [ ] **4.8** "Find a pharmacy" → Shows pharmacies on map

#### Call Commands
- [ ] **4.9** "Call emergency contact" → Opens phone dialer

#### Location Commands
- [ ] **4.10** "Where am I?" → Speaks your location
- [ ] **4.11** "What's my location?" → Speaks your location

#### Status Commands
- [ ] **4.12** "Status update" → Speaks safety score info

#### Recording Commands
- [ ] **4.13** "Start recording" → Says "Recording started"
- [ ] **4.14** "Stop recording" → Says "Recording stopped"

#### Help Commands
- [ ] **4.15** "Help" → Lists available commands

### ✅ Part 5: Manual Command Test (5 minutes)

If voice isn't working:

- [ ] **5.1** Tap **"View Voice Commands"** button on Home screen
- [ ] **5.2** Modal opens showing all commands
- [ ] **5.3** Tap **"Test"** button next to "I feel unsafe"
- [ ] **5.4** Verify SOS screen opens
- [ ] **5.5** Go back and test other commands using Test buttons

### ✅ Part 6: Continuous Listening Test (3 minutes)

- [ ] **6.1** Say "Hey SafeRoute" → Get response
- [ ] **6.2** Say a command → Executes
- [ ] **6.3** Wait 2 seconds
- [ ] **6.4** Say "Hey SafeRoute" again → Should still work
- [ ] **6.5** Verify voice assistant auto-restarts after each command

---

## 🐛 Troubleshooting Guide

### Issue: "Demo Mode" Alert Appears
**Problem**: Libraries not linked properly  
**Solution**:
```bash
npx expo prebuild --clean
npx expo run:android
```

### Issue: No Wake Word Detection
**Check**:
- [ ] Using physical device (not emulator)
- [ ] Microphone permission granted
- [ ] Internet connection active
- [ ] Speaking clearly and loudly
- [ ] No background noise
- [ ] Phone volume turned up

**Try**:
- Speak closer to phone
- Try different wake word: "SafeRoute help me"
- Restart the app
- Check console for errors

### Issue: Commands Don't Execute
**Check**:
- [ ] Emergency contact set in Profile
- [ ] Home address set in Settings
- [ ] Location services enabled
- [ ] App has location permissions

### Issue: No Voice Response (TTS)
**Check**:
- [ ] Phone volume not muted
- [ ] Media volume turned up
- [ ] Not in silent mode
- [ ] Not connected to Bluetooth (or check BT device volume)

### Issue: App Crashes
**Check**:
- [ ] Rebuild app after installing libraries
- [ ] Check console for error messages
- [ ] Verify all libraries installed: `npm list @react-native-voice/voice react-native-tts`

---

## 📊 Success Indicators

### You'll know it's working when:

✅ **Visual**:
- Microphone icon pulses when listening
- Status shows "Listening..." or "Active"
- Commands trigger screen navigation

✅ **Audio**:
- Voice responds "Yes, how can I help you?" to wake words
- Voice confirms each command with audio feedback
- Clear TTS voice (not robotic)

✅ **Functional**:
- Wake words consistently detected
- Commands execute correctly
- Auto-restarts listening after each command
- No crashes or freezes

✅ **Console Logs**:
```
Voice Assistant initialized successfully
Started listening for wake words...
Speech recognized: ["hey saferoute"]
Wake word detected: hey saferoute
Speaking: Yes, how can I help you?
Speech recognized: ["i feel unsafe"]
Processing command: i feel unsafe
Executing command: i feel unsafe
Speaking: Activating emergency mode...
```

---

## 🎬 Quick Test Script (2 minutes)

Run this quick test to verify everything works:

1. **Activate**: Tap microphone icon
2. **Wake**: Say "Hey SafeRoute"
3. **Command**: Say "Status update"
4. **Verify**: Hear safety status spoken

If this works, everything is good! ✅

---

## 📝 Test Results

Record your results:

**Device Used**: _________________ (e.g., Samsung Galaxy, iPhone 13)

**Wake Word Test**:
- [ ] Passed
- [ ] Failed
- Notes: ___________________________________________

**Command Test**:
- [ ] All commands work
- [ ] Some commands work
- [ ] No commands work
- Notes: ___________________________________________

**TTS Response**:
- [ ] Clear and audible
- [ ] Robotic/unclear
- [ ] Not working
- Notes: ___________________________________________

**Overall Experience**:
- [ ] Excellent - Ready for production
- [ ] Good - Minor issues
- [ ] Poor - Needs work
- Notes: ___________________________________________

---

## 🚀 Next Steps After Testing

Once testing is complete:

### If Everything Works ✅
1. Test in different environments (noisy, quiet, outdoor)
2. Test with different accents/speaking styles
3. Test battery usage during extended use
4. Consider adding more voice commands
5. Implement actual audio recording feature

### If Issues Found ❌
1. Document specific issues
2. Check console logs for errors
3. Try troubleshooting steps above
4. Rebuild app with clean build
5. Verify all dependencies installed

---

## 💡 Pro Tips

1. **Best Environment**: Quiet room for first test
2. **Clear Speech**: Speak naturally, not too fast
3. **Wake Word**: Pause briefly after wake word
4. **Command**: Speak command clearly after "Yes, how can I help you?"
5. **Debugging**: Keep console open to see logs
6. **Continuous Use**: Voice assistant auto-restarts, no need to reactivate

---

## ✨ You're Ready!

Follow this checklist step-by-step and you'll have your voice assistant working in no time!

**Start here**: Step 1 → Rebuild the app
