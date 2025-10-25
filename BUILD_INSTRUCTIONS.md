# Automatic Wake Word Detection Setup 🎙️

## Current Situation

You're using **Expo Go** which doesn't support native voice recognition libraries.

For **automatic wake word detection** ("Hey SafeRoute"), you need a **development build**.

---

## 🚀 Quick Setup (10 minutes)

### Step 1: Connect Your Android Phone

1. **Enable USB Debugging:**
   - Settings → About Phone
   - Tap "Build Number" 7 times
   - Go back → Developer Options
   - Enable "USB Debugging"

2. **Connect phone via USB cable**

3. **Trust computer** when prompted on phone

4. **Verify connection:**
   ```bash
   adb devices
   ```

### Step 2: Build & Install

```bash
npx expo run:android
```

**Wait 5-10 minutes** for first build.

### Step 3: Test Wake Words

1. App opens automatically
2. **Tap microphone icon once** to activate
3. **Say "Hey SafeRoute"**
4. Voice responds: "Yes, how can I help you?"
5. **Say your command**: "I feel unsafe", "Take me home", etc.

---

## ✅ After Installation

### How Automatic Wake Word Works:

1. **One-time activation**: Tap microphone icon (first time only)
2. **Continuous listening**: Always listening for "Hey SafeRoute"
3. **Auto-restart**: After each command, listening resumes
4. **Hands-free**: No need to tap again!

### Voice Commands:

- "Hey SafeRoute" → "I feel unsafe"
- "Hey SafeRoute" → "Take me home"  
- "Hey SafeRoute" → "Find police station"
- "Hey SafeRoute" → "Call emergency contact"
- "Hey SafeRoute" → "Status update"

---

## 🔍 Why Dev Build is Required

| Feature | Expo Go | Dev Build |
|---------|---------|-----------|
| Wake Word Detection | ❌ | ✅ |
| Auto Voice Recognition | ❌ | ✅ |
| Continuous Listening | ❌ | ✅ |
| Manual Commands | ✅ | ✅ |
| TTS Responses | ✅ | ✅ |

**@react-native-voice/voice** is a native module that requires native compilation. Expo Go doesn't include it.

---

## 📱 Connection Instructions

### Windows:
1. Install phone USB drivers
2. Enable USB debugging on phone
3. Connect USB cable
4. Run: `adb devices`

### Troubleshooting:
- **Device not found**: Try different USB port/cable
- **Unauthorized**: Trust computer on phone
- **No drivers**: Download from phone manufacturer

---

## 🎯 Next Steps

**Right Now:**

1. ✅ I've already run `npx expo prebuild` - native files ready
2. ⏳ Connect your Android phone via USB
3. ⏳ Run: `npx expo run:android`
4. ⏳ Wait for build (5-10 min)
5. ✅ App auto-opens with full voice recognition!

**Connect your phone and let me know - I'll help you run the build!** 🚀
