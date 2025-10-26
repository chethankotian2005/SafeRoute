# MapScreen - AI-Powered Safety Navigation

## 🎯 Overview

The **MapScreen** is the core navigation component of SafeRoute that provides intelligent route planning with AI-powered safety analysis. It calculates multiple walking route alternatives and uses machine learning to assess the safety of each path based on various real-world factors.

---

## ✨ Features

### 1. **Smart Route Calculation**
- Calculates **3 alternative walking routes** using Google Directions API
- Displays routes sorted by safety score (safest first)
- Shows distance, duration, and route name for each alternative

### 2. **AI Safety Analysis**
Each route is analyzed using multiple data sources:

| Factor | Weight | Description |
|--------|--------|-------------|
| **Street Lighting** | 30% | Analyzes lighting conditions via Google Street View + Cloud Vision API |
| **Foot Traffic** | 25% | Estimates pedestrian density based on time and location data |
| **Time of Day** | 20% | Applies bonus for daytime (6AM-8PM), penalty for nighttime |
| **Safe Spot Proximity** | 15% | Counts nearby hospitals, police stations, and safe places |
| **Community Reports** | 10% | Considers recent user-submitted safety concerns |

**Safety Score**: 1-10 scale
- 🟢 **8-10**: SAFE (Green)
- 🟠 **5-7**: MODERATE (Orange)
- 🔴 **1-4**: UNSAFE (Red)

### 3. **Color-Coded Route Visualization**
- Routes displayed on map with safety-based colors
- Selected route highlighted with thicker line
- Destination marker with red pin
- User location shown as blue pulsing dot

### 4. **Turn-by-Turn Navigation**
- Clear step-by-step instructions
- Real-time distance and time remaining
- Auto-advance to next step when user reaches waypoint
- Visual icons for navigation maneuvers

### 5. **Real-Time Location Tracking**
- GPS location updates every few seconds
- Map camera follows user during navigation
- Route deviation detection
- Arrival notification when destination reached

### 6. **Safety Features**
- Quick SOS button accessible during navigation
- Live safety score indicator
- Community alert integration
- Nearby safe spot markers

---

## 🚀 User Flow

### Step 1: Enter Destination
```
User opens Navigate screen → Enters destination (e.g., "NITK Beach")
```

### Step 2: Route Calculation
```
App gets GPS location → Calls Google Directions API → Receives 3 routes
```

### Step 3: AI Safety Analysis
```
For each route:
  1. Get community reports near route
  2. Analyze street lighting (Street View + Vision API)
  3. Calculate foot traffic density
  4. Check time of day
  5. Count nearby safe spots
  6. Compute weighted safety score (1-10)
```

### Step 4: Route Selection
```
Routes displayed sorted by safety → User reviews options → Selects preferred route
```

### Step 5: Navigation
```
User taps "Start Navigation" → Turn-by-turn guidance begins → Map follows user
```

### Step 6: Progress Tracking
```
App monitors location → Updates remaining distance/time → Auto-advances steps
```

### Step 7: Arrival
```
User reaches destination → Navigation complete notification → Reset screen
```

---

## 🏗️ Architecture

### Component Structure

```javascript
MapScreen
├── Search Bar (Destination Input)
├── Map View (WebView with Google Maps)
├── Route List Panel
│   ├── Route Cards (Safety Score + Stats)
│   └── Start Navigation Button
└── Navigation Panel
    ├── Stats (Distance + Time)
    ├── Current Instruction
    └── Safety Indicator + SOS Button
```

### State Management

```javascript
// Location State
- userLocation: { latitude, longitude, accuracy }
- mapReady: boolean
- currentAddress: string

// Route State
- destination: string
- destinationCoords: { latitude, longitude }
- routes: Array<Route>
- selectedRoute: Route | null
- showRouteList: boolean

// Navigation State
- isNavigating: boolean
- currentStepIndex: number
- navigationStats: { distanceRemaining, timeRemaining, currentInstruction }
```

### Data Flow

```
User Input → Geocoding → Route Calculation → Safety Analysis → Display
                                                    ↓
                                              Route Selection
                                                    ↓
                                             Navigation Start
                                                    ↓
                                       Location Updates → Progress Tracking
```

---

## 🔧 API Integration

### Google Maps APIs Used

1. **Directions API**
   - Purpose: Calculate walking routes
   - Endpoint: `/directions/json`
   - Parameters: `origin`, `destination`, `mode=walking`, `alternatives=true`

2. **Geocoding API**
   - Purpose: Convert address to coordinates
   - Endpoint: `/geocode/json`
   - Parameters: `address`

3. **Places API**
   - Purpose: Find nearby safe spots
   - Endpoint: `/place/nearbysearch/json`
   - Parameters: `location`, `radius`, `type`

4. **Street View API**
   - Purpose: Get street images for lighting analysis
   - Endpoint: `/streetview`
   - Parameters: `location`, `size`, `heading`

5. **Cloud Vision API**
   - Purpose: Analyze lighting in street images
   - Endpoint: `/images:annotate`
   - Features: `IMAGE_PROPERTIES`, `LABEL_DETECTION`

### Firebase Integration

```javascript
// Community Reports
getCommunityReportsNearLocation(location, radius)
// Returns: Array of recent safety reports within radius
```

---

## 📱 UI Components

### Search Bar
- **Input**: Text field for destination
- **Submit**: Navigate icon button
- **Clear**: X icon when text present
- **Loading**: Spinner when calculating routes

### Route Card
```javascript
┌─────────────────────────────────────┐
│ [8] Route via Main Street           │
│ SAFE                                 │
│                                      │
│ 1.2 km        15 min                │
└─────────────────────────────────────┘
```
- Safety badge (colored circle with score)
- Route name and safety label
- Distance and duration icons

### Navigation Panel
```javascript
┌─────────────────────────────────────┐
│ 500 m          7 min          [X]   │
├─────────────────────────────────────┤
│ [→] Turn right onto Beach Road      │
├─────────────────────────────────────┤
│ [🛡️] Safety: 8/10       [⚠️] SOS   │
└─────────────────────────────────────┘
```
- Distance/time remaining
- Current instruction with icon
- Safety indicator and SOS button

---

## 🧪 Testing Guide

### Manual Testing

1. **Route Calculation Test**
   ```
   ✓ Enter destination "NITK Beach"
   ✓ Verify 3 routes appear
   ✓ Check safety scores are different
   ✓ Confirm routes are color-coded
   ```

2. **Safety Analysis Test**
   ```
   ✓ Verify scores range 1-10
   ✓ Check daytime routes score higher than nighttime
   ✓ Confirm routes with safe spots score higher
   ✓ Verify community reports affect scores
   ```

3. **Navigation Test**
   ```
   ✓ Select a route
   ✓ Start navigation
   ✓ Verify instruction appears
   ✓ Simulate location change
   ✓ Check step auto-advances
   ✓ Confirm arrival notification
   ```

4. **Edge Cases**
   ```
   ✓ Empty destination → Shows error
   ✓ Invalid address → Shows error alert
   ✓ No GPS signal → Shows "Waiting for GPS"
   ✓ No routes found → Error message
   ✓ Network error → Graceful fallback
   ```

### Automated Testing

```javascript
// Example test cases
describe('MapScreen', () => {
  test('calculates routes when destination entered', async () => {
    // Mock user location and destination
    // Call calculateRoutes()
    // Verify routes state populated
  });
  
  test('assigns safety scores to routes', async () => {
    // Mock route data
    // Call calculateSafetyScore()
    // Verify score between 1-10
  });
  
  test('navigates through steps correctly', async () => {
    // Start navigation
    // Simulate location updates
    // Verify currentStepIndex increments
  });
});
```

---

## 🔒 Safety Score Algorithm

### Calculation Formula

```javascript
totalScore = BASE_SCORE (5)
  + (lightingScore * 0.30)
  + (footTrafficScore * 0.25)
  + (timeOfDayScore * 0.20)
  + (safeSpotScore * 0.15)
  + (communityScore * 0.10)

finalScore = clamp(totalScore, 1, 10)
```

### Factor Ranges

```javascript
lightingScore:      -3 to +3  (Street View analysis)
footTrafficScore:   -2 to +2  (Density estimation)
timeOfDayScore:     -2 to +2  (Day/night bonus/penalty)
safeSpotScore:       0 to +2  (Proximity to safe spots)
communityScore:     -3 to  0  (Recent safety reports)
```

### Example Calculation

**Route A (Daytime, Well-lit Main Street)**
```
Base:           5.0
Lighting:      +2.1 * 0.30 = +0.63
Foot Traffic:  +2.0 * 0.25 = +0.50
Time of Day:   +2.0 * 0.20 = +0.40
Safe Spots:    +1.5 * 0.15 = +0.23
Community:     -0.5 * 0.10 = -0.05
─────────────────────────────
Total:          6.71 → 7 (MODERATE)
```

**Route B (Nighttime, Poorly-lit Back Alley)**
```
Base:           5.0
Lighting:      -2.5 * 0.30 = -0.75
Foot Traffic:  -1.0 * 0.25 = -0.25
Time of Day:   -2.0 * 0.20 = -0.40
Safe Spots:    +0.5 * 0.15 = +0.08
Community:     -2.0 * 0.10 = -0.20
─────────────────────────────
Total:          1.48 → 1 (UNSAFE)
```

---

## 🎨 Styling Constants

```javascript
// Colors
SAFE_GREEN:     '#10B981'
MODERATE_ORANGE: '#FFA500'
UNSAFE_RED:     '#EF4444'
PRIMARY_BLUE:   '#3B82F6'

// Map Markers
USER_MARKER:        Blue pulsing dot (size 10)
DESTINATION_MARKER: Red circle (size 12)
HOSPITAL_MARKER:    Red cross (size 32)
POLICE_MARKER:      Blue shield (size 32)

// Route Lines
DEFAULT_STROKE:    6px
SELECTED_STROKE:   8px
NAVIGATION_STROKE: 10px
```

---

## 📊 Performance Optimization

### Caching Strategy
```javascript
// Route data cached for 1 hour
cacheKey: `route_${origin}_${destination}_walking`
cacheDuration: 3600000 // 1 hour

// Safe spots cached for 24 hours
cacheKey: `safe_spots_${location}_${radius}_${type}`
cacheDuration: 86400000 // 24 hours
```

### Sampling for Analysis
```javascript
// Instead of analyzing entire route (1000+ points)
// Sample 5 points evenly distributed
samplePoints = sampleRoutePoints(coordinates, 5)
// Reduces API calls by 99.5%
```

### Async Operations
```javascript
// Parallel safety analysis for all routes
const routesWithSafety = await Promise.all(
  routesData.map(route => analyzeSafety(route))
);
// 3x faster than sequential analysis
```

---

## 🐛 Troubleshooting

### Common Issues

**1. "No routes found"**
- Check GPS location is available
- Verify destination is valid address
- Confirm Google Maps API key is set in `.env`
- Check internet connection

**2. Safety scores all showing 5**
- Verify Cloud Vision API key configured
- Check Street View available for location
- Confirm community reports loading from Firebase

**3. Map not loading**
- Check `GOOGLE_MAPS_API_KEY` in `.env`
- Verify WebView permissions
- Clear app cache and restart

**4. Navigation not auto-advancing**
- Ensure GPS location updates working
- Check `currentStepIndex` incrementing
- Verify distance threshold (20m) appropriate

**5. Routes not color-coded**
- Check safety scores calculated correctly
- Verify `getSafetyColor()` function
- Confirm polyline colors set in WebView

---

## 🚀 Future Enhancements

### Planned Features

1. **Voice Navigation**
   - Text-to-speech turn announcements
   - Voice command integration
   - "Arriving in 200 meters" alerts

2. **Advanced Safety Analysis**
   - Crime statistics integration
   - Real-time incident data
   - User behavior patterns (ML model)

3. **Offline Mode**
   - Download maps for offline use
   - Cached route data
   - Fallback safety scores

4. **Route Customization**
   - Avoid stairs/slopes (accessibility)
   - Prefer well-lit streets (night mode)
   - Shortest vs safest toggle

5. **Social Features**
   - Share ETA with emergency contacts
   - Real-time location sharing
   - "Walk with me" buddy system

6. **AR Navigation**
   - Augmented reality arrows
   - Street-level guidance
   - Points of interest overlay

---

## 📚 Code Examples

### Calculate Routes
```javascript
const calculateRoutes = async () => {
  // 1. Geocode destination
  const destCoords = await geocodeAddress(destination);
  
  // 2. Get 3 walking routes
  const routes = await getRoutes(userLocation, destCoords, 'walking');
  
  // 3. Analyze safety for each route
  const routesWithSafety = await Promise.all(
    routes.map(async (route) => {
      const reports = await getCommunityReportsNearLocation(route.coordinates[0], 1000);
      const safety = await calculateSafetyScore(route, reports);
      return { ...route, safety, color: getSafetyColor(safety.score) };
    })
  );
  
  // 4. Sort by safety (safest first)
  routesWithSafety.sort((a, b) => b.safety.score - a.safety.score);
  
  setRoutes(routesWithSafety);
};
```

### Start Navigation
```javascript
const startNavigation = () => {
  setIsNavigating(true);
  setCurrentStepIndex(0);
  
  // Initialize stats
  setNavigationStats({
    distanceRemaining: selectedRoute.distance.value,
    timeRemaining: selectedRoute.duration.value,
    currentInstruction: selectedRoute.steps[0].html_instructions,
  });
  
  // Update map
  webViewRef.current.postMessage(JSON.stringify({
    type: 'START_NAVIGATION',
    route: selectedRoute,
  }));
};
```

### Track Progress
```javascript
const checkNavigationProgress = (currentLocation) => {
  const currentStep = selectedRoute.steps[currentStepIndex];
  const distanceToStepEnd = calculateDistance(
    currentLocation,
    currentStep.end_location
  );
  
  // If within 20m of step end, advance
  if (distanceToStepEnd < 20 && currentStepIndex < steps.length - 1) {
    setCurrentStepIndex(prev => prev + 1);
  }
  
  // If last step complete, arrive
  if (currentStepIndex === steps.length - 1 && distanceToStepEnd < 20) {
    completeNavigation();
  }
};
```

---

## 🔐 Environment Variables

Required in `.env` file:

```bash
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
GOOGLE_CLOUD_VISION_API_KEY=your_cloud_vision_api_key
```

### API Key Setup

1. **Google Maps API Key**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Enable: Maps JavaScript API, Directions API, Places API, Geocoding API
   - Create API key
   - Restrict to your app bundle ID

2. **Cloud Vision API Key**
   - Enable Cloud Vision API in same project
   - Use same API key or create separate one
   - Enable Image Analysis features

---

## 📄 License

MIT License - SafeRoute Team

---

## 👥 Support

For issues or questions:
- GitHub Issues: [SafeRoute Issues](https://github.com/chethankotian2005/SafeRoute/issues)
- Email: support@saferoute.app
- Documentation: See `/docs` folder

---

**Built with ❤️ for safer communities**
