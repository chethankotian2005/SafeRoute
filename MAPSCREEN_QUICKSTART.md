# MapScreen Quick Start Guide

## 🚀 Getting Started

### Prerequisites

1. **Environment Setup**
   ```bash
   # Ensure .env file has required API keys
   GOOGLE_MAPS_API_KEY=your_key_here
   GOOGLE_CLOUD_VISION_API_KEY=your_key_here
   ```

2. **Install Dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Enable Location Services**
   - iOS: Settings → Privacy → Location Services → SafeRoute → "While Using"
   - Android: Settings → Apps → SafeRoute → Permissions → Location → Allow

---

## 📱 Testing the MapScreen

### Test 1: Basic Route Calculation

1. Open SafeRoute app
2. Navigate to **Map** tab (bottom navigation)
3. Enter destination: `NITK Beach` or any nearby location
4. Tap the navigate button (blue circle with arrow)
5. **Expected Result**:
   - Loading spinner appears
   - Map zooms to show 3 routes
   - Route list panel slides up from bottom
   - Routes are color-coded (green/orange/red)
   - Each route shows safety score, distance, time

### Test 2: Safety Score Verification

Compare the 3 routes and verify:
- ✅ Scores are between 1-10
- ✅ Each route has different color based on score:
  - Green (8-10) = SAFE
  - Orange (5-7) = MODERATE
  - Red (1-4) = UNSAFE
- ✅ Routes are sorted by safety (safest first)
- ✅ Safety badges show numeric scores

### Test 3: Route Selection

1. Tap on different route cards
2. **Expected Result**:
   - Selected route highlighted on map (thicker line)
   - Route card shows blue border
   - Other routes become semi-transparent

### Test 4: Navigation Start

1. Select a route (tap route card)
2. Tap **"Start Navigation"** button
3. **Expected Result**:
   - Route list panel disappears
   - Navigation panel appears at bottom
   - Shows: distance remaining, time, current instruction
   - Map zooms to user location
   - Only selected route visible on map

### Test 5: Navigation Progress

**Simulated Testing** (without walking):
1. Start navigation
2. Watch navigation panel for:
   - Distance remaining updates
   - Time remaining updates
   - Current instruction text
   - Safety indicator (colored badge)
   - SOS button present

**Real-world Testing** (recommended):
1. Start navigation for nearby destination
2. Walk along the route
3. **Expected Result**:
   - Map follows your movement
   - Instructions auto-update when reaching waypoints
   - Distance/time counts down
   - Arrival alert when destination reached

### Test 6: Emergency Features

1. During navigation, tap **SOS** button
2. **Expected Result**:
   - Navigates to SOS screen
   - Location captured for emergency

---

## 🧪 Test Scenarios

### Scenario A: Morning Commute
```
Time: 8:00 AM (Daytime)
Destination: Your office/college
Expected: Higher safety scores (daytime bonus)
```

### Scenario B: Late Night Return
```
Time: 10:00 PM (Nighttime)
Destination: Home
Expected: Lower safety scores (nighttime penalty)
Alert: App should recommend safest route
```

### Scenario C: Unknown Area
```
Destination: Tourist spot in new city
Expected: Safety analysis helps choose route
Safe spots (hospitals, police) marked on map
```

### Scenario D: Multiple Route Options
```
Destination: Location 2-3 km away
Expected: 3 distinct routes with different characteristics
- Highway route (faster, less safe)
- Main street route (balanced)
- Residential route (slower, safer)
```

---

## ✅ Verification Checklist

### UI Elements
- [ ] Search bar appears at top
- [ ] Map loads with user location (blue dot)
- [ ] Destination input accepts text
- [ ] Go button (blue circle) visible
- [ ] Route cards display correctly
- [ ] Safety badges show scores
- [ ] Distance and time icons present
- [ ] Navigation panel formatted properly
- [ ] SOS button accessible

### Functionality
- [ ] GPS location detected automatically
- [ ] Destination geocoding works
- [ ] 3 routes calculated
- [ ] Safety scores assigned (1-10)
- [ ] Routes sorted by safety
- [ ] Color coding matches scores
- [ ] Route selection highlights route
- [ ] Navigation starts correctly
- [ ] Instructions update during movement
- [ ] Arrival detected and notified

### Safety Features
- [ ] Safety scores visible on route cards
- [ ] Color coding intuitive (green=safe, red=unsafe)
- [ ] Safety breakdown shows factors
- [ ] Community reports considered
- [ ] Safe spots marked on map
- [ ] SOS quick access available

---

## 🐛 Common Issues & Fixes

### Issue 1: Map Not Loading
**Symptoms**: White screen where map should be
**Fixes**:
1. Check internet connection
2. Verify `GOOGLE_MAPS_API_KEY` in `.env`
3. Restart app
4. Clear cache: `npx expo start -c`

### Issue 2: No Routes Found
**Symptoms**: Error "Could not find routes"
**Fixes**:
1. Check destination address is valid
2. Ensure GPS location obtained
3. Verify internet connection
4. Try different destination

### Issue 3: Safety Scores All Same
**Symptoms**: All routes show score of 5
**Fixes**:
1. Check `GOOGLE_CLOUD_VISION_API_KEY` set
2. Verify Firebase configured
3. Wait for analysis to complete (may take 10-15 seconds)
4. Check Street View available for your area

### Issue 4: Location Not Updating
**Symptoms**: Blue dot doesn't move
**Fixes**:
1. Enable location permissions
2. Go to device settings → Location → High accuracy
3. Restart app
4. Test outdoors (better GPS signal)

### Issue 5: Navigation Not Auto-Advancing
**Symptoms**: Stuck on same instruction
**Fixes**:
1. Walk closer to waypoint (within 20 meters)
2. Check GPS accuracy (need < 20m accuracy)
3. Try outdoor location for better signal

---

## 📊 Expected Performance

### Loading Times
- Initial map load: 2-3 seconds
- Route calculation: 3-5 seconds
- Safety analysis: 5-10 seconds (3 routes)
- Navigation start: Instant

### GPS Accuracy
- Minimum required: 50 meters
- Recommended: < 20 meters
- Urban areas: 10-30 meters
- Open areas: 5-10 meters

### Battery Usage
- Map + GPS active: ~10-15% per hour
- Navigation mode: ~15-20% per hour
- Background tracking: ~5% per hour

---

## 🎯 Success Criteria

Your MapScreen implementation is working correctly if:

✅ **Core Functionality**
1. Calculates 3 walking routes for any valid destination
2. Displays routes on Google Maps
3. Assigns safety scores (1-10) to each route
4. Color-codes routes (green/orange/red)
5. Provides turn-by-turn navigation

✅ **Safety Analysis**
1. Considers multiple factors (lighting, traffic, time, safe spots, reports)
2. Scores vary based on route characteristics
3. Daytime routes score higher than nighttime
4. Routes with safe spots nearby score higher
5. Community reports affect scores appropriately

✅ **User Experience**
1. Interface is intuitive and responsive
2. Loading states shown during calculations
3. Error messages are clear and helpful
4. Navigation instructions are easy to follow
5. Map smoothly follows user location

✅ **Real-World Validation**
1. Successfully navigate to nearby destination
2. Instructions match actual route
3. Arrival detection works accurately
4. Battery usage is acceptable
5. App performs well in various conditions (day/night, urban/rural)

---

## 📝 Testing Log Template

Use this template to document your testing:

```
Date: _______________
Tester: _______________

TEST 1: Route Calculation
Destination: _______________
Routes Found: ___ / 3
Safety Scores: Route1:___ Route2:___ Route3:___
Colors Correct: ☐ Yes ☐ No
Notes: ___________________________________

TEST 2: Navigation
Route Selected: _______________
Navigation Started: ☐ Yes ☐ No
Instructions Clear: ☐ Yes ☐ No
Auto-Advance Works: ☐ Yes ☐ No
Arrival Detected: ☐ Yes ☐ No
Notes: ___________________________________

TEST 3: Safety Features
Safety Scores Vary: ☐ Yes ☐ No
Time of Day Affects Score: ☐ Yes ☐ No
Safe Spots Visible: ☐ Yes ☐ No
Community Reports Loaded: ☐ Yes ☐ No
SOS Accessible: ☐ Yes ☐ No
Notes: ___________________________________

OVERALL RATING: ☐ Pass ☐ Fail ☐ Needs Improvement
ISSUES FOUND: ___________________________________
SUGGESTIONS: ___________________________________
```

---

## 🎓 Advanced Testing

### Test Safety Score Algorithm

**Daytime Test (Should score higher)**
```
Time: 10:00 AM
Route: Main street with shops
Expected Factors:
- Daytime bonus: +2
- Foot traffic: +1 to +2
- Safe spots: +1 to +2
Expected Score: 7-9 (SAFE/MODERATE)
```

**Nighttime Test (Should score lower)**
```
Time: 11:00 PM
Route: Same main street
Expected Factors:
- Nighttime penalty: -2
- Foot traffic: -1
- Lighting may vary
Expected Score: 3-6 (MODERATE/UNSAFE)
```

### Test Edge Cases

1. **Very short distance** (< 100m)
   - Should still calculate routes
   - May show only 1-2 alternatives

2. **Very long distance** (> 10km)
   - Should suggest transit instead
   - Walking routes may be impractical

3. **No internet connection**
   - Should show error message
   - Should not crash

4. **Invalid destination**
   - Should show "Address not found" error
   - Should allow retry

5. **Denied location permission**
   - Should show permission request
   - Should explain why needed

---

## 📞 Support

If you encounter issues not covered here:

1. Check main documentation: `MAPSCREEN_DOCUMENTATION.md`
2. Review troubleshooting section
3. Check Firebase console for errors
4. Verify all API keys are valid
5. Test with different destination/time

For persistent issues, provide:
- Device model and OS version
- App version
- Steps to reproduce
- Screenshots/screen recording
- Console logs (if available)

---

**Happy Testing! 🎉**

Remember: Safety first - always test navigation features in safe environments before relying on them in unfamiliar areas.
