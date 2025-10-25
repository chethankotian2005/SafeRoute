# SafeRoute Deployment Guide 🚀

## Quick Deploy to Android (30 minutes)

### Step 1: Install EAS CLI
```bash
npm install -g eas-cli
```

### Step 2: Login to Expo
```bash
eas login
```
(Create free account at expo.dev if you don't have one)

### Step 3: Configure Project
```bash
eas build:configure
```

### Step 4: Build Android App
```bash
# For testing (APK)
eas build --platform android --profile preview

# For production (AAB for Play Store)
eas build --platform android --profile production
```

### Step 5: Download & Share
- Build completes in 10-20 minutes
- Download APK from Expo dashboard
- Share with testers or submit to Play Store

---

## Full Production Deployment

### Google Play Store

#### Prerequisites:
1. **Google Play Developer Account** ($25 one-time)
   - Sign up: https://play.google.com/console
   - Complete account setup
   - Add payment method

2. **Prepare Assets:**
   - App icon (512x512px)
   - Feature graphic (1024x500px)
   - Screenshots (min 2, different screen sizes)
   - Privacy policy (required)
   - App description

3. **Build Configuration:**

Create `eas.json` in project root:
```json
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json"
      }
    }
  }
}
```

#### Build Commands:
```bash
# 1. Build production AAB
eas build --platform android --profile production

# 2. Submit to Play Store
eas submit --platform android

# Or manually upload AAB to Play Console
```

#### Play Store Listing:
1. Go to Play Console
2. Create new app
3. Upload AAB file
4. Fill in store listing:
   - Title: SafeRoute
   - Short description: AI-powered safety navigation
   - Full description: [Your app description]
   - Category: Maps & Navigation
   - Content rating: Complete questionnaire
   - Privacy policy: Add URL

5. Create internal testing track first
6. Then production release

---

### Apple App Store

#### Prerequisites:
1. **Apple Developer Account** ($99/year)
   - Sign up: https://developer.apple.com
   - Enroll in Apple Developer Program

2. **Mac Computer Required** (for testing)

3. **App Store Connect Setup:**
   - Create App ID
   - Create provisioning profiles
   - Set up App Store Connect record

#### Build Commands:
```bash
# 1. Build iOS app
eas build --platform ios --profile production

# 2. Submit to App Store
eas submit --platform ios
```

#### App Store Listing:
1. Create app in App Store Connect
2. Fill in metadata
3. Upload screenshots (different iPhone sizes)
4. Submit for review
5. Wait for approval (2-7 days)

---

## Alternative: Self-Hosted APK

For quick distribution without app stores:

### Step 1: Build APK
```bash
eas build --platform android --profile preview
```

### Step 2: Host APK
Options:
- Upload to Google Drive (share link)
- Upload to Dropbox
- Host on your website
- Send via email (if < 25MB)

### Step 3: User Installation
Users need to:
1. Download APK
2. Enable "Install from unknown sources"
3. Install APK

⚠️ **Security Warning:** Users may be cautious about installing from unknown sources

---

## Beta Testing with TestFlight (iOS)

### Step 1: Build for TestFlight
```bash
eas build --platform ios --profile preview
```

### Step 2: Submit to TestFlight
```bash
eas submit --platform ios --profile preview
```

### Step 3: Add Testers
1. Go to App Store Connect
2. TestFlight section
3. Add tester emails
4. Testers receive invite
5. Up to 10,000 testers

---

## Cost Comparison

### Free Options:
- ✅ Expo Go (development only)
- ✅ EAS Free Tier (30 builds/month)
- ✅ Self-hosted APK

### Paid Options:
- 💰 Google Play: $25 one-time
- 💰 Apple App Store: $99/year
- 💰 EAS Production ($29/month for unlimited builds)

---

## Recommended Timeline

### Week 1: Beta Testing
```bash
# Day 1-2: Build and test
eas build --platform android --profile preview
# Share APK with 5-10 testers
# Gather feedback

# Day 3-7: Fix bugs and iterate
```

### Week 2: Prepare for Production
```
# Day 8-10: Create store assets
- Design app icon
- Create screenshots
- Write app description
- Create privacy policy

# Day 11-14: Setup store accounts
- Register Google Play Developer
- Create app listing
- Prepare submission
```

### Week 3: Production Release
```bash
# Day 15: Build production
eas build --platform android --profile production

# Day 16: Submit to store
eas submit --platform android

# Day 17-21: Store review process
```

### Week 4: Live!
```
# Monitor reviews
# Fix critical bugs
# Plan updates
```

---

## Privacy Policy Required

Both Google Play and Apple App Store require a privacy policy.

**Quick Solution:**
1. Use a privacy policy generator:
   - https://app-privacy-policy-generator.firebaseapp.com/
   - https://www.privacypolicies.com/

2. Host it:
   - GitHub Pages (free)
   - Your website
   - Google Docs (set to public)

**What to include:**
- Data collected (location, user info)
- How data is used (navigation, safety alerts)
- Third-party services (Firebase, Google Maps)
- User rights (data deletion, access)
- Contact information

---

## Pre-Launch Checklist

### Technical:
- [ ] App builds without errors
- [ ] All features tested on real device
- [ ] Voice assistant works
- [ ] Maps and navigation work
- [ ] Emergency features tested
- [ ] Performance optimized
- [ ] Crash reporting setup (Sentry/Firebase)

### Legal:
- [ ] Privacy policy created
- [ ] Terms of service (optional but recommended)
- [ ] Content rating completed
- [ ] Age restrictions set

### Marketing:
- [ ] App icon designed (512x512)
- [ ] Screenshots captured (5-8 different screens)
- [ ] Feature graphic created
- [ ] App description written
- [ ] Keywords researched

### Store Setup:
- [ ] Developer account created
- [ ] Payment method added
- [ ] App listing created
- [ ] Test users added

---

## After Launch

### Monitor:
- App crashes (Firebase Crashlytics)
- User reviews
- Download numbers
- Performance metrics

### Update Regularly:
- Bug fixes
- New features
- Security patches
- OS compatibility

### Engage Users:
- Respond to reviews
- Gather feedback
- Build community
- Plan roadmap

---

## Emergency Rollback

If critical bug found after release:

### Google Play:
1. Go to Play Console
2. Create new release with fix
3. Upload new AAB
4. Release to production
5. Gradual rollout (10% → 50% → 100%)

### App Store:
1. Submit new build
2. Request expedited review
3. Usually approved in 24 hours for critical fixes

---

## Support Resources

- **Expo Docs:** https://docs.expo.dev/
- **EAS Build:** https://docs.expo.dev/build/introduction/
- **Play Console:** https://support.google.com/googleplay/android-developer
- **App Store Connect:** https://developer.apple.com/help/app-store-connect/

---

## Quick Command Reference

```bash
# Install tools
npm install -g eas-cli

# Login
eas login

# Configure
eas build:configure

# Build preview (APK)
eas build --platform android --profile preview

# Build production (AAB)
eas build --platform android --profile production

# Submit to Play Store
eas submit --platform android

# Build iOS
eas build --platform ios

# Submit to App Store
eas submit --platform ios

# Check build status
eas build:list

# View build logs
eas build:view [BUILD_ID]
```

---

## Next Steps

**Choose your path:**

1. **Quick Beta Test:**
   ```bash
   eas build --platform android --profile preview
   ```

2. **Full Production:**
   - Create developer accounts
   - Prepare store assets
   - Build and submit

3. **Self-Host:**
   - Build APK
   - Share download link

**Start now with:** `npm install -g eas-cli` 🚀
