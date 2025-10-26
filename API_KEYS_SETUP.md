# API Keys Configuration Guide

## 🔒 Securing API Keys for GitHub

This project uses **EAS Secrets** for secure API key management in production builds.

## Quick Setup

### 1. Install EAS CLI (if not already installed)
```bash
npm install -g eas-cli
```

### 2. Login to Expo
```bash
eas login
```

### 3. Configure EAS Secrets

Run these commands to securely store your API keys:

```bash
# Google Maps API Key
eas secret:create --scope project --name GOOGLE_MAPS_API_KEY --value "AIzaSyASprxP5RkR-UaRrK1_xTsZeda7zgKrAkM" --type string

# Google Cloud Vision API Key
eas secret:create --scope project --name GOOGLE_CLOUD_VISION_API_KEY --value "AIzaSyDLmR7KzeoRTpjduHUW1oHtOsDmXnLcr8o" --type string

# Firebase API Key
eas secret:create --scope project --name FIREBASE_API_KEY --value "AIzaSyASMx6r4ohoSuZscY7lXo6CboTwtQr_ow8" --type string

# Firebase Auth Domain
eas secret:create --scope project --name FIREBASE_AUTH_DOMAIN --value "saferoute-2d2ad.firebaseapp.com" --type string

# Firebase Project ID
eas secret:create --scope project --name FIREBASE_PROJECT_ID --value "saferoute-2d2ad" --type string

# Firebase Storage Bucket
eas secret:create --scope project --name FIREBASE_STORAGE_BUCKET --value "saferoute-2d2ad.firebasestorage.app" --type string

# Firebase Messaging Sender ID
eas secret:create --scope project --name FIREBASE_MESSAGING_SENDER_ID --value "194779651061" --type string

# Firebase App ID
eas secret:create --scope project --name FIREBASE_APP_ID --value "1:194779651061:web:a15672a10a6c3988c39ebc" --type string

# Firebase Database URL
eas secret:create --scope project --name FIREBASE_DATABASE_URL --value "https://saferoute-2d2ad-default-rtdb.asia-southeast1.firebasedatabase.app" --type string
```

### 4. Verify Secrets
```bash
eas secret:list
```

## How It Works

### Development (Local)
- Uses `.env` file (gitignored)
- Keys loaded via `react-native-dotenv` in Babel

### Production (EAS Build)
- Uses EAS Secrets (encrypted on Expo servers)
- Injected at build time via `process.env`
- Never exposed in GitHub or client code

### GitHub Safety
- ✅ `.env` is in `.gitignore` (not committed)
- ✅ `.env.production` is in `.gitignore` (not committed)
- ✅ `apiKeys.js` contains only placeholders
- ✅ `firebaseConfig.js` uses environment variables
- ✅ Real keys stored in EAS Secrets (encrypted)

## File Structure

```
SafeRoute/
├── .env                      # Local development keys (GITIGNORED)
├── .env.production           # Backup of production keys (GITIGNORED)
├── src/
│   └── config/
│       ├── apiKeys.js        # Placeholder values for GitHub
│       └── firebaseConfig.js # Uses env vars, safe for GitHub
```

## Building with Secrets

### For Development Builds
```bash
# Local development - uses .env file
npm start
```

### For Production Builds
```bash
# Production build - uses EAS Secrets
eas build --platform android --profile production
```

The EAS build system automatically injects your secrets as environment variables.

## Update Secrets

To update a secret:
```bash
eas secret:delete --name GOOGLE_MAPS_API_KEY
eas secret:create --scope project --name GOOGLE_MAPS_API_KEY --value "new_key_here" --type string
```

## Important Notes

### Firebase Config Safety
Firebase configuration values (API key, project ID, etc.) are **designed to be public**:
- They're already exposed in your mobile app bundle
- Security is enforced through:
  - Firebase Authentication rules
  - Firestore security rules
  - Storage security rules
  - API key restrictions (by package name)

### Google Maps API Key
- Should be restricted to your app's package name in Google Cloud Console
- Go to: Google Cloud Console → APIs & Services → Credentials
- Edit your API key → Application restrictions → Android apps
- Add package name: `com.saferoute.app`
- Add SHA-1 certificate fingerprint from your keystore

### Best Practices
1. ✅ Never commit `.env` files
2. ✅ Use EAS Secrets for production
3. ✅ Restrict API keys by package name
4. ✅ Use Firebase security rules
5. ✅ Regularly rotate API keys
6. ✅ Monitor API usage in Google Cloud Console

## Troubleshooting

### Build fails with "API key not found"
```bash
# Check if secrets are set
eas secret:list

# Re-create missing secrets
eas secret:create --scope project --name GOOGLE_MAPS_API_KEY --value "your_key"
```

### Local development not working
```bash
# Ensure .env file exists in project root
# Copy from .env.production if needed
cp .env.production .env

# Restart Metro bundler
npm start -- --reset-cache
```

### Keys not loading in app
```javascript
// In App.js or index.js, add validation:
import { validateApiKeys } from './src/config/apiKeys';

useEffect(() => {
  const isValid = validateApiKeys();
  if (!isValid) {
    Alert.alert('Configuration Error', 'API keys not properly configured');
  }
}, []);
```

## Security Checklist

Before pushing to GitHub:
- [ ] Verified `.env` is in `.gitignore`
- [ ] Verified `.env.production` is in `.gitignore`
- [ ] Checked `apiKeys.js` contains only placeholders
- [ ] Checked `firebaseConfig.js` uses environment variables
- [ ] Configured EAS Secrets for all keys
- [ ] Tested build with EAS Secrets
- [ ] Restricted Google Maps API key by package name
- [ ] Reviewed Firebase security rules

## Alternative: App.json Extra Config

For simpler projects, you can also use `app.json`:

```json
{
  "expo": {
    "extra": {
      "googleMapsApiKey": "YOUR_KEY_HERE"
    }
  }
}
```

Then access via:
```javascript
import Constants from 'expo-constants';
const apiKey = Constants.expoConfig.extra.googleMapsApiKey;
```

**Note:** `app.json` is usually committed, so use this only for non-sensitive config or with EAS environment-specific configs.

## Resources

- [EAS Secrets Documentation](https://docs.expo.dev/build-reference/variables/)
- [Environment Variables in Expo](https://docs.expo.dev/guides/environment-variables/)
- [Firebase Security Best Practices](https://firebase.google.com/docs/rules)
- [Google Cloud API Key Restrictions](https://cloud.google.com/docs/authentication/api-keys)
