# Quick Setup Guide - Street View Preview Feature

## Prerequisites
- Existing SafeRoute app with Google Maps integration
- Google Cloud Platform account with billing enabled
- React Native development environment set up

## Step-by-Step Setup (5 minutes)

### 1. Enable Required Google Cloud APIs

Visit [Google Cloud Console](https://console.cloud.google.com/)

Enable these APIs for your project:
1. **Street View Static API**
   - Go to APIs & Services → Library
   - Search "Street View Static API"
   - Click Enable

2. **Cloud Vision API**
   - Search "Cloud Vision API"
   - Click Enable

3. Verify billing is enabled (required for these APIs)

### 2. Get API Keys

#### Option A: Use Existing Maps API Key
Your existing `GOOGLE_MAPS_API_KEY` can work for Street View if you enable the API.

#### Option B: Create Separate Keys (Recommended for Security)
1. Go to APIs & Services → Credentials
2. Create API Key for Street View Static API
3. Create API Key for Cloud Vision API
4. Restrict keys by:
   - HTTP referrers (web)
   - Android/iOS app (mobile)
   - Specific APIs only

### 3. Update Environment Variables

Edit your `.env` file:
```bash
# Add or update these lines
GOOGLE_MAPS_API_KEY=your_existing_or_new_maps_key
GOOGLE_CLOUD_VISION_API_KEY=your_vision_api_key_here
```

**Important**: The Vision API key must be different from your Maps key for security.

### 4. Install Dependencies

Already done! Dependencies were installed:
```bash
npm install react-native-fast-image
```

Other required packages (already in package.json):
- `react-native-gesture-handler` ✓
- `react-native-svg` ✓
- `react-native-modal` ✓

### 5. Test the Feature

1. **Start the app**:
   ```bash
   npm start
   ```

2. **Navigate to Map Screen**:
   - Open the app
   - Go to Navigation/Map screen
   - Search for a destination
   - Select a route

3. **Preview Should Appear**:
   - Loading indicator shows progress
   - Street View images load
   - AI analysis runs
   - Safety overlays appear
   - Overall safety score displays

### 6. Verify It's Working

Check the preview shows:
- ✓ Street View images (carousel)
- ✓ Safety score badge (colored circle with number)
- ✓ Lighting indicator (☀️/🌤/🌙)
- ✓ Feature icons (💡🚶👥)
- ✓ Dot navigation
- ✓ Comfort rating buttons

## Troubleshooting First Run

### "No Street View imagery available"
**Solution**: Try a different location/route. Not all areas have Street View coverage.

### Images not loading
**Checklist**:
- [ ] Internet connection active
- [ ] API keys correct in `.env`
- [ ] Street View Static API enabled in Cloud Console
- [ ] Billing enabled on Google Cloud account

### AI Analysis failing
**Checklist**:
- [ ] Vision API enabled
- [ ] Vision API key correct
- [ ] Billing enabled
- [ ] API quota not exceeded

### Preview not appearing
**Check**:
1. Console logs for errors
2. Route has valid coordinates
3. `showPreview` state is true
4. Modal component rendered

## Test with Known Good Location

Use this test route (San Francisco):
```javascript
const testRoute = [
  { latitude: 37.7749, longitude: -122.4194 },  // San Francisco
  { latitude: 37.7849, longitude: -122.4094 },
  { latitude: 37.7949, longitude: -122.3994 },
];
```

This area has excellent Street View coverage and should work reliably.

## API Cost Estimation

### Free Tier
- Street View Static API: $200/month free credit
- Cloud Vision API: First 1,000 units/month free

### Per Preview Cost (after free tier)
- ~$0.08 per route preview (8 images)
- Caching reduces repeat costs significantly

### Monthly Cost Examples
- **100 previews/month**: ~$8
- **500 previews/month**: ~$40
- **1,000 previews/month**: ~$80

**Note**: Actual costs vary. Monitor in GCP Console.

## Configuration Options

### Reduce API Costs

In your code, adjust sampling:
```javascript
// src/hooks/useStreetViewPreview.js
const {
  preview,
  loading,
  generatePreview,
} = useStreetViewPreview(routeCoordinates, {
  samplingDistance: 300,  // More distance = fewer images
  maxPoints: 5,           // Reduce from 10 to 5
  timeout: 20000,         // Shorter timeout
});
```

### Disable Feature Temporarily

In `MapScreen.jsx`, comment out preview trigger:
```javascript
const handleRouteSelect = (index) => {
  setSelectedRouteIndex(index);
  setRouteInfo(routes[index]);
  
  // TEMPORARILY DISABLED
  // if (routes[index] && routes[index].coordinates) {
  //   setPreviewRouteCoords(routes[index].coordinates);
  //   setShowPreview(true);
  //   generatePreview(routes[index].coordinates);
  // }
};
```

## Optional: Add Settings Toggle

To let users enable/disable previews:

1. **Add to Settings Screen**:
```javascript
// src/screens/SettingsScreen.jsx
const [enablePreviews, setEnablePreviews] = useState(true);

<Switch
  value={enablePreviews}
  onValueChange={setEnablePreviews}
/>
```

2. **Store in AsyncStorage**:
```javascript
await AsyncStorage.setItem('enable_previews', enablePreviews.toString());
```

3. **Check in MapScreen**:
```javascript
const handleRouteSelect = async (index) => {
  const enabled = await AsyncStorage.getItem('enable_previews');
  if (enabled === 'false') return;
  
  // Show preview...
};
```

## Next Steps

After basic setup works:

1. **Monitor Costs**: Check GCP Console daily at first
2. **Adjust Sampling**: Optimize for your use case
3. **User Testing**: Get feedback on preview usefulness
4. **Cache Analysis**: Check hit rates in console logs
5. **Feature Iteration**: Add custom safety factors

## Getting Help

### Check Logs
```javascript
// Look for these in console:
"Using cached preview"           // Good - saving API calls
"Analyzing segment X of Y"       // AI analysis running
"Street View not available"      // Normal for some areas
"Error generating preview"       // Check API keys/billing
```

### Common Error Messages

| Error | Solution |
|-------|----------|
| "API key invalid" | Check `.env` file, restart app |
| "Billing not enabled" | Enable billing in GCP Console |
| "Quota exceeded" | Wait or increase quotas |
| "Network error" | Check internet connection |

## Production Checklist

Before deploying to users:

- [ ] API keys restricted by platform
- [ ] Billing alerts set in GCP ($10, $50, $100)
- [ ] Caching working (check logs)
- [ ] Error handling tested
- [ ] User feedback collection active
- [ ] Analytics tracking preview usage
- [ ] Settings toggle implemented
- [ ] Privacy policy updated (if needed)

## Success Metrics

Track these to measure feature value:

- Preview completion rate
- User comfort ratings distribution
- Alternative route requests
- Navigation start after preview
- Cache hit rate
- Average API cost per user

---

## Ready to Test!

You're all set! The feature should work once you:
1. ✓ Enable APIs in Google Cloud
2. ✓ Add API keys to `.env`
3. ✓ Restart the app
4. ✓ Select a route in a Street View-covered area

**First Test**: Try searching for a route in a major city (San Francisco, New York, London) where Street View coverage is guaranteed.

Need help? Check `STREET_VIEW_PREVIEW_GUIDE.md` for detailed documentation.
