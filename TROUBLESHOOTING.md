# Street View Preview - Troubleshooting Guide

## Common Issues & Solutions

### 🚫 Issue: Preview Not Appearing

#### Symptoms
- Route selected but no preview modal shows
- No loading indicator appears
- MapScreen doesn't show preview

#### Diagnostic Steps
```javascript
// Check in MapScreen.jsx
console.log('Route selected:', routes[index]);
console.log('Show preview state:', showPreview);
console.log('Route coordinates:', routes[index]?.coordinates);
```

#### Solutions

**1. Check Route Has Coordinates**
```javascript
// In MapScreen.jsx handleRouteSelect
if (routes[index] && routes[index].coordinates) {
  console.log('✓ Route has coordinates');
  setPreviewRouteCoords(routes[index].coordinates);
  setShowPreview(true);
} else {
  console.log('✗ No coordinates found');
}
```

**2. Verify Modal Visibility**
```javascript
// Ensure StreetViewPreview is rendered
<StreetViewPreview
  visible={showPreview}  // Should be true
  preview={preview}
  // ... other props
/>
```

**3. Check State Updates**
```javascript
// Add logging in useState
const [showPreview, setShowPreview] = useState(false);
console.log('showPreview changed to:', showPreview);
```

---

### 🖼️ Issue: Images Not Loading

#### Symptoms
- Preview shows but images are blank
- "No Street View imagery available" message
- Images show broken image icon

#### Diagnostic Steps
```javascript
// Check console for:
"Street View not available at point X"
"Error fetching image: [error message]"
"API key invalid"
```

#### Solutions

**1. Verify API Key**
```bash
# Check .env file
GOOGLE_MAPS_API_KEY=your_actual_key_here  # Not placeholder

# Restart app after changing .env
npm start
```

**2. Check Street View API Enabled**
- Go to [Google Cloud Console](https://console.cloud.google.com)
- Navigate to: APIs & Services → Library
- Search: "Street View Static API"
- Verify status shows "Enabled"
- If not, click "Enable"

**3. Test with Known Good Location**
```javascript
// Use this test route (San Francisco)
const testRoute = [
  { latitude: 37.7749, longitude: -122.4194 },
  { latitude: 37.7849, longitude: -122.4094 },
];
```

**4. Check Network Tab**
```
Open DevTools → Network
Filter by: "googleapis.com"
Look for Street View API calls
Check response codes (should be 200)
```

**5. Verify Image URL Format**
```javascript
// Should look like:
https://maps.googleapis.com/maps/api/streetview?
  size=600x400&
  location=37.7749,-122.4194&
  heading=45&
  pitch=0&
  fov=90&
  key=YOUR_KEY
```

---

### 🤖 Issue: AI Analysis Not Working

#### Symptoms
- Images load but no safety overlays
- Score shows as "Unknown"
- No safety features detected

#### Diagnostic Steps
```javascript
// Check console for:
"Error analyzing image: [message]"
"Vision API error: 403"
"Quota exceeded"
```

#### Solutions

**1. Check Vision API Key**
```bash
# In .env file
GOOGLE_CLOUD_VISION_API_KEY=your_vision_key_here

# Must be DIFFERENT from GOOGLE_MAPS_API_KEY
```

**2. Enable Cloud Vision API**
- Go to Google Cloud Console
- APIs & Services → Library
- Search: "Cloud Vision API"
- Click "Enable"

**3. Check Billing Enabled**
- Cloud Console → Billing
- Verify billing account is linked
- Vision API requires billing

**4. Check API Quota**
```
Cloud Console → IAM & Admin → Quotas
Filter: "Cloud Vision API"
Look for:
- Requests per minute
- Requests per day
Check current usage vs limits
```

**5. Test API Directly**
```bash
# Test with curl
curl -X POST \
  "https://vision.googleapis.com/v1/images:annotate?key=YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "requests": [{
      "image": {"source": {"imageUri": "https://example.com/image.jpg"}},
      "features": [{"type": "LABEL_DETECTION"}]
    }]
  }'
```

---

### ⏱️ Issue: Slow Loading / Timeouts

#### Symptoms
- Preview takes >30 seconds
- Timeout error appears
- Only partial results shown

#### Diagnostic Steps
```javascript
// Check loading progress
console.log('Loading stage:', loadingProgress?.stage);
console.log('Progress:', loadingProgress?.progress);
```

#### Solutions

**1. Reduce Number of Images**
```javascript
// In useStreetViewPreview options
const preview = useStreetViewPreview(coords, {
  maxPoints: 5,           // Reduce from 10
  samplingDistance: 300,  // Increase from 200
});
```

**2. Increase Timeout**
```javascript
const preview = useStreetViewPreview(coords, {
  timeout: 45000,  // Increase to 45 seconds
});
```

**3. Check Network Speed**
```javascript
// Test with single image first
const preview = useStreetViewPreview(coords, {
  maxPoints: 1,  // Just start and end
});
```

**4. Use Cached Previews**
```javascript
// Check if preview is cached
const cached = await getCachedPreview(coords);
if (cached) {
  console.log('Using cache - instant load!');
}
```

**5. Monitor Network Tab**
```
DevTools → Network
Sort by: Time
Identify slow requests
Check for:
- Large image sizes
- Failed requests
- Network throttling
```

---

### 💾 Issue: Caching Not Working

#### Symptoms
- Same route loads slowly every time
- "Using cached preview" never appears in logs
- Cache count always 0

#### Diagnostic Steps
```javascript
// Check cache stats
const count = await getCachedImageCount();
console.log('Cached images:', count);

const cached = await getCachedPreview(routeCoords);
console.log('Cached preview:', cached ? 'Yes' : 'No');
```

#### Solutions

**1. Verify AsyncStorage**
```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Test read/write
await AsyncStorage.setItem('test', 'value');
const value = await AsyncStorage.getItem('test');
console.log('AsyncStorage working:', value === 'value');
```

**2. Check Cache Keys**
```javascript
// View all cache keys
const keys = await AsyncStorage.getAllKeys();
const cacheKeys = keys.filter(k => 
  k.startsWith('streetview_') ||
  k.startsWith('analysis_') ||
  k.startsWith('route_preview_')
);
console.log('Cache keys:', cacheKeys);
```

**3. Clear and Regenerate Cache**
```javascript
// Force cache regeneration
await clearAllPreviewCaches();
await generatePreview(routeCoords);
```

**4. Check Cache Expiry**
```javascript
// In routePreviewService.js
// Cached previews expire after 24 hours
const cacheAge = Date.now() - new Date(preview.metadata.generatedAt).getTime();
const isValid = cacheAge < 24 * 60 * 60 * 1000;
```

---

### 🎨 Issue: Visual Overlays Missing

#### Symptoms
- Images load but no colored overlays
- No safety icons visible
- No score badge shown

#### Diagnostic Steps
```javascript
// Check if analysis exists
console.log('Analysis:', preview?.sampledPoints[0]?.analysis);
console.log('Safety score:', preview?.sampledPoints[0]?.analysis?.safetyScore);
```

#### Solutions

**1. Verify Analysis Data Structure**
```javascript
// Should contain:
{
  analysis: {
    safetyScore: { overall: 7.5, grade: 'Good', color: '#8BC34A' },
    lighting: { score: 8, level: 'bright' },
    sidewalk: { detected: true },
    crowdDensity: { density: 'moderate' },
    isolation: { isolated: false },
  }
}
```

**2. Check SVG Rendering**
```javascript
// In SafetyOverlay.jsx
if (!analysis || analysis.error) {
  console.log('No analysis or error:', analysis?.error);
  return null;
}
```

**3. Verify react-native-svg**
```bash
# Ensure package is installed
npm list react-native-svg

# Should show version (e.g., 13.9.0)
```

**4. Test Overlay Independently**
```javascript
// Test SafetyOverlay with mock data
<SafetyOverlay
  analysis={{
    safetyScore: { overall: 8, grade: 'Good', color: '#4CAF50' },
    lighting: { score: 8, level: 'bright' },
  }}
  width={600}
  height={400}
/>
```

---

### 💰 Issue: Unexpected API Costs

#### Symptoms
- Higher than expected bills
- Many API calls for same route
- Cache not reducing costs

#### Diagnostic Steps
```bash
# Check Google Cloud Console
Billing → Reports
Filter: "Vision API" and "Maps API"
View usage over time
```

#### Solutions

**1. Enable Console Logging**
```javascript
// Track API calls
console.log('Street View API call for:', latitude, longitude);
console.log('Vision API analysis for:', imageUrl);
console.log('Using cached data:', cached ? 'Yes' : 'No');
```

**2. Set Billing Alerts**
```
Cloud Console → Billing → Budgets & alerts
Create budget alerts at:
- $10 (warning)
- $50 (alert)
- $100 (critical)
```

**3. Implement Request Throttling**
```javascript
// Already implemented - verify delays
// Street View: 100ms between calls
// Vision API: 500ms between calls
```

**4. Monitor Cache Hit Rate**
```javascript
let apiCalls = 0;
let cacheHits = 0;

// Increment in service
if (cached) cacheHits++;
else apiCalls++;

console.log('Cache hit rate:', (cacheHits / (apiCalls + cacheHits)) * 100, '%');
```

**5. Optimize Sampling**
```javascript
// Reduce to minimum
const preview = useStreetViewPreview(coords, {
  maxPoints: 3,           // Start, middle, end only
  samplingDistance: 500,  // Fewer samples
});
```

---

### 🔐 Issue: API Key Security

#### Symptoms
- API key exposed in code
- Unauthorized usage
- Quota exceeded unexpectedly

#### Solutions

**1. Use Environment Variables**
```bash
# Always store in .env
GOOGLE_MAPS_API_KEY=your_key

# Never in code:
const API_KEY = "AIza...";  // ❌ DON'T DO THIS
```

**2. Restrict API Keys**
```
Cloud Console → Credentials → Edit Key
Application restrictions:
- Android apps: Add package name + SHA-1
- iOS apps: Add bundle ID
- HTTP referrers: Add website URL

API restrictions:
- Select specific APIs only
```

**3. Monitor Key Usage**
```
Cloud Console → APIs & Services → Credentials
Click on API key
View "Metrics" tab
Check for unusual patterns
```

**4. Rotate Keys Regularly**
```bash
# Every 90 days:
1. Create new API key
2. Update .env with new key
3. Test thoroughly
4. Delete old key
```

---

### 📱 Issue: App Crashes During Preview

#### Symptoms
- App crashes when preview loads
- Memory warnings in console
- App becomes unresponsive

#### Diagnostic Steps
```javascript
// Check memory usage
console.log('Preview size:', JSON.stringify(preview).length);
console.log('Images count:', preview?.sampledPoints?.length);
```

#### Solutions

**1. Reduce Image Quality**
```javascript
// In streetViewService.js
const IMAGE_SIZE = '400x300';  // Reduce from '600x400'
```

**2. Implement Image Pagination**
```javascript
// Load images progressively
const [loadedImages, setLoadedImages] = useState(3);

// Load more on scroll
onScrollEnd={() => setLoadedImages(prev => prev + 3)}
```

**3. Clear Memory Periodically**
```javascript
// Clear old caches
useEffect(() => {
  const clearOld = async () => {
    const keys = await AsyncStorage.getAllKeys();
    const old = keys.filter(/* old cache logic */);
    await AsyncStorage.multiRemove(old);
  };
  clearOld();
}, []);
```

**4. Use Image Compression**
```javascript
// Already using react-native-fast-image
// Ensure it's configured for caching
<FastImage
  source={{ uri: image.url }}
  resizeMode="cover"
  cacheKey={`preview_${image.index}`}
/>
```

---

### 🌍 Issue: No Coverage in Specific Area

#### Symptoms
- "No Street View imagery available"
- Works in some areas but not others
- Rural/new areas have no images

#### Solutions

**1. Check Street View Coverage**
- Visit [Google Maps](https://maps.google.com)
- Look for blue lines (Street View coverage)
- If no blue lines, no coverage available

**2. Use Fallback Preview**
```javascript
// Already implemented in routePreviewService
if (!availability.available) {
  // Falls back to basic preview
  return generateFallbackPreview(coordinates);
}
```

**3. Inform Users**
```javascript
// Show coverage warning
if (noCoverageCount > totalPoints * 0.5) {
  Alert.alert(
    'Limited Coverage',
    'Street View is not available for most of this route. Preview may be limited.'
  );
}
```

**4. Alternative Route Suggestion**
```javascript
// Suggest routes with better coverage
const routesWithCoverage = routes.filter(route => 
  route.streetViewCoverage > 70  // 70% coverage
);
```

---

## Getting Additional Help

### Debug Mode

Enable detailed logging:
```javascript
// Add to .env
DEBUG_STREET_VIEW=true

// Use in services
if (process.env.DEBUG_STREET_VIEW) {
  console.log('[DEBUG]', ...args);
}
```

### Collect Diagnostics
```javascript
const diagnostics = {
  apiKeysConfigured: !!(GOOGLE_MAPS_API_KEY && GOOGLE_CLOUD_VISION_API_KEY),
  cacheSize: await getCachedImageCount(),
  lastError: error?.message,
  routeInfo: {
    pointCount: routeCoordinates?.length,
    sampledPoints: sampledPoints?.length,
  },
  deviceInfo: {
    platform: Platform.OS,
    version: Platform.Version,
  },
};
console.log('Diagnostics:', JSON.stringify(diagnostics, null, 2));
```

### Test Checklist
- [ ] API keys in `.env`
- [ ] APIs enabled in Cloud Console
- [ ] Billing enabled
- [ ] Internet connection active
- [ ] App restarted after .env changes
- [ ] Test with known good location
- [ ] Check console for errors
- [ ] Verify cache is working
- [ ] Monitor API usage
- [ ] Check memory usage

### Report Issues

Include in your report:
1. Error message (exact text)
2. Console logs
3. Route coordinates (if relevant)
4. Device/platform info
5. Steps to reproduce
6. Screenshots/screen recording
7. Diagnostics output

---

## Prevention Tips

### Before Production
- Set up billing alerts
- Test with various routes
- Monitor API costs daily (first week)
- Implement analytics
- Get user feedback
- Optimize based on metrics

### Monitoring
```javascript
// Track key metrics
analytics.logEvent('preview_generated', {
  points: sampledPoints.length,
  cached: !!cached,
  loadTime: Date.now() - startTime,
  safetyScore: preview.statistics.overallSafetyScore,
});
```

### Regular Maintenance
- Review API usage monthly
- Update cache expiry as needed
- Optimize sampling parameters
- Clear old caches
- Update documentation
- Rotate API keys (quarterly)

---

**Remember**: Most issues are resolved by:
1. Checking API keys
2. Enabling required APIs
3. Verifying billing is active
4. Restarting the app
5. Testing with a known good location

Still stuck? Review the full guides:
- `STREET_VIEW_PREVIEW_GUIDE.md`
- `STREET_VIEW_SETUP.md`
- `QUICK_REFERENCE.md`
