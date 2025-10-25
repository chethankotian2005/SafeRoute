# Voice Assistant Dependencies Installation Guide

## Required Dependencies

Install these dependencies for the AI Voice Safety Assistant feature:

```bash
# Voice recognition and speech
npm install @react-native-voice/voice@^3.2.4

# Text-to-speech
npm install react-native-tts@^4.1.0

# Additional storage for voice settings
npm install @react-native-async-storage/async-storage@^1.19.0

# Audio recording (optional - for full recording features)
npm install react-native-audio-recorder-player@^3.5.3
```

## Installation Commands

### For the basic voice assistant:
```bash
cd SafeRoute
npm install @react-native-voice/voice react-native-tts @react-native-async-storage/async-storage
```

### For iOS (after npm install):
```bash
cd ios
pod install
cd ..
```

## Android Permissions

Add to `android/app/src/main/AndroidManifest.xml`:

```xml
<manifest>
  <!-- Add these permissions -->
  <uses-permission android:name="android.permission.RECORD_AUDIO" />
  <uses-permission android:name="android.permission.INTERNET" />
  <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
  
  <application>
    ...
  </application>
</manifest>
```

## iOS Permissions

Add to `ios/SafeRoute/Info.plist`:

```xml
<dict>
  <!-- Add these keys -->
  <key>NSMicrophoneUsageDescription</key>
  <string>SafeRoute needs microphone access for voice commands and emergency recording to keep you safe</string>
  
  <key>NSSpeechRecognitionUsageDescription</key>
  <string>SafeRoute uses voice recognition for hands-free safety features like emergency activation and navigation</string>
  
  <key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
  <string>SafeRoute needs location access to provide safety information and navigation</string>
</dict>
```

## Testing Voice Commands

After installation, test with these commands:

1. **Activate Voice Assistant**: Tap the voice indicator on Home screen
2. **Test Emergency**: Say "Hey SafeRoute, I feel unsafe"
3. **Test Navigation**: Say "SafeRoute, take me home"
4. **Test Safe Spots**: Say "Hey SafeRoute, find nearest police station"
5. **Test Call**: Say "SafeRoute, call emergency contact"

## Troubleshooting

### Voice recognition not working:
- Check microphone permissions in device settings
- Ensure internet connection (required for speech recognition)
- Try restarting the app
- Check that the microphone is not being used by another app

### TTS not working:
- Check device volume settings
- Verify TTS engine is installed on Android
- On iOS, check accessibility settings

### Permission errors:
- Manually grant permissions in Settings > Apps > SafeRoute
- Restart the app after granting permissions

## Optional: Full Audio Recording

For complete emergency audio recording features, install:

```bash
npm install react-native-audio-recorder-player
```

Then uncomment the audio recording implementation in:
- `src/services/voiceAssistant.js`

## Multi-language Support

Currently supported languages:
- English (en-US) - Default
- Hindi (hi-IN) - Planned
- Tamil (ta-IN) - Planned  
- Telugu (te-IN) - Planned

To add more languages, update `src/services/voiceCommands.js`

## Production Notes

Before deploying to production:

1. **Test voice recognition** on multiple devices
2. **Verify permissions** are properly requested
3. **Test offline behavior** (voice recognition requires internet)
4. **Add error boundaries** for voice assistant failures
5. **Implement analytics** to track voice command usage
6. **Add user onboarding** for voice features

## Feature Flags

You can disable voice assistant by setting in `src/utils/constants.js`:

```javascript
export const FEATURES = {
  VOICE_ASSISTANT: true, // Set to false to disable
  VOICE_RECORDING: true,
  VOICE_MULTILANG: false, // Set to true when ready
};
```
