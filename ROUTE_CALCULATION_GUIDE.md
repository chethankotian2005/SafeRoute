# Route Calculation Service - Usage Guide

## Overview
Dedicated service for calculating walking routes using Google Directions API with enhanced features for navigation.

## Features
✅ Multiple alternative routes
✅ Turn-by-turn navigation steps
✅ Detailed distance and duration
✅ Polyline encoding/decoding
✅ Real-time step tracking
✅ Distance calculations
✅ Smart caching (30 minutes)
✅ Error handling

---

## Installation

Service is already created at:
```
src/services/routeCalculationService.js
```

---

## Basic Usage

### 1. Calculate Walking Routes

```javascript
import { calculateWalkingRoutes } from '../services/routeCalculationService';

// Define origin and destination
const origin = { 
  latitude: 13.0100, 
  longitude: 74.7947 
};

const destination = { 
  latitude: 13.0150, 
  longitude: 74.7980 
};

// Calculate routes
const routes = await calculateWalkingRoutes(origin, destination);

console.log(`Found ${routes.length} routes`);
```

### 2. Route Object Structure

Each route contains:

```javascript
{
  id: "route_0",
  routeIndex: 0,
  summary: "NH66",
  
  // Distance info
  distance: {
    value: 7400,           // meters
    text: "7.4 km",
    km: "7.40"
  },
  
  // Duration info
  duration: {
    value: 840,            // seconds
    text: "14 mins",
    minutes: 14
  },
  
  // Geometry
  polyline: "encoded_string",
  coordinates: [
    { latitude: 13.0100, longitude: 74.7947 },
    { latitude: 13.0105, longitude: 74.7950 },
    // ... more points
  ],
  
  // Locations
  startLocation: { latitude: 13.0100, longitude: 74.7947 },
  endLocation: { latitude: 13.0150, longitude: 74.7980 },
  startAddress: "Main Road, Mangalore",
  endAddress: "City Center, Mangalore",
  
  // Navigation steps (see below)
  steps: [...],
  
  // Map bounds
  bounds: {
    northeast: { latitude: 13.0160, longitude: 74.7990 },
    southwest: { latitude: 13.0090, longitude: 74.7940 }
  },
  
  warnings: [],
  copyrights: "Map data ©2025 Google"
}
```

### 3. Navigation Steps

Each step in `route.steps`:

```javascript
{
  stepIndex: 0,
  
  distance: {
    value: 200,            // meters
    text: "200 m"
  },
  
  duration: {
    value: 150,            // seconds
    text: "2 mins"
  },
  
  instruction: "Head west on Main Road",
  htmlInstruction: "Head <b>west</b> on Main Road",
  maneuver: "turn-left",   // or: turn-right, straight, etc.
  
  startLocation: { latitude: 13.0100, longitude: 74.7947 },
  endLocation: { latitude: 13.0105, longitude: 74.7950 },
  
  polyline: "step_encoded_polyline",
  travelMode: "WALKING"
}
```

---

## Advanced Usage

### Calculate Routes with Options

```javascript
const routes = await calculateWalkingRoutes(origin, destination, {
  alternatives: true,      // Get multiple routes
  avoidHighways: true,     // Avoid highways
  avoidTolls: true,        // Avoid tolls
  avoidFerries: true,      // Avoid ferries
});
```

### Display Multiple Routes

```javascript
const routes = await calculateWalkingRoutes(origin, destination);

routes.forEach((route, index) => {
  console.log(`\nRoute ${index + 1}:`);
  console.log(`  Summary: ${route.summary}`);
  console.log(`  Distance: ${route.distance.text}`);
  console.log(`  Duration: ${route.duration.text}`);
  console.log(`  Steps: ${route.steps.length}`);
});
```

Output:
```
Route 1:
  Summary: NH66
  Distance: 7.4 km
  Duration: 14 mins
  Steps: 12

Route 2:
  Summary: City Road
  Distance: 7.8 km
  Duration: 15 mins
  Steps: 15

Route 3:
  Summary: Beach Road
  Distance: 8.1 km
  Duration: 16 mins
  Steps: 18
```

---

## Turn-by-Turn Navigation

### Get Navigation Instructions

```javascript
import { getNextInstruction } from '../services/routeCalculationService';

// Current GPS location
const currentLocation = { 
  latitude: 13.0105, 
  longitude: 74.7950 
};

// Selected route
const selectedRoute = routes[0];

// Get next instruction
const instruction = getNextInstruction(
  currentLocation, 
  selectedRoute.steps,
  20  // 20 meter threshold
);

if (instruction) {
  console.log('Current:', instruction.currentStep.instruction);
  console.log('Distance to step:', instruction.distanceToStep, 'm');
  console.log('Maneuver:', instruction.maneuver);
  console.log('Remaining steps:', instruction.remainingSteps);
  
  if (instruction.nextStep) {
    console.log('Next:', instruction.nextStep.instruction);
  }
}
```

### Track Progress During Navigation

```javascript
import { findClosestStep } from '../services/routeCalculationService';

// Update every second
setInterval(() => {
  const currentLocation = getCurrentGPSLocation(); // Your GPS function
  
  const closest = findClosestStep(currentLocation, selectedRoute.steps);
  
  if (closest) {
    console.log(`Step ${closest.step.stepIndex + 1}/${selectedRoute.steps.length}`);
    console.log(`Distance: ${closest.distance.toFixed(0)}m away`);
    console.log(`Instruction: ${closest.step.instruction}`);
  }
}, 1000);
```

---

## Helper Functions

### Decode Polyline

```javascript
import { decodePolyline } from '../services/routeCalculationService';

const encodedPolyline = route.polyline;
const coordinates = decodePolyline(encodedPolyline);

// Use coordinates to draw on map
coordinates.forEach(coord => {
  console.log(coord.latitude, coord.longitude);
});
```

### Calculate Distance Between Points

```javascript
import { calculateDistance } from '../services/routeCalculationService';

const point1 = { latitude: 13.0100, longitude: 74.7947 };
const point2 = { latitude: 13.0150, longitude: 74.7980 };

const distance = calculateDistance(point1, point2);
console.log(`Distance: ${distance.toFixed(0)} meters`);
```

### Format Distance

```javascript
import { formatDistance } from '../services/routeCalculationService';

console.log(formatDistance(500));    // "500 m"
console.log(formatDistance(1200));   // "1.2 km"
console.log(formatDistance(7400));   // "7.4 km"
```

### Format Duration

```javascript
import { formatDuration } from '../services/routeCalculationService';

console.log(formatDuration(120));    // "2 mins"
console.log(formatDuration(840));    // "14 mins"
console.log(formatDuration(3720));   // "1h 2m"
```

---

## React Component Example

```javascript
import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { calculateWalkingRoutes } from '../services/routeCalculationService';

const RouteScreen = () => {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRoutes();
  }, []);

  const loadRoutes = async () => {
    try {
      setLoading(true);
      
      const origin = { latitude: 13.0100, longitude: 74.7947 };
      const destination = { latitude: 13.0150, longitude: 74.7980 };
      
      const calculatedRoutes = await calculateWalkingRoutes(
        origin, 
        destination
      );
      
      setRoutes(calculatedRoutes);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <ActivityIndicator />;
  }

  return (
    <View>
      {routes.map((route, index) => (
        <View key={route.id}>
          <Text>Route {index + 1}: {route.summary}</Text>
          <Text>{route.distance.text} • {route.duration.text}</Text>
        </View>
      ))}
    </View>
  );
};
```

---

## Error Handling

```javascript
try {
  const routes = await calculateWalkingRoutes(origin, destination);
} catch (error) {
  if (error.message.includes('No walking route found')) {
    console.log('No route available');
  } else if (error.message.includes('quota exceeded')) {
    console.log('API limit reached');
  } else if (error.message.includes('Invalid')) {
    console.log('Invalid coordinates');
  } else {
    console.log('Unknown error:', error.message);
  }
}
```

---

## Caching

Routes are automatically cached for 30 minutes:

```javascript
// First call - fetches from API
const routes1 = await calculateWalkingRoutes(origin, destination);

// Second call (within 30 mins) - returns from cache
const routes2 = await calculateWalkingRoutes(origin, destination);
// ✅ Returning cached walking routes
```

---

## Integration with MapScreen

Use in your existing MapScreen.jsx:

```javascript
import { calculateWalkingRoutes, getNextInstruction } from '../services/routeCalculationService';

// Replace the old route calculation
const calculateRoutes = async () => {
  try {
    setLoading(true);
    
    // Use new service
    const calculatedRoutes = await calculateWalkingRoutes(
      currentLocation,
      destinationCoords
    );
    
    // Continue with your safety scoring...
    const routesWithSafety = await Promise.all(
      calculatedRoutes.map(async (route) => ({
        ...route,
        safetyScore: await calculateSafetyScore(route),
      }))
    );
    
    setRoutes(routesWithSafety);
  } catch (error) {
    console.error(error);
  } finally {
    setLoading(false);
  }
};
```

---

## API Response Example

**Request:**
```
GET https://maps.googleapis.com/maps/api/directions/json
?origin=13.0100,74.7947
&destination=13.0150,74.7980
&mode=walking
&alternatives=true
&key=YOUR_API_KEY
```

**Parsed Response:**
```json
[
  {
    "id": "route_0",
    "summary": "NH66",
    "distance": { "value": 7400, "text": "7.4 km", "km": "7.40" },
    "duration": { "value": 840, "text": "14 mins", "minutes": 14 },
    "steps": [
      {
        "stepIndex": 0,
        "instruction": "Head west on Main Road",
        "distance": { "value": 200, "text": "200 m" },
        "maneuver": "straight"
      }
    ]
  }
]
```

---

## Testing

Test the service in your app:

```javascript
// Test in App.js or any component
import { calculateWalkingRoutes } from './src/services/routeCalculationService';

const testRoutes = async () => {
  const origin = { latitude: 13.0100, longitude: 74.7947 };
  const destination = { latitude: 13.0150, longitude: 74.7980 };
  
  const routes = await calculateWalkingRoutes(origin, destination);
  
  console.log('✅ Routes calculated:', routes.length);
  routes.forEach((r, i) => {
    console.log(`   ${i + 1}. ${r.summary} - ${r.distance.text}`);
  });
};
```

---

## Next Steps

1. ✅ Service created
2. 🔄 Integrate with MapScreen
3. 🔄 Add to safety scoring
4. 🔄 Display routes on map
5. 🔄 Implement turn-by-turn navigation

**The route calculation service is ready to use!** 🚀
