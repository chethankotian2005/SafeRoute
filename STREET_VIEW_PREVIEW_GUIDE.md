# Smart Street View Preview with AI Safety Analysis

## Overview
The Smart Street View Preview feature provides users with an intelligent, visual preview of their selected route using actual Street View imagery combined with AI-powered safety analysis. This helps users make informed decisions before starting navigation.

## Features

### 🌆 Street View Integration
- Fetches Google Street View images at key points along the route (every 200 meters)
- Automatically calculates optimal camera heading for each point
- Checks image availability before fetching
- Caches images for offline viewing and faster loading

### 🤖 AI Safety Analysis
Uses Google Cloud Vision API to analyze each street view image for:
- **Lighting Quality** - Analyzes brightness and street light presence
- **Sidewalk Presence** - Detects pedestrian walkways
- **Crowd Density** - Counts people for safety through numbers
- **Isolation Level** - Identifies secluded or populated areas
- **Building Types** - Detects commercial vs residential areas

### 📊 Safety Scoring
- Overall route safety score (1-10 scale)
- Grade system: Excellent, Good, Moderate, Fair, Poor
- Detailed breakdown by safety factor
- Problem segment identification
- Color-coded visual indicators

### 🎨 Visual Overlays
- Color-coded safety tints (Green/Yellow/Red)
- Feature icons (lighting, sidewalks, crowds, warnings)
- Safety score badges on each image
- Bottom indicator bars for sidewalk presence
- Lighting quality indicators

### 📱 User Experience
- Swipeable image gallery with smooth transitions
- Dot indicators showing progress
- Fullscreen image viewing
- Loading progress indicators
- Detailed analysis for each segment

### 💬 User Feedback
- Comfort level rating (Comfortable/Uncertain/Uncomfortable)
- Quick thumbs up/down rating
- Alternative route request
- Feedback stored in Firestore for improvements

## Architecture

### Services Layer
```
src/services/
├── streetViewService.js       # Street View API integration
├── imageAnalysisService.js    # Google Cloud Vision AI
└── routePreviewService.js     # Orchestration layer
```

### Components Layer
```
src/components/
├── StreetViewPreview.jsx      # Main preview modal
├── RouteImageGallery.jsx      # Swipeable image carousel
├── SafetyOverlay.jsx          # SVG safety overlays
└── ConfidenceRating.jsx       # User feedback component
```

### Hooks Layer
```
src/hooks/
└── useStreetViewPreview.js    # Preview state management
```

## Setup Instructions

### 1. API Keys Required

Add to your `.env` file:
```bash
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
GOOGLE_CLOUD_VISION_API_KEY=your_cloud_vision_api_key_here
```

### 2. Enable Required APIs

In Google Cloud Console, enable:
- Street View Static API
- Cloud Vision API
- Maps JavaScript API (if not already enabled)

### 3. Dependencies

Already installed:
- `react-native-gesture-handler` - Swipe gestures
- `react-native-svg` - SVG overlays
- `react-native-modal` - Modal component
- `react-native-fast-image` - Image caching

### 4. Firestore Collection

The feature automatically creates a `route_ratings` collection to store user feedback:
```javascript
{
  rating: 'comfortable' | 'uncertain' | 'uncomfortable',
  routeInfo: {
    coordinates: [...],
    safetyScore: 7.5,
    distance: '2.3 km',
    duration: '15 mins'
  },
  timestamp: '2025-10-25T...'
}
```

## Usage

### Automatic Trigger
When a user selects a route in MapScreen, the preview automatically generates:

```javascript
// In MapScreen.jsx
const handleRouteSelect = (index) => {
  setSelectedRouteIndex(index);
  setRouteInfo(routes[index]);
  
  // Triggers preview generation
  if (routes[index] && routes[index].coordinates) {
    setPreviewRouteCoords(routes[index].coordinates);
    setShowPreview(true);
    generatePreview(routes[index].coordinates);
  }
};
```

### Manual Usage
You can also use the hook directly in any component:

```javascript
import { useStreetViewPreview } from '../hooks/useStreetViewPreview';

const MyComponent = () => {
  const routeCoordinates = [...]; // Your route coordinates
  
  const {
    preview,
    loading,
    generatePreview,
    submitRating,
  } = useStreetViewPreview(routeCoordinates);
  
  // Generate preview
  useEffect(() => {
    generatePreview(routeCoordinates);
  }, [routeCoordinates]);
  
  return (
    <StreetViewPreview
      visible={true}
      preview={preview}
      loading={loading}
      onClose={() => {}}
      onStartNavigation={() => {}}
      onRatingSubmit={submitRating}
    />
  );
};
```

## API Integration Details

### Street View Static API
```javascript
// Endpoint format
https://maps.googleapis.com/maps/api/streetview?
  size=600x400&
  location=LAT,LNG&
  heading=DEGREES&
  pitch=0&
  fov=90&
  key=YOUR_API_KEY
```

### Street View Metadata API
```javascript
// Check image availability
https://maps.googleapis.com/maps/api/streetview/metadata?
  location=LAT,LNG&
  key=YOUR_API_KEY
```

### Cloud Vision API
```javascript
// POST to analyze image
POST https://vision.googleapis.com/v1/images:annotate?key=YOUR_API_KEY
{
  "requests": [{
    "image": { "source": { "imageUri": "..." } },
    "features": [
      { "type": "LABEL_DETECTION", "maxResults": 20 },
      { "type": "OBJECT_LOCALIZATION", "maxResults": 20 },
      { "type": "IMAGE_PROPERTIES" }
    ]
  }]
}
```

## Safety Scoring Algorithm

### Weights
```javascript
const WEIGHTS = {
  lighting: 0.30,      // 30% - Most important
  sidewalk: 0.20,      // 20%
  crowdDensity: 0.25,  // 25%
  isolation: 0.15,     // 15%
  buildingType: 0.10,  // 10%
};
```

### Score Calculation
```javascript
overallScore = 
  (lighting × 0.30) +
  (sidewalk × 0.20) +
  (crowdDensity × 0.25) +
  (isolation × 0.15) +
  (buildingType × 0.10)
```

### Grading System
- **Excellent** (7.5-10): Green - Very safe route
- **Good** (6.0-7.5): Light Green - Safe route
- **Moderate** (4.5-6.0): Yellow - Average safety
- **Fair** (3.0-4.5): Orange - Some concerns
- **Poor** (0-3.0): Red - Safety concerns

## Caching Strategy

### Three-Level Cache
1. **Image URLs** - Cached in AsyncStorage by coordinates
2. **AI Analysis** - Cached by image URL
3. **Complete Preview** - Cached by route hash (24-hour expiry)

### Cache Keys
```javascript
// Street View cache
streetview_cache: {
  "LAT,LNG,HEADING": { url, panoId, ... }
}

// Analysis cache
analysis_IMAGE_URL: { safetyScore, lighting, ... }

// Preview cache
route_preview_ROUTE_HASH: { complete preview data }
```

### Cache Management
```javascript
// Clear all caches
await clearAllPreviewCaches();

// Get cache statistics
const count = await getCachedImageCount();
```

## Performance Optimization

### Sampling Strategy
- Maximum 10 preview points per route
- Start and end points always included
- Even distribution along route
- Skips points without Street View coverage

### Timeout Protection
- 30-second maximum generation time
- 3-second timeout per image analysis
- Graceful fallback to basic preview
- Progress indicators throughout

### Rate Limiting
- 100ms delay between Street View requests
- 500ms delay between Vision API calls
- Batch processing where possible

## Error Handling

### Graceful Degradation
1. **No Street View Coverage** - Shows alternative preview
2. **Vision API Quota Exceeded** - Falls back to basic preview
3. **Network Error** - Uses cached data if available
4. **Timeout** - Shows partial results

### User Messaging
```javascript
// Error states handled in StreetViewPreview.jsx
if (!preview || preview.error) {
  return (
    <ErrorView
      message={preview?.error || 'Unable to generate preview'}
      onClose={onClose}
    />
  );
}
```

## Cost Estimation

### API Costs (Google Cloud)
- **Street View Static API**: $7 per 1,000 requests
- **Cloud Vision API**: $1.50 per 1,000 images (Label Detection)
- **Cloud Vision API**: $1.50 per 1,000 images (Object Localization)

### Cost Per Route Preview
Assuming 8 images per route:
- Street View: 8 × $0.007 = $0.056
- Vision API: 8 × $0.003 = $0.024
- **Total**: ~$0.08 per route preview

### Cost Optimization
- Aggressive caching (24-hour validity)
- Limit to 10 images maximum
- Check metadata before fetching
- Reuse cached analyses

## Customization

### Adjust Sampling Distance
```javascript
const preview = useStreetViewPreview(coordinates, {
  samplingDistance: 300, // Meters between samples (default: 200)
  maxPoints: 8,          // Max preview points (default: 10)
  timeout: 45000,        // Timeout in ms (default: 30000)
});
```

### Modify Safety Weights
Edit `src/services/imageAnalysisService.js`:
```javascript
const WEIGHTS = {
  lighting: 0.40,      // Increase lighting importance
  sidewalk: 0.25,
  crowdDensity: 0.20,
  isolation: 0.10,
  buildingType: 0.05,
};
```

### Customize Visual Overlays
Edit `src/components/SafetyOverlay.jsx` to modify:
- Overlay opacity
- Badge design
- Icon styles
- Color schemes

## Testing

### Test with Sample Route
```javascript
const testRoute = [
  { latitude: 13.3409, longitude: 74.7421 },
  { latitude: 13.3419, longitude: 74.7431 },
  { latitude: 13.3429, longitude: 74.7441 },
];

const { generatePreview } = useStreetViewPreview();
await generatePreview(testRoute);
```

### Verify Caching
```javascript
// First load - should take 15-30 seconds
await generatePreview(route);

// Second load - should be instant
await generatePreview(route); // Uses cache
```

### Check API Calls
Monitor Network tab in Chrome DevTools:
- Street View Metadata calls
- Street View Static image loads
- Vision API POST requests

## Troubleshooting

### Preview Not Showing
1. Check API keys in `.env` file
2. Verify APIs are enabled in Google Cloud Console
3. Check console for error messages
4. Ensure route has valid coordinates

### Slow Loading
1. Reduce `samplingDistance` for fewer points
2. Lower `maxPoints` limit
3. Check network connection
4. Verify API quotas not exceeded

### Images Not Loading
1. Check Street View coverage for the area
2. Verify GOOGLE_MAPS_API_KEY is correct
3. Check browser/app has internet access
4. Look for CORS issues (web only)

### AI Analysis Failing
1. Verify GOOGLE_CLOUD_VISION_API_KEY
2. Check Vision API is enabled
3. Verify API quota/billing
4. Check image URLs are publicly accessible

## Future Enhancements

### Planned Features
- [ ] Real-time safety updates based on time of day
- [ ] Historical crime data overlay
- [ ] User-contributed safety ratings
- [ ] Weather condition analysis
- [ ] Accessibility features detection
- [ ] Street View time-of-day comparison
- [ ] Share route preview with contacts
- [ ] Offline map integration
- [ ] Voice narration of safety features
- [ ] AR preview mode

### Performance Improvements
- [ ] Implement WebP image format
- [ ] Progressive image loading
- [ ] Predictive caching for common routes
- [ ] Background preview generation
- [ ] CDN integration for faster delivery

## Contributing

When adding new safety factors:

1. Add detection logic in `imageAnalysisService.js`
2. Update scoring weights
3. Add visual indicators in `SafetyOverlay.jsx`
4. Update documentation
5. Test with various routes

## License

This feature is part of SafeRoute and follows the same MIT license.

## Support

For issues or questions:
- Check the troubleshooting section above
- Review console logs for error details
- Verify API credentials and quotas
- Test with a simpler route first

---

**Note**: This feature requires active Google Cloud Platform billing for production use. Monitor your API usage in the GCP Console to avoid unexpected costs.
