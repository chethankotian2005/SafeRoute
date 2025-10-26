# SafeRoute

Navigation reimagined for safety. Because the shortest route isn't always the safest one.

## What is SafeRoute?

SafeRoute helps you find the safest way to your destination, not just the fastest. We analyze routes based on street lighting, foot traffic, community reports, and historical safety data to give you peace of mind while navigating.

**Try it now:** [Download Android App](https://expo.dev/artifacts/eas/7N6TFNVKUZ28ZLnN8at9rt.apk)

## Why SafeRoute?

Most navigation apps optimize for speed. We optimize for safety. Every route gets a safety score based on real factors that matter when you're walking alone.

### What makes a route "safe"?

- Well-lit streets and pedestrian areas
- Higher foot traffic (more people around)
- Proximity to police stations and public spaces
- Low crime history
- Recent community safety reports
- Time of day considerations

## Features

### Route Comparison
See three different routes with safety scores:
- **Safest Route** (Green): Best lighting, most foot traffic
- **Balanced Route** (Yellow): Good mix of safety and efficiency  
- **Fastest Route** (Red/Yellow): Quickest but may have safety concerns

### Live Navigation
- Voice-guided turn-by-turn directions
- Real-time location tracking with compass
- Dynamic instruction updates as you walk
- Battery-efficient GPS tracking

### Community Safety
- Report incidents with photos and descriptions
- View recent safety reports near you
- Get alerts about nearby emergencies
- Rate routes based on your experience

### Emergency Tools
- One-tap SOS with location sharing
- Quick dial to police/ambulance
- Emergency contact management
- Automatic location sharing during emergencies

## Tech Stack

Built with modern, reliable tools:

**Mobile App**
- React Native (Expo framework)
- JavaScript/React for UI components
- expo-location for GPS tracking
- expo-sensors for compass functionality
- expo-speech for voice navigation

**Backend & Services**
- Firebase Authentication (user accounts)
- Cloud Firestore (database)
- Firebase Storage (images)
- Google Maps JavaScript API (routing & maps)
- Google Cloud Vision API (safety analysis)

## Getting Started

### For Users

1. Download the app: [SafeRoute APK](https://expo.dev/artifacts/eas/7N6TFNVKUZ28ZLnN8at9rt.apk)
2. Enable installation from unknown sources
3. Install and launch
4. Sign up or log in
5. Start navigating safely

### For Developers

**Requirements:**
- Node.js 16+
- npm or yarn
- Expo CLI
- Firebase account
- Google Cloud account

**Setup:**

```bash
# Clone repository
git clone https://github.com/chethankotian2005/SafeRoute.git
cd SafeRoute

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Add your API keys to .env

# Start development server
npx expo start
```

**Environment Variables:**

Create a `.env` file:

```
FIREBASE_API_KEY=your_key_here
FIREBASE_AUTH_DOMAIN=your_domain
FIREBASE_PROJECT_ID=your_project
FIREBASE_STORAGE_BUCKET=your_bucket
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id
GOOGLE_MAPS_API_KEY=your_maps_key
GOOGLE_CLOUD_VISION_API_KEY=your_vision_key
```

## How It Works

### Safety Scoring

Each route is scored from 1-10 based on:

1. **Lighting Analysis** (30% weight)
   - Street lights detected via image analysis
   - Ambient lighting from buildings/shops
   - Time of day adjustments

2. **Foot Traffic** (25% weight)
   - Pedestrian density estimates
   - Business hours and activity
   - Historical usage patterns

3. **Community Data** (25% weight)
   - Recent incident reports
   - User safety ratings
   - Community alert frequency

4. **Infrastructure** (20% weight)
   - Proximity to safe spots (police, hospitals)
   - Public CCTV coverage
   - Emergency call boxes

### Route Selection Process

1. User enters destination
2. System calculates 3 different routes
3. Each route analyzed for safety factors
4. Routes displayed with color-coded scores:
   - 🟢 7-10: Safe to walk
   - 🟡 4-6: Moderate caution advised
   - 🔴 1-3: Avoid if possible

## Project Structure

```
SafeRoute/
├── src/
│   ├── components/          # Reusable UI elements
│   ├── screens/            # Main app screens
│   │   ├── HomeScreen.jsx
│   │   ├── NavigateScreen.jsx
│   │   ├── LiveNavigationScreen.jsx
│   │   ├── CommunityScreen.jsx
│   │   └── SOSScreen.jsx
│   ├── services/           # API integrations
│   │   ├── firebaseService.js
│   │   ├── googleMapsService.js
│   │   └── safetyScoring.js
│   ├── utils/             # Helper functions
│   ├── navigation/        # App navigation
│   └── config/           # Configuration
├── assets/               # Images and icons
├── .env                 # Environment variables
└── app.json            # Expo configuration
```

## Contributing

Found a bug? Have an idea? Contributions welcome!

1. Fork the repo
2. Create a branch (`git checkout -b feature/improvement`)
3. Make changes and commit (`git commit -am 'Add feature'`)
4. Push (`git push origin feature/improvement`)
5. Open a Pull Request

## Privacy

- Location data used only during active navigation
- No background tracking
- Community reports are anonymous
- Emergency contacts encrypted
- You can delete your account and data anytime

## Future Plans

- [ ] iOS version
- [ ] Offline mode with cached maps
- [ ] Group walk feature (navigate with friends)
- [ ] Public transport integration
- [ ] Wearable device support
- [ ] More language options
- [ ] Integration with local authorities

## Known Issues

- Voice navigation requires internet connection
- First launch may take a moment to load maps
- Some areas may have limited safety data

## License

MIT License - See LICENSE file

## Credits

Developed by Chethan Kotian

Special thanks to:
- Google Maps Platform
- Firebase team
- Expo framework
- React Native community
- All beta testers

## Contact

**Developer:** Chethan Kotian  
**GitHub:** [@chethankotian2005](https://github.com/chethankotian2005)  
**Repository:** [SafeRoute](https://github.com/chethankotian2005/SafeRoute)

---

Made for safer journeys 🛡️
