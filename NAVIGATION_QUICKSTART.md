# 🚀 Quick Start Guide - AI Navigation System

## How to Use

### 1. Search for Destination
```
1. Tap the search bar at top
2. Type destination name (e.g., "Beach", "Hospital")
3. Select from suggestions
4. Wait for routes to calculate (~3 seconds)
```

### 2. Choose Your Route
```
Three options displayed:
🟢 Safest   - Residential areas, well-lit, safe spots nearby
🔵 Fastest  - Direct path, main roads
🟠 Balanced - Good balance of safety and speed

Tap any card to switch routes
```

### 3. Check Safety Score
```
Safety Breakdown shows:
💡 Lighting       - Time-based visibility
👥 Foot Traffic   - Pedestrian activity
🏥 Safe Spots     - Nearby hospitals/police
📊 Community      - Recent incident reports

Overall Score: Weighted average (1-10)
```

### 4. Start Navigation
```
1. Review selected route
2. Tap "Start Navigation" button
3. Grant location permissions
4. Follow turn-by-turn instructions
```

### 5. During Navigation
```
Navigation Banner Shows:
- Distance to next turn (e.g., "250 m")
- Turn instruction (e.g., "Turn right")
- Maneuver icon
- Stop button

Updates every 2 seconds
New instruction when < 50m to turn
```

### 6. If You Go Off Route
```
Alert: "You are off the route"
Options:
- Continue (keep original route)
- Recalculate (new route from current location)
```

---

## Testing the System

### Quick Test (5 minutes)
```bash
1. Open Navigate screen
2. Search "NITK Beach" (or any location)
3. Wait for 3 routes
4. Tap each route card to see differences
5. Check safety breakdown
6. Tap "Start Navigation"
7. Walk 20 meters
8. Watch instruction update
9. Tap "Stop Navigation"
```

### Full Test (15 minutes)
```bash
1. Search real destination
2. Compare all 3 routes
3. Select safest route
4. Start navigation
5. Follow instructions for 5 minutes
6. Intentionally go off route
7. Test recalculation
8. Complete journey
```

---

## Key Features

### ✅ What Works
- Real-time location tracking
- Google Places search
- 3 walking route alternatives
- AI safety scoring (5 factors)
- Color-coded routes
- Turn-by-turn navigation
- Route deviation alerts
- Auto-arrival detection
- Community safety reports
- Time-based scoring

### 🎯 How Safety Works
```
Score Calculation:
= (Lighting × 25%)
+ (Traffic × 20%)
+ (Safe Spots × 20%)
+ (Community × 20%)
+ (Crime × 15%)

8-10  = Green (SAFE)
6-7.9 = Orange (MODERATE)
< 6   = Red (CAUTION)
```

---

## Troubleshooting

### Routes not showing?
- Check internet connection
- Verify Google Maps API key in .env
- Check destination is valid

### Location not updating?
- Grant location permissions
- Enable GPS on device
- Check Location.Accuracy.BestForNavigation

### Safety score seems wrong?
- Lighting score changes with time of day
- Community score based on Firebase reports
- Check if reports exist in database

---

## Files to Check

```
Services:
- src/services/safetyAnalysisService.js
- src/services/navigationService.js

Screen:
- src/screens/NavigateScreen.jsx

Database:
- Firebase: /safety_reports (community data)
```

---

## API Keys Required

```env
GOOGLE_MAPS_API_KEY=your_key_here

APIs Enabled:
- Maps JavaScript API
- Directions API
- Places API
- Geocoding API
```

---

## Common Issues

**Issue:** "Failed to calculate routes"
**Fix:** Check API key, internet connection

**Issue:** Navigation not starting
**Fix:** Grant location permissions

**Issue:** Map not displaying
**Fix:** Verify GOOGLE_MAPS_API_KEY in .env

**Issue:** No safety alerts
**Fix:** Add test data to Firebase /safety_reports

---

## Next Steps

1. Test with real walking routes
2. Add sample safety reports to Firebase
3. Try at different times (day/night scoring)
4. Test route deviation
5. Try all 3 route types

---

**Everything is ready to use! Just search, select, and navigate! 🎉**
