# Voice Assistant Testing Guide

## ✅ Completed
- ✅ Voice assistant service fully implemented with @react-native-voice/voice
- ✅ Text-to-speech integrated with react-native-tts
- ✅ Wake word detection ("Hey SafeRoute", "SafeRoute help me")
- ✅ Voice command processing (8 command categories)
- ✅ UI components (VoiceIndicator, VoiceCommandModal)
- ✅ Integration into HomeScreen
- ✅ Required libraries installed

## 🔧 Required Configuration

### Android Permissions (AndroidManifest.xml)

Add these permissions to your `android/app/src/main/AndroidManifest.xml`:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    
    <!-- Voice Recognition Permissions -->
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.INTERNET" />
    
    <!-- Optional: For audio recording feature -->
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    
    <application ...>
        <!-- Your existing config -->
    </application>
</manifest>
```

### iOS Permissions (Info.plist)

Add these to your `ios/YourApp/Info.plist`:

```xml
<key>NSMicrophoneUsageDescription</key>
<string>SafeRoute needs access to your microphone for voice commands to help keep you safe</string>
<key>NSSpeechRecognitionUsageDescription</key>
<string>SafeRoute uses speech recognition to activate safety features with voice commands</string>
```

## 📱 Testing Steps

### 1. Build and Install on Real Device

**IMPORTANT**: Voice recognition does NOT work on emulators/simulators. You MUST test on a physical device.

For Android:
```bash
npm run android
```

For iOS:
```bash
npm run ios
```

### 2. Test Basic Activation

1. Open the app and go to Home screen
2. Tap on the voice indicator (microphone icon with pulsing animation)
3. Grant microphone permission when prompted
4. The indicator should show "Listening" state

### 3. Test Wake Words

Say one of these wake phrases:
- "Hey SafeRoute"
- "SafeRoute help me"
- "SafeRoute"

You should hear: "Yes, how can I help you?"

### 4. Test Voice Commands

After wake word activation, try these commands:

**Emergency Commands:**
- "I feel unsafe"
- "Help me"
- "Emergency"
- "I need help"

**Navigation Commands:**
- "Take me home"
- "Navigate to home"
- "Go home safely"

**Safe Spot Commands:**
- "Find nearest police station"
- "Show me hospitals nearby"
- "Find a pharmacy"

**Call Commands:**
- "Call emergency contact"
- "Call my emergency number"

**Recording Commands:**
- "Start recording"
- "Stop recording"

**Location Commands:**
- "Where am I?"
- "What's my location?"

**Status Commands:**
- "Status update"
- "How am I doing?"

### 5. Test Manual Commands

If voice recognition isn't working:
1. Tap "View Voice Commands" button on Home screen
2. Use the "Test" button next to each command
3. This manually executes the command without voice

## 🐛 Troubleshooting

### Voice Recognition Not Working
- **Check device**: Must use real device, not emulator
- **Check permissions**: Settings > Apps > SafeRoute > Permissions > Microphone (allow)
- **Check internet**: Voice recognition requires internet connection
- **Check logs**: Look for errors in console/logcat

### App Crashes on Voice Activation
- Verify libraries are installed: `npm list @react-native-voice/voice react-native-tts`
- Rebuild the app after installing libraries
- Check AndroidManifest.xml has RECORD_AUDIO permission

### TTS Not Speaking
- Check device volume is not muted
- On Android: Check notification/media volume
- Try different language: Settings > Voice Language

### Wake Word Not Detecting
- Speak clearly and pause slightly after wake word
- Ensure quiet environment (minimize background noise)
- Try different wake word variations
- Check console for "Speech recognized:" logs

### Commands Not Executing
- Ensure you've set up:
  - Emergency contact in Profile
  - Home address in Settings
- Check global.navigation is set (should auto-set on Home screen)
- Look for errors in voice command processing logs

## 📊 Expected Behavior

### Continuous Listening Flow
1. App starts → Voice assistant initializes
2. Tap voice indicator → Start listening for wake words
3. Say wake word → "Yes, how can I help you?" (TTS response)
4. Say command → Voice assistant processes and executes
5. Auto-restart → Continues listening for next wake word

### Voice Command Flow
1. Wake word detected → Activate voice assistant
2. Listen for command → Process spoken text
3. Match command pattern → Execute appropriate action
4. Speak response → Provide audio feedback
5. Execute action → Navigate/call/record as requested
6. Deactivate → Reset to listening for wake words

## 🎯 Voice Settings

Customize in code (`src/services/voiceAssistant.js`):

- **Language**: Default is 'en-US', can be changed in Settings
- **TTS Rate**: 0.5 (calming pace) - adjust in setupTTS()
- **TTS Pitch**: 1.0 (normal) - adjust in setupTTS()
- **Wake Words**: Array in constructor, add/remove as needed

## 🔒 Privacy Notes

- Voice data is processed by device speech recognition (Google/Apple)
- No voice data is stored permanently by SafeRoute
- Emergency recordings are saved locally only
- Microphone permission required for voice features
- Can be disabled anytime in app Settings

## 📝 Next Steps

1. **Configure Permissions**: Add to AndroidManifest.xml and Info.plist
2. **Build for Device**: Run on physical Android/iOS device
3. **Test Wake Words**: Verify wake word detection works
4. **Test All Commands**: Go through each command category
5. **Set Up Profile**: Add emergency contact and home address
6. **Test Edge Cases**: Test in noisy environments, different accents
7. **Customize Voice**: Adjust TTS rate/pitch to preference
8. **Add Languages**: Enable multi-language support as needed

## 🎉 Production Readiness

Before releasing:
- [ ] Test on multiple devices (Android & iOS)
- [ ] Test different accents and speech patterns
- [ ] Test in various noise environments
- [ ] Add analytics for voice command usage
- [ ] Implement actual audio recording (currently framework only)
- [ ] Add fallback for offline mode
- [ ] Test battery usage impact
- [ ] Add user tutorial/onboarding for voice features
- [ ] Test accessibility features
- [ ] Review privacy policy for voice data handling
