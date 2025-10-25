# SafeRoute - Quick Start Guide

## ⚡ Quick Installation (5 Minutes)

### Step 1: Install Dependencies

```powershell
npm install
```

### Step 2: Create Environment File

```powershell
Copy-Item .env.example .env
```

Then edit `.env` with your API keys.

### Step 3: Start Development Server

```powershell
npm start
```

---

## 🔑 Getting API Keys (15 Minutes)

### Google Maps API Key

1. Go to: https://console.cloud.google.com/
2. Create new project: "SafeRoute"
3. Enable APIs:
   - Maps JavaScript API
   - Directions API
   - Places API
   - Street View Static API
   - Geocoding API
   - Cloud Vision API
4. Create API Key → Copy to `.env`

### Firebase Configuration

1. Go to: https://console.firebase.google.com/
2. Create new project: "saferoute"
3. Add Web App
4. Copy config values to `.env`:
   - apiKey
   - authDomain
   - projectId
   - storageBucket
   - messagingSenderId
   - appId
5. Enable Authentication (Email/Password)
6. Create Firestore Database
7. Create Realtime Database
8. Enable Storage

---

## 📱 Run on Your Phone (2 Minutes)

### Using Expo Go (Easiest)

1. Install **Expo Go** app on your phone
2. Run `npm start` in terminal
3. Scan QR code with:
   - **Android**: Expo Go app
   - **iOS**: Camera app
4. App loads on your phone! 🎉

---

## 🚨 Common Issues & Quick Fixes

### Error: "Module not found"
```powershell
Remove-Item -Recurse -Force node_modules
npm install
```

### Error: "Google Maps not loading"
- Check `.env` file has correct API key
- Verify billing is enabled on Google Cloud
- Make sure Maps JavaScript API is enabled

### Error: "Firebase authentication failed"
- Verify all Firebase config in `.env`
- Check Email/Password is enabled in Firebase Console

---

## 📚 Next Steps

1. ✅ Complete the full setup guide in `README.md`
2. ✅ Configure Firebase security rules
3. ✅ Restrict API keys in Google Cloud Console
4. ✅ Customize the app for your use case

---

## 💡 Pro Tips

- **Start Simple**: Test with basic routes first before adding complex features
- **Use Test Data**: Create mock community reports for testing
- **Check Logs**: Most issues show clear error messages in terminal
- **Ask for Help**: Create an issue if you're stuck

---

## 📞 Need Help?

- Check `README.md` for detailed instructions
- Review the troubleshooting section
- Create an issue in the repository

**Happy Building! 🚀**
