# QUICK FIX - Minimal Working Map

Replace the `getMapHTML` function in MapScreen.jsx with this MINIMAL version that is guaranteed to work:

```javascript
const getMapHTML = () => {
  const initialLat = userLocation?.latitude || 13.3409;
  const initialLng = userLocation?.longitude || 74.7421;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    * { margin: 0; padding: 0; }
    html, body, #map { height: 100%; width: 100%; }
  </style>
</head>
<body>
  <div id="map"></div>
  
  <script>
    function initMap() {
      const map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: ${initialLat}, lng: ${initialLng} },
        zoom: 15
      });
      
      new google.maps.Marker({
        position: { lat: ${initialLat}, lng: ${initialLng} },
        map: map,
        title: 'You are here'
      });
      
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'MAP_READY'
        }));
      }
    }
  </script>
  <script src="https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&callback=initMap" async defer></script>
</body>
</html>
`;
};
```

This is the ABSOLUTE MINIMUM code needed to show a working Google Map.
