import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Image, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { THEME_COLORS } from '../utils/constants';
import { GOOGLE_MAPS_API_KEY } from '../config/apiKeys';
const { width } = Dimensions.get('window');

const RouteDetailsScreen = ({ navigation, route }) => {
  const [selectedRoute, setSelectedRoute] = useState('recommended');
  const [routeData, setRouteData] = useState(null);
  const [streetViewIndex, setStreetViewIndex] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [userLocation, setUserLocation] = useState(null);
  const [distanceToNextTurn, setDistanceToNextTurn] = useState(null);
  const [remainingDistance, setRemainingDistance] = useState(null);
  const [remainingTime, setRemainingTime] = useState(null);
  const [calculatedRoutes, setCalculatedRoutes] = useState(null);
  const webViewRef = useRef(null);
  const locationSubscription = useRef(null);

  // Get route params passed from MapScreen
  const routeParams = route?.params || {};
  const { origin, destination, distance, duration, safetyScore, steps, startLocation, endLocation } = routeParams;

  useEffect(() => {
    if (origin && destination) {
      console.log('Route params:', routeParams);
      if (steps && steps.length > 0) {
        console.log('Received', steps.length, 'turn-by-turn directions');
      }
    }
  }, []);

  useEffect(() => {
    return () => {
      // Cleanup location tracking on unmount
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
    };
  }, []);

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  };

  // Track user location during navigation
  const startLocationTracking = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required for navigation');
        return;
      }

      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 1000,
          distanceInterval: 5,
        },
        (location) => {
          const { latitude, longitude } = location.coords;
          setUserLocation({ latitude, longitude });

          // Check if we need to advance to next step
          if (currentRoute.directions && currentRoute.directions[currentStepIndex]) {
            // In a real app, you'd have coordinates for each step
            // For now, we'll simulate advancement based on a simple distance threshold
            // This would be replaced with actual step location comparison
          }

          // Update map with current location
          if (webViewRef.current) {
            webViewRef.current.injectJavaScript(`
              if (typeof updateNavigationPosition === 'function') {
                updateNavigationPosition(${latitude}, ${longitude});
              }
              true;
            `);
          }
        }
      );
    } catch (error) {
      console.error('Location tracking error:', error);
      Alert.alert('Error', 'Failed to start location tracking');
    }
  };

  // Generate Street View image URL for a location
  const getStreetViewUrl = (location, heading = 0) => {
    // If we have coordinates, use them; otherwise use address string
    let locationParam = location;
    if (endLocation && endLocation.lat && endLocation.lng) {
      locationParam = `${endLocation.lat},${endLocation.lng}`;
    }
    return `https://maps.googleapis.com/maps/api/streetview?size=600x300&location=${locationParam}&heading=${heading}&pitch=0&fov=90&key=${GOOGLE_MAPS_API_KEY}`;
  };

  // Handle messages from WebView
  const handleWebViewMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      if (data.type === 'ROUTES_CALCULATED') {
        console.log('Routes calculated:', data.routeCount, 'routes');
        setCalculatedRoutes({
          count: data.routeCount,
          distance: data.distance,
          duration: data.duration,
          steps: data.steps
        });
      } else if (data.type === 'ROUTE_ERROR') {
        console.error('❌ Route calculation error:', data.error);
        Alert.alert('Route Error', data.error);
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  };

  // Generate navigation map HTML
  const getNavigationMapHTML = () => {
    // Use the actual startLocation passed from MapScreen (user's current GPS location)
    const startLat = startLocation?.lat || startLocation?.latitude || 13.0100;
    const startLng = startLocation?.lng || startLocation?.longitude || 74.7948;
    
    // Parse origin if it's a string like "13.0100,74.7948"
    let actualStartLat = startLat;
    let actualStartLng = startLng;
    
    if (typeof origin === 'string' && origin.includes(',')) {
      const [lat, lng] = origin.split(',').map(coord => parseFloat(coord.trim()));
      if (!isNaN(lat) && !isNaN(lng)) {
        actualStartLat = lat;
        actualStartLng = lng;
      }
    }
    
    console.log('Using actual current location:', { lat: actualStartLat, lng: actualStartLng });
    
    return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { height: 100%; width: 100%; overflow: hidden; }
    #map { height: 100%; width: 100%; }
  </style>
</head>
<body>
  <div id="map"></div>
  
  <script>
    let map;
    let userMarker;
    let directionsService;
    let directionsRenderer;
    let userLocation = { lat: ${actualStartLat}, lng: ${actualStartLng} };
    let destinationQuery = "${destination?.replace(/"/g, '\\"') || ''}";
    let routes = [];
    let currentRouteIndex = 0;

    function initMap() {
      map = new google.maps.Map(document.getElementById('map'), {
        center: userLocation,
        zoom: 15,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true,
        disableDefaultUI: false,
      });

      directionsService = new google.maps.DirectionsService();
      directionsRenderer = new google.maps.DirectionsRenderer({
        map: map,
        suppressMarkers: false,
        polylineOptions: {
          strokeColor: '#10B981',
          strokeWeight: 6,
        }
      });

      // Add pulsing user location marker
      userMarker = new google.maps.Marker({
        position: userLocation,
        map: map,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: '#4285F4',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 4,
        },
        title: 'You are here',
        zIndex: 1000,
      });

      // Calculate routes from current location to destination
      calculateRoutes();
    }

    function calculateRoutes() {
      // Calculate 3 different routes: safest (default), fastest, alternative
      const request = {
        origin: userLocation,
        destination: destinationQuery,
        travelMode: google.maps.TravelMode.DRIVING,
        provideRouteAlternatives: true,
        optimizeWaypoints: false,
      };

      directionsService.route(request, (result, status) => {
        if (status === 'OK') {
          routes = result.routes;
          currentRouteIndex = 0;
          
          // Display the first route (safest - we'll consider first route as recommended)
          displayRoute(currentRouteIndex);
          
          // Send route info back to React Native
          if (window.ReactNativeWebView && routes.length > 0) {
            const route = routes[0];
            const leg = route.legs[0];
            
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'ROUTES_CALCULATED',
              routeCount: routes.length,
              distance: leg.distance.text,
              duration: leg.duration.text,
              steps: leg.steps.map(step => ({
                instruction: step.instructions.replace(/<[^>]*>/g, ''),
                distance: step.distance.text,
                duration: step.duration.text
              }))
            }));
          }
        } else {
          console.error('Directions request failed:', status);
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'ROUTE_ERROR',
              error: 'Could not calculate route: ' + status
            }));
          }
        }
      });
    }

    function displayRoute(routeIndex) {
      if (routes[routeIndex]) {
        directionsRenderer.setDirections({ routes: routes, request: routes[routeIndex].request });
        directionsRenderer.setRouteIndex(routeIndex);
      }
    }

    function switchRoute(index) {
      currentRouteIndex = index;
      displayRoute(index);
    }

    function startNavigation() {
      // This is called when user starts turn-by-turn navigation
      if (routes.length > 0) {
        displayRoute(currentRouteIndex);
      }
    }

    function updateNavigationPosition(lat, lng) {
      userLocation = { lat: lat, lng: lng };
      if (userMarker) {
        userMarker.setPosition(userLocation);
        // Keep map centered on user with slight offset upward for better view ahead
        map.panTo(userLocation);
      }
    }
  </script>
  <script async defer
    src="https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&callback=initMap">
  </script>
</body>
</html>
    `;
  };

  // Use real route data or fallback to mock data
  const routes = {
    recommended: {
      name: 'Safest Route',
      distance: calculatedRoutes?.distance || distance || '3.2 km',
      duration: calculatedRoutes?.duration || duration || '12 min',
      safetyScore: safetyScore || 92,
      wellLit: 85,
      crowded: 78,
      lowCrime: 95,
      origin: origin || 'Your Location',
      destination: destination || 'Destination',
      directions: calculatedRoutes?.steps || (steps && steps.length > 0 ? steps : [
        { instruction: 'Head north on Main Street', distance: '0.5 km', icon: 'arrow-up' },
        { instruction: 'Turn right onto Oak Avenue', distance: '1.2 km', icon: 'arrow-forward' },
        { instruction: 'Continue straight on Park Lane', distance: '0.8 km', icon: 'arrow-up' },
        { instruction: 'Turn left onto Destination Road', distance: '0.7 km', icon: 'arrow-back' },
        { instruction: 'Arrive at destination', distance: '0 m', icon: 'checkmark-circle' },
      ]),
    },
    fastest: {
      name: 'Fastest Route',
      distance: '2.8 km',
      duration: '9 min',
      safetyScore: 68,
      wellLit: 55,
      crowded: 45,
      lowCrime: 72,
      directions: [
        { instruction: 'Head east on Main Street', distance: '1.2 km', icon: 'arrow-forward' },
        { instruction: 'Turn left onto Dark Alley', distance: '0.8 km', icon: 'arrow-back' },
        { instruction: 'Continue through park', distance: '0.8 km', icon: 'arrow-up' },
        { instruction: 'Arrive at destination', distance: '0 km', icon: 'checkmark-circle' },
      ],
    },
    alternative: {
      name: 'Alternative Route',
      distance: '4.1 km',
      duration: '16 min',
      safetyScore: 88,
      wellLit: 90,
      crowded: 92,
      lowCrime: 88,
      directions: [
        { instruction: 'Head west on Main Street', distance: '0.6 km', icon: 'arrow-back' },
        { instruction: 'Turn right onto Commercial Road', distance: '2.0 km', icon: 'arrow-forward' },
        { instruction: 'Continue on Highway', distance: '1.0 km', icon: 'arrow-up' },
        { instruction: 'Exit and turn left', distance: '0.5 km', icon: 'arrow-back' },
        { instruction: 'Arrive at destination', distance: '0 km', icon: 'checkmark-circle' },
      ],
    },
  };

  const currentRoute = routes[selectedRoute];

  const getSafetyColor = (score) => {
    if (score >= 80) return THEME_COLORS.SAFETY_GREEN;
    if (score >= 60) return THEME_COLORS.WARNING_ORANGE;
    return THEME_COLORS.ALERT_RED;
  };

  const handleStartNavigation = async () => {
    if (isNavigating) {
      // Stop navigation
      if (locationSubscription.current) {
        locationSubscription.current.remove();
        locationSubscription.current = null;
      }
      setIsNavigating(false);
      setCurrentStepIndex(0);
      Alert.alert('Navigation Stopped', 'Navigation has been stopped.');
    } else {
      // Start navigation
      Alert.alert(
        'Start Navigation',
        `Start navigating via ${currentRoute.name}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Start',
            onPress: async () => {
              setIsNavigating(true);
              setCurrentStepIndex(0);
              await startLocationTracking();
              
              // Initialize navigation on map
              if (webViewRef.current) {
                webViewRef.current.injectJavaScript(`
                  if (typeof startNavigation === 'function') {
                    startNavigation();
                  }
                  true;
                `);
              }
            },
          },
        ]
      );
    }
  };

  return (
    <View style={styles.container}>
      {/* Live Navigation Mode */}
      {isNavigating ? (
        <View style={styles.navigationContainer}>
          {/* Live Map View */}
          <View style={styles.liveMapContainer}>
            <WebView
              ref={webViewRef}
              source={{ html: getNavigationMapHTML() }}
              style={styles.liveMap}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              onMessage={handleWebViewMessage}
            />
            
            {/* Exit Navigation Button */}
            <TouchableOpacity 
              style={styles.exitNavButton}
              onPress={handleStartNavigation}
            >
              <Ionicons name="close-circle" size={32} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Current Instruction Panel */}
          <View style={styles.instructionPanel}>
            <LinearGradient
              colors={['#10B981', '#059669']}
              style={styles.instructionGradient}
            >
              {/* Distance to next turn */}
              <View style={styles.distanceToTurn}>
                <Text style={styles.distanceLarge}>
                  {currentRoute.directions[currentStepIndex]?.distance || '0 m'}
                </Text>
              </View>

              {/* Current instruction */}
              <View style={styles.currentInstruction}>
                <Ionicons 
                  name={currentRoute.directions[currentStepIndex]?.icon || 'arrow-forward'} 
                  size={48} 
                  color="#FFFFFF" 
                />
                <Text style={styles.instructionText}>
                  {currentRoute.directions[currentStepIndex]?.instruction || 'Loading...'}
                </Text>
              </View>

              {/* ETA and Remaining Distance */}
              <View style={styles.etaBar}>
                <View style={styles.etaItem}>
                  <Ionicons name="time-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.etaText}>{remainingTime || currentRoute.duration} remaining</Text>
                </View>
                <View style={styles.etaDivider} />
                <View style={styles.etaItem}>
                  <Ionicons name="navigate-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.etaText}>{remainingDistance || currentRoute.distance} left</Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Upcoming Steps */}
          <View style={styles.upcomingStepsPanel}>
            <Text style={styles.upcomingTitle}>Upcoming Steps</Text>
            <ScrollView style={styles.upcomingList} showsVerticalScrollIndicator={false}>
              {currentRoute.directions.slice(currentStepIndex + 1, currentStepIndex + 4).map((step, index) => (
                <View key={index} style={styles.upcomingStep}>
                  <View style={styles.upcomingStepIcon}>
                    <Ionicons name={step.icon} size={20} color={THEME_COLORS.TEXT_SECONDARY} />
                  </View>
                  <View style={styles.upcomingStepInfo}>
                    <Text style={styles.upcomingStepText} numberOfLines={1}>{step.instruction}</Text>
                    <Text style={styles.upcomingStepDistance}>{step.distance}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      ) : (
        /* Route Details View (existing) */
        <>
      {/* Header */}
      <LinearGradient
        colors={[THEME_COLORS.SAFETY_GREEN, '#059669']}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Route Details</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView style={styles.content}>
        {/* Route Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Routes</Text>
          <View style={styles.routeOptions}>
            {Object.keys(routes).map((routeKey) => (
              <TouchableOpacity
                key={routeKey}
                style={[
                  styles.routeOption,
                  selectedRoute === routeKey && styles.routeOptionActive,
                ]}
                onPress={() => setSelectedRoute(routeKey)}
              >
                <Text style={[
                  styles.routeOptionName,
                  selectedRoute === routeKey && styles.routeOptionNameActive,
                ]}>
                  {routes[routeKey].name}
                </Text>
                <Text style={[
                  styles.routeOptionDuration,
                  selectedRoute === routeKey && styles.routeOptionDurationActive,
                ]}>
                  {routes[routeKey].duration}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Route Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Ionicons name="navigate" size={24} color={THEME_COLORS.SAFETY_GREEN} />
              <Text style={styles.summaryLabel}>Distance</Text>
              <Text style={styles.summaryValue}>{currentRoute.distance}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Ionicons name="time" size={24} color={THEME_COLORS.ACCENT_BLUE} />
              <Text style={styles.summaryLabel}>Duration</Text>
              <Text style={styles.summaryValue}>{currentRoute.duration}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Ionicons
                name="shield-checkmark"
                size={24}
                color={getSafetyColor(currentRoute.safetyScore)}
              />
              <Text style={styles.summaryLabel}>Safety</Text>
              <Text style={[
                styles.summaryValue,
                { color: getSafetyColor(currentRoute.safetyScore) },
              ]}>
                {currentRoute.safetyScore}%
              </Text>
            </View>
          </View>
        </View>

        {/* Safety Score Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Safety Breakdown</Text>
          <View style={styles.safetyCard}>
            <View style={styles.safetyItem}>
              <View style={styles.safetyHeader}>
                <Ionicons name="bulb" size={20} color={THEME_COLORS.WARNING_ORANGE} />
                <Text style={styles.safetyLabel}>Well-Lit Areas</Text>
              </View>
              <View style={styles.progressBar}>
                <View
                  style={[styles.progressFill, { width: `${currentRoute.wellLit}%` }]}
                />
              </View>
              <Text style={styles.safetyPercentage}>{currentRoute.wellLit}%</Text>
            </View>

            <View style={styles.safetyItem}>
              <View style={styles.safetyHeader}>
                <Ionicons name="people" size={20} color={THEME_COLORS.ACCENT_BLUE} />
                <Text style={styles.safetyLabel}>Crowded Areas</Text>
              </View>
              <View style={styles.progressBar}>
                <View
                  style={[styles.progressFill, { width: `${currentRoute.crowded}%` }]}
                />
              </View>
              <Text style={styles.safetyPercentage}>{currentRoute.crowded}%</Text>
            </View>

            <View style={styles.safetyItem}>
              <View style={styles.safetyHeader}>
                <Ionicons name="shield-checkmark" size={20} color={THEME_COLORS.SAFETY_GREEN} />
                <Text style={styles.safetyLabel}>Low Crime Rate</Text>
              </View>
              <View style={styles.progressBar}>
                <View
                  style={[styles.progressFill, { width: `${currentRoute.lowCrime}%` }]}
                />
              </View>
              <Text style={styles.safetyPercentage}>{currentRoute.lowCrime}%</Text>
            </View>
          </View>
        </View>

        {/* Street View Preview */}
        {destination && (
          <View style={styles.section}>
            <View style={styles.streetViewHeader}>
              <Text style={styles.sectionTitle}>Street View Preview</Text>
              <Text style={styles.streetViewSubtitle}>Explore your route visually</Text>
            </View>
            <View style={styles.streetViewContainer}>
              <Image
                source={{ uri: getStreetViewUrl(destination, streetViewIndex * 90) }}
                style={styles.streetViewImage}
                resizeMode="cover"
              />
              <View style={styles.streetViewControls}>
                <TouchableOpacity
                  style={styles.streetViewButton}
                  onPress={() => setStreetViewIndex((streetViewIndex - 1 + 4) % 4)}
                >
                  <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <View style={styles.streetViewInfo}>
                  <Ionicons name="compass" size={16} color="#FFFFFF" />
                  <Text style={styles.streetViewText}>
                    {['North', 'East', 'South', 'West'][streetViewIndex]}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.streetViewButton}
                  onPress={() => setStreetViewIndex((streetViewIndex + 1) % 4)}
                >
                  <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Location Info */}
        {origin && destination && (
          <View style={styles.section}>
            <View style={styles.locationCard}>
              <View style={styles.locationItem}>
                <View style={styles.locationDot} />
                <View style={styles.locationInfo}>
                  <Text style={styles.locationLabel}>From</Text>
                  <Text style={styles.locationText}>{origin}</Text>
                </View>
              </View>
              <View style={styles.locationLine} />
              <View style={styles.locationItem}>
                <View style={[styles.locationDot, styles.locationDotDestination]} />
                <View style={styles.locationInfo}>
                  <Text style={styles.locationLabel}>To</Text>
                  <Text style={styles.locationText}>{destination}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Turn-by-Turn Directions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Directions</Text>
          {currentRoute.directions.map((step, index) => (
            <View key={index} style={styles.directionCard}>
              <View style={[
                styles.directionIcon,
                index === currentRoute.directions.length - 1 && styles.directionIconFinal,
              ]}>
                <Ionicons
                  name={step.icon}
                  size={24}
                  color={index === currentRoute.directions.length - 1 ? THEME_COLORS.SAFETY_GREEN : THEME_COLORS.TEXT_PRIMARY}
                />
              </View>
              <View style={styles.directionContent}>
                <Text style={styles.directionText}>{step.instruction}</Text>
                {step.distance !== '0 km' && (
                  <Text style={styles.directionDistance}>{step.distance}</Text>
                )}
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Start Navigation Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.startButton} onPress={handleStartNavigation}>
          <Ionicons name="navigate" size={24} color="#FFFFFF" />
          <Text style={styles.startButtonText}>Start Navigation</Text>
        </TouchableOpacity>
      </View>
      </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 18,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: THEME_COLORS.TEXT_PRIMARY,
    marginBottom: 14,
    letterSpacing: 0.2,
  },
  routeOptions: {
    gap: 10,
  },
  routeOption: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  routeOptionActive: {
    borderColor: THEME_COLORS.SAFETY_GREEN,
    backgroundColor: '#F0FDF4',
    shadowColor: THEME_COLORS.SAFETY_GREEN,
    shadowOpacity: 0.2,
  },
  routeOptionName: {
    fontSize: 17,
    fontWeight: '600',
    color: THEME_COLORS.TEXT_PRIMARY,
  },
  routeOptionNameActive: {
    color: THEME_COLORS.SAFETY_GREEN,
    fontWeight: '700',
  },
  routeOptionDuration: {
    fontSize: 14,
    fontWeight: '500',
    color: THEME_COLORS.TEXT_SECONDARY,
  },
  routeOptionDurationActive: {
    color: THEME_COLORS.SAFETY_GREEN,
    fontWeight: '700',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: THEME_COLORS.TEXT_SECONDARY,
    marginTop: 8,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME_COLORS.TEXT_PRIMARY,
    marginTop: 4,
  },
  safetyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    gap: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  safetyItem: {
    gap: 10,
  },
  safetyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  safetyLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: THEME_COLORS.TEXT_PRIMARY,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: THEME_COLORS.SAFETY_GREEN,
    borderRadius: 4,
  },
  safetyPercentage: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME_COLORS.TEXT_SECONDARY,
    textAlign: 'right',
  },
  directionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  directionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  directionIconFinal: {
    backgroundColor: '#D1FAE5',
  },
  directionContent: {
    flex: 1,
  },
  directionText: {
    fontSize: 14,
    fontWeight: '500',
    color: THEME_COLORS.TEXT_PRIMARY,
  },
  directionDistance: {
    fontSize: 12,
    color: THEME_COLORS.TEXT_SECONDARY,
    marginTop: 4,
  },
  streetViewHeader: {
    marginBottom: 12,
  },
  streetViewSubtitle: {
    fontSize: 13,
    color: THEME_COLORS.TEXT_SECONDARY,
    marginTop: 4,
  },
  streetViewContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  streetViewImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#E5E7EB',
  },
  streetViewControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 12,
  },
  streetViewButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  streetViewInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  streetViewText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  locationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: THEME_COLORS.ACCENT_BLUE,
  },
  locationDotDestination: {
    backgroundColor: THEME_COLORS.SAFETY_GREEN,
  },
  locationLine: {
    width: 2,
    height: 24,
    backgroundColor: '#E5E7EB',
    marginLeft: 5,
    marginVertical: 8,
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    color: THEME_COLORS.TEXT_SECONDARY,
    marginBottom: 4,
  },
  locationText: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME_COLORS.TEXT_PRIMARY,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  startButton: {
    backgroundColor: THEME_COLORS.SAFETY_GREEN,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: THEME_COLORS.SAFETY_GREEN,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Live Navigation Styles
  navigationContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  liveMapContainer: {
    flex: 1,
    position: 'relative',
  },
  liveMap: {
    flex: 1,
  },
  exitNavButton: {
    position: 'absolute',
    top: 50,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  instructionPanel: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  instructionGradient: {
    padding: 20,
    paddingTop: 60,
  },
  distanceToTurn: {
    alignItems: 'center',
    marginBottom: 16,
  },
  distanceLarge: {
    fontSize: 48,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  currentInstruction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  instructionText: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  etaBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 12,
  },
  etaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  etaText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  etaDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  upcomingStepsPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  upcomingTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME_COLORS.TEXT_PRIMARY,
    marginBottom: 12,
  },
  upcomingList: {
    maxHeight: 120,
  },
  upcomingStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  upcomingStepIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  upcomingStepInfo: {
    flex: 1,
  },
  upcomingStepText: {
    fontSize: 14,
    fontWeight: '500',
    color: THEME_COLORS.TEXT_PRIMARY,
    marginBottom: 2,
  },
  upcomingStepDistance: {
    fontSize: 12,
    color: THEME_COLORS.TEXT_SECONDARY,
  },
});

export default RouteDetailsScreen;
