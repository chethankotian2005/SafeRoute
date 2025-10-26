# MapScreen Data Flow Diagram

## 🔄 Complete Data Flow Visualization

```
═══════════════════════════════════════════════════════════════════════════
                           MAPSCREEN DATA FLOW
═══════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────────┐
│                          1. USER INPUTS                                  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
         ┌──────────▼─────────┐        ┌───────────▼──────────┐
         │  Current Location  │        │  Destination Input   │
         │  (GPS Tracking)    │        │  "NITK Beach"        │
         └──────────┬─────────┘        └───────────┬──────────┘
                    │                               │
                    │                               │
                    └───────────────┬───────────────┘
                                    │
┌─────────────────────────────────────────────────────────────────────────┐
│                      2. DATA COLLECTION PHASE                            │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴────────────────┐
                    │                                │
         ┌──────────▼─────────┐         ┌───────────▼──────────┐
         │ useLocation Hook   │         │ Geocoding Service    │
         │                    │         │                      │
         │ ├─ Get GPS coords  │         │ ├─ Convert address  │
         │ ├─ Track updates   │         │ └─ Return lat/lng   │
         │ └─ Monitor accuracy│         │                      │
         └──────────┬─────────┘         └───────────┬──────────┘
                    │                                │
                    │                                │
                    └────────────────┬───────────────┘
                                     │
                    ┌────────────────▼────────────────┐
                    │   LOCATION DATA READY           │
                    │                                 │
                    │   Origin:      {lat, lng}       │
                    │   Destination: {lat, lng}       │
                    └────────────────┬────────────────┘
                                     │
┌─────────────────────────────────────────────────────────────────────────┐
│                    3. ROUTE CALCULATION PHASE                            │
└─────────────────────────────────────────────────────────────────────────┘
                                     │
                    ┌────────────────▼────────────────┐
                    │  Google Directions API          │
                    │                                 │
                    │  Request Parameters:            │
                    │  ├─ origin: GPS coordinates     │
                    │  ├─ destination: address coords │
                    │  ├─ mode: "walking"             │
                    │  └─ alternatives: true          │
                    └────────────────┬────────────────┘
                                     │
                    ┌────────────────▼────────────────┐
                    │   API RESPONSE                  │
                    │                                 │
                    │   Route 1: {                    │
                    │     distance: 1.2 km           │
                    │     duration: 15 min           │
                    │     polyline: "encoded..."     │
                    │     steps: [...instructions]   │
                    │     coordinates: [{lat,lng}]   │
                    │   }                            │
                    │                                │
                    │   Route 2: {...}               │
                    │   Route 3: {...}               │
                    └────────────────┬────────────────┘
                                     │
┌─────────────────────────────────────────────────────────────────────────┐
│                   4. AI SAFETY ANALYSIS PHASE                            │
└─────────────────────────────────────────────────────────────────────────┘
                                     │
                                     │
              ┌──────────────────────┼──────────────────────┐
              │                      │                      │
   ┌──────────▼─────────┐ ┌─────────▼────────┐ ┌──────────▼─────────┐
   │   Route 1          │ │   Route 2        │ │   Route 3          │
   │   Analysis         │ │   Analysis       │ │   Analysis         │
   └──────────┬─────────┘ └─────────┬────────┘ └──────────┬─────────┘
              │                     │                      │
              │                     │                      │
   ┌──────────▼──────────────────────▼──────────────────────▼─────────┐
   │                 PARALLEL SAFETY SCORING                           │
   │                                                                   │
   │  For Each Route:                                                 │
   │                                                                   │
   │  ┌─────────────────────────────────────────────────────────┐   │
   │  │ 1. STREET LIGHTING (30% weight)                         │   │
   │  │    ├─ Sample 5 points along route                       │   │
   │  │    ├─ Get Street View images                            │   │
   │  │    ├─ Cloud Vision API → Brightness analysis            │   │
   │  │    ├─ Label detection (lamps, lighting)                 │   │
   │  │    └─ Score: -3 to +3                                   │   │
   │  └─────────────────────────────────────────────────────────┘   │
   │                                                                   │
   │  ┌─────────────────────────────────────────────────────────┐   │
   │  │ 2. FOOT TRAFFIC (25% weight)                            │   │
   │  │    ├─ Get current time                                  │   │
   │  │    ├─ Check day/night status                            │   │
   │  │    ├─ Estimate pedestrian density                       │   │
   │  │    └─ Score: -2 to +2                                   │   │
   │  └─────────────────────────────────────────────────────────┘   │
   │                                                                   │
   │  ┌─────────────────────────────────────────────────────────┐   │
   │  │ 3. TIME OF DAY (20% weight)                             │   │
   │  │    ├─ Get current hour (0-23)                           │   │
   │  │    ├─ Day (6am-8pm): +2 bonus                           │   │
   │  │    ├─ Night (8pm-6am): -2 penalty                       │   │
   │  │    └─ Score: -2 to +2                                   │   │
   │  └─────────────────────────────────────────────────────────┘   │
   │                                                                   │
   │  ┌─────────────────────────────────────────────────────────┐   │
   │  │ 4. SAFE SPOT PROXIMITY (15% weight)                     │   │
   │  │    ├─ Sample 3 points along route                       │   │
   │  │    ├─ Google Places API → Nearby hospitals, police      │   │
   │  │    ├─ Count safe spots within 500m                      │   │
   │  │    └─ Score: 0 to +2                                    │   │
   │  └─────────────────────────────────────────────────────────┘   │
   │                                                                   │
   │  ┌─────────────────────────────────────────────────────────┐   │
   │  │ 5. COMMUNITY REPORTS (10% weight)                       │   │
   │  │    ├─ Firebase Firestore query                          │   │
   │  │    ├─ Get reports near route (< 200m)                   │   │
   │  │    ├─ Filter recent (last 7 days)                       │   │
   │  │    ├─ Apply severity penalties                          │   │
   │  │    └─ Score: -3 to 0                                    │   │
   │  └─────────────────────────────────────────────────────────┘   │
   │                                                                   │
   │  ┌─────────────────────────────────────────────────────────┐   │
   │  │ WEIGHTED SCORE CALCULATION                              │   │
   │  │                                                           │   │
   │  │  Total = 5 (base)                                        │   │
   │  │        + (lighting * 0.30)                               │   │
   │  │        + (traffic * 0.25)                                │   │
   │  │        + (timeOfDay * 0.20)                              │   │
   │  │        + (safeSpots * 0.15)                              │   │
   │  │        + (community * 0.10)                              │   │
   │  │                                                           │   │
   │  │  Final = clamp(Total, 1, 10)                             │   │
   │  └─────────────────────────────────────────────────────────┘   │
   └───────────────────────────────────────────────────────────────┘
                                     │
                    ┌────────────────▼────────────────┐
                    │   SCORED ROUTES                 │
                    │                                 │
                    │   Route 1: Score 8 → 🟢 Green   │
                    │   Route 2: Score 6 → 🟠 Orange  │
                    │   Route 3: Score 3 → 🔴 Red     │
                    └────────────────┬────────────────┘
                                     │
┌─────────────────────────────────────────────────────────────────────────┐
│                      5. VISUALIZATION PHASE                              │
└─────────────────────────────────────────────────────────────────────────┘
                                     │
                    ┌────────────────▼────────────────┐
                    │   Sort Routes by Safety         │
                    │   (Highest score first)         │
                    └────────────────┬────────────────┘
                                     │
              ┌──────────────────────┼──────────────────────┐
              │                      │                      │
   ┌──────────▼─────────┐ ┌─────────▼────────┐ ┌──────────▼─────────┐
   │   MAP DISPLAY      │ │  ROUTE CARDS     │ │  AUTO-SELECT       │
   │                    │ │                  │ │                    │
   │ ├─ Draw polylines  │ │ ├─ Safety badge  │ │ ├─ Select safest  │
   │ ├─ Color by score  │ │ ├─ Distance/time │ │ └─ Highlight route│
   │ └─ Show markers    │ │ └─ Selection UI  │ │                    │
   └────────────────────┘ └──────────────────┘ └────────────────────┘
                                     │
┌─────────────────────────────────────────────────────────────────────────┐
│                      6. USER INTERACTION                                 │
└─────────────────────────────────────────────────────────────────────────┘
                                     │
                    ┌────────────────▼────────────────┐
                    │   User Reviews Routes           │
                    │   Selects Preferred Route       │
                    └────────────────┬────────────────┘
                                     │
                    ┌────────────────▼────────────────┐
                    │   Taps "Start Navigation"       │
                    └────────────────┬────────────────┘
                                     │
┌─────────────────────────────────────────────────────────────────────────┐
│                     7. NAVIGATION PHASE                                  │
└─────────────────────────────────────────────────────────────────────────┘
                                     │
                    ┌────────────────▼────────────────┐
                    │   Initialize Navigation         │
                    │                                 │
                    │   ├─ currentStepIndex = 0       │
                    │   ├─ isNavigating = true        │
                    │   ├─ Show navigation panel      │
                    │   └─ Zoom map to user location  │
                    └────────────────┬────────────────┘
                                     │
                    ┌────────────────▼────────────────┐
                    │   REAL-TIME TRACKING LOOP       │
                    │                                 │
                    │   ┌─────────────────────────┐  │
                    │   │ GPS Update (every 3s)   │  │
                    │   └─────────┬───────────────┘  │
                    │             │                   │
                    │   ┌─────────▼───────────────┐  │
                    │   │ Calculate Distance to   │  │
                    │   │ Next Waypoint           │  │
                    │   └─────────┬───────────────┘  │
                    │             │                   │
                    │   ┌─────────▼───────────────┐  │
                    │   │ Distance < 20m?         │  │
                    │   │    ├─ Yes: Advance step │  │
                    │   │    └─ No: Continue      │  │
                    │   └─────────┬───────────────┘  │
                    │             │                   │
                    │   ┌─────────▼───────────────┐  │
                    │   │ Update UI:              │  │
                    │   │ ├─ Remaining distance   │  │
                    │   │ ├─ Remaining time       │  │
                    │   │ ├─ Current instruction  │  │
                    │   │ └─ Map position         │  │
                    │   └─────────┬───────────────┘  │
                    │             │                   │
                    │             └──── Loop ────┘    │
                    └─────────────────────────────────┘
                                     │
                    ┌────────────────▼────────────────┐
                    │   Arrival Detection             │
                    │   (Last step + distance < 20m)  │
                    └────────────────┬────────────────┘
                                     │
┌─────────────────────────────────────────────────────────────────────────┐
│                      8. COMPLETION PHASE                                 │
└─────────────────────────────────────────────────────────────────────────┘
                                     │
                    ┌────────────────▼────────────────┐
                    │   Show Arrival Notification     │
                    │   "You have arrived!"           │
                    └────────────────┬────────────────┘
                                     │
                    ┌────────────────▼────────────────┐
                    │   Reset State                   │
                    │                                 │
                    │   ├─ isNavigating = false       │
                    │   ├─ Clear routes               │
                    │   ├─ Clear destination          │
                    │   └─ Return to search mode      │
                    └─────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════


                        CONCURRENT PROCESSES

═══════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────────┐
│  LOCATION TRACKING (Background)                                          │
│                                                                          │
│  useLocation Hook → GPS Updates (every 2-5s) → userLocation State       │
│                                                 ↓                        │
│                                      Update Map Position                 │
│                                                 ↓                        │
│                                   Check Navigation Progress              │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  MAP UPDATES (WebView Communication)                                     │
│                                                                          │
│  React Native → postMessage() → WebView                                 │
│      ├─ UPDATE_USER_LOCATION                                            │
│      ├─ DISPLAY_ROUTES                                                  │
│      ├─ SELECT_ROUTE                                                    │
│      └─ START_NAVIGATION                                                │
│                                                                          │
│  WebView → postMessage() → React Native                                 │
│      └─ MAP_READY                                                       │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  SAFETY MONITORING (During Navigation)                                   │
│                                                                          │
│  ┌────────────────┐      ┌────────────────┐      ┌────────────────┐   │
│  │ Check for      │ ───→ │ Display        │ ───→ │ Update Safety  │   │
│  │ Community      │      │ Alerts         │      │ Indicator      │   │
│  │ Reports        │      │                │      │                │   │
│  └────────────────┘      └────────────────┘      └────────────────┘   │
│         ↓                        ↓                        ↓            │
│  ┌────────────────┐      ┌────────────────┐      ┌────────────────┐   │
│  │ Monitor Route  │      │ Show Safe      │      │ SOS Quick      │   │
│  │ Deviation      │      │ Spots Nearby   │      │ Access         │   │
│  └────────────────┘      └────────────────┘      └────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════


                           STATE TRANSITIONS

═══════════════════════════════════════════════════════════════════════════

     Initial State
          │
          ▼
    [Map Ready]
          │
          ▼
   [Enter Destination] ◄─────┐
          │                  │
          ▼                  │
   [Calculating Routes]      │
          │                  │
          ▼                  │
   [Routes Displayed]        │ Reset
          │                  │
          ▼                  │
   [Route Selected]          │
          │                  │
          ▼                  │
   [Navigation Active] ──────┘
          │
          ▼
   [Arrived at Destination]

═══════════════════════════════════════════════════════════════════════════
```

## 🔑 Key Data Structures

### Route Object
```javascript
{
  id: "route_0",
  name: "Route via Main Street",
  distance: { value: 1200, text: "1.2 km" },
  duration: { value: 900, text: "15 min" },
  polyline: "encoded_polyline_string",
  coordinates: [
    { latitude: 13.0100, longitude: 74.7948 },
    { latitude: 13.0105, longitude: 74.7950 },
    // ... more points
  ],
  steps: [
    {
      html_instructions: "Head <b>north</b> on Street",
      distance: { value: 100, text: "100 m" },
      duration: { value: 60, text: "1 min" },
      start_location: { lat: 13.0100, lng: 74.7948 },
      end_location: { lat: 13.0105, lng: 74.7950 }
    },
    // ... more steps
  ],
  safety: {
    score: 8,
    breakdown: {
      lighting: 2.1,
      footTraffic: 2.0,
      timeOfDay: 2.0,
      safeSpots: 1.5,
      community: -0.5
    },
    factors: [
      "Well-lit streets",
      "Daytime travel",
      "Multiple safe spots nearby"
    ]
  },
  color: "#10B981" // Green
}
```

### Navigation State
```javascript
{
  isNavigating: true,
  currentStepIndex: 2,
  navigationStats: {
    distanceRemaining: 800, // meters
    timeRemaining: 600,      // seconds
    currentInstruction: "Turn right onto Beach Road"
  }
}
```

### Location Data
```javascript
{
  latitude: 13.0100,
  longitude: 74.7948,
  accuracy: 10, // meters
  altitude: 15,
  speed: 1.4,  // m/s
  heading: 45, // degrees
  timestamp: 1698249600000
}
```

---

**This diagram shows the complete end-to-end data flow of the MapScreen component!**
