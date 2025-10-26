import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, StatusBar, Dimensions, Alert, Modal } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { THEME_COLORS } from '../utils/constants';
import { useTheme } from '../context/ThemeContext';
import { GOOGLE_MAPS_API_KEY } from '../config/apiKeys';
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;

const LiveNavigationScreen = ({ route, navigation }) => {
  const { colors, isDarkMode } = useTheme();
  const { destination, routeCoordinates, instructions, totalDistance, totalDuration } = route.params || {};
  
  // Validate required data
  if (!routeCoordinates || routeCoordinates.length === 0) {
    useEffect(() => {
      Alert.alert(
        'No Route Data',
        'Unable to start navigation without route information.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }, []);
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <Text style={{ color: colors.text }}>No route data available</Text>
      </View>
    );
  }
  
  // Normalize destination to ensure it has latitude/longitude
  const destinationCoords = destination?.coordinates || destination || routeCoordinates[routeCoordinates.length - 1] || { latitude: 0, longitude: 0 };
  
  console.log('LiveNavigationScreen initialized with:');
  console.log('- Destination:', destinationCoords);
  console.log('- Route points:', routeCoordinates.length);
  console.log('- Instructions:', instructions?.length || 0);
  
  const mapRef = useRef(null);
  const webViewRef = useRef(null);
  const previousLocationRef = useRef(null); // Store previous location for heading calculation
  const [currentLocation, setCurrentLocation] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const [heading, setHeading] = useState(0);
  const [currentInstruction, setCurrentInstruction] = useState(instructions?.[0] ? {
    text: instructions[0].instruction || instructions[0].text || 'Starting navigation...',
    distance: typeof instructions[0].distance === 'object' ? instructions[0].distance.text : (instructions[0].distance || '0 m'),
    maneuver: instructions[0].maneuver || 'straight'
  } : { 
    text: 'Starting navigation...', 
    distance: '0 m',
    maneuver: 'straight'
  });
  const [remainingDistance, setRemainingDistance] = useState(totalDistance || '0 km');
  const [eta, setEta] = useState(totalDuration || '0 min');
  const [nextInstructionIndex, setNextInstructionIndex] = useState(0);
  const [mapStyle, setMapStyle] = useState('roadmap'); // roadmap, satellite, terrain, hybrid
  const [showMapStyleModal, setShowMapStyleModal] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [mapError, setMapError] = useState(null);

  useEffect(() => {
    let locationSubscription;

    const startLocationTracking = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Location permission is required for navigation');
          return;
        }

        // Get initial location
        const initialLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.BestForNavigation,
        });
        
        const initialLat = initialLocation.coords.latitude;
        const initialLng = initialLocation.coords.longitude;
        const initialHeading = initialLocation.coords.heading || 0;
        
        setCurrentLocation({ latitude: initialLat, longitude: initialLng });
        setHeading(initialHeading);

        // Start watching location with high accuracy for walking navigation
        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.BestForNavigation,
            timeInterval: 300, // Update every 0.3 seconds for smoother tracking
            distanceInterval: 1, // Update every 1 meter of movement for better accuracy
          },
          (location) => {
            const { latitude, longitude, heading: deviceHeading, speed } = location.coords;
            setCurrentLocation({ latitude, longitude });
            
            // Calculate heading from movement direction
            let calculatedHeading = heading; // Keep previous heading as default
            
            // Method 1: Use GPS heading if available and moving
            if (deviceHeading !== null && deviceHeading !== undefined && !isNaN(deviceHeading) && speed > 0.3) {
              calculatedHeading = deviceHeading;
              console.log('Using GPS heading:', deviceHeading);
            }
            // Method 2: Calculate bearing from movement if we have previous location
            else if (previousLocationRef.current && speed > 0.3) {
              const prevLat = previousLocationRef.current.latitude;
              const prevLng = previousLocationRef.current.longitude;
              
              // Only calculate if we've moved at least 2 meters (reduced for better responsiveness)
              const distanceMoved = calculateDistance(prevLat, prevLng, latitude, longitude);
              
              if (distanceMoved > 2) {
                calculatedHeading = calculateBearing(prevLat, prevLng, latitude, longitude);
                console.log('Calculated heading from movement:', calculatedHeading, 'Distance:', distanceMoved);
              }
            }
            
            // Update heading state
            if (!isNaN(calculatedHeading)) {
              setHeading(calculatedHeading);
            }
            
            // Store current location for next bearing calculation
            previousLocationRef.current = { latitude, longitude };

            // Update user marker on map with rotation based on heading
            if (webViewRef.current && mapReady) {
              const jsCode = `
                if (window.userMarker) {
                  const newPosition = { lat: ${latitude}, lng: ${longitude} };
                  window.userMarker.setPosition(newPosition);
                  
                  // Rotate the direction arrow based on calculated heading
                  const icon = window.userMarker.getIcon();
                  if (icon && !isNaN(${calculatedHeading})) {
                    icon.rotation = ${calculatedHeading};
                    window.userMarker.setIcon(icon);
                  }
                }
                
                // Update the accuracy circle position
                if (window.userCircle) {
                  window.userCircle.setCenter({ lat: ${latitude}, lng: ${longitude} });
                }
                
                // Smoothly pan map to follow user
                if (map) {
                  map.panTo({ lat: ${latitude}, lng: ${longitude} });
                }
                true;
              `;
              webViewRef.current.injectJavaScript(jsCode);
            }

            // Check if we need to update instruction based on proximity
            updateNavigationProgress(location.coords);
          }
        );

        console.log('GPS location tracking started successfully');
      } catch (error) {
        console.error('Error starting location tracking:', error);
        Alert.alert('Location Error', 'Unable to start GPS tracking. Please check your location settings.');
      }
    };

    startLocationTracking();

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [mapReady]);

  // Calculate distance between two coordinates in meters using Haversine formula
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  const formatDistance = (meters) => {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    } else {
      return `${(meters / 1000).toFixed(1)} km`;
    }
  };

  // Calculate bearing (heading) between two coordinates
  const calculateBearing = (lat1, lon1, lat2, lon2) => {
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
    
    let bearing = Math.atan2(y, x) * (180 / Math.PI);
    
    // Normalize to 0-360
    bearing = (bearing + 360) % 360;
    
    return bearing;
  };

  const updateNavigationProgress = (coords) => {
    if (!instructions || instructions.length === 0 || !coords) return;

    const currentStep = instructions[nextInstructionIndex];
    if (!currentStep) return;

    // Get the end location of the current step
    const stepEndLat = currentStep.endLocation?.latitude;
    const stepEndLng = currentStep.endLocation?.longitude;

    if (stepEndLat && stepEndLng) {
      // Calculate distance to the end of current step
      const distanceToStep = calculateDistance(
        coords.latitude,
        coords.longitude,
        stepEndLat,
        stepEndLng
      );

      // Update the displayed distance
      const formattedDistance = formatDistance(distanceToStep);
      setCurrentInstruction(prev => ({
        ...prev,
        distance: formattedDistance
      }));

      // If we're within 15 meters of the step endpoint, move to next instruction
      if (distanceToStep < 15 && nextInstructionIndex < instructions.length - 1) {
        const nextStep = instructions[nextInstructionIndex + 1];
        setNextInstructionIndex(nextInstructionIndex + 1);
        setCurrentInstruction({
          text: nextStep.instruction || nextStep.text || 'Continue',
          distance: typeof nextStep.distance === 'object' ? nextStep.distance.text : (nextStep.distance || '0 m'),
          maneuver: nextStep.maneuver || 'straight'
        });
        
        // Voice feedback would go here
        console.log('Moving to next instruction:', nextStep.instruction);
      }

      // Calculate total remaining distance to destination
      if (destinationCoords?.latitude && destinationCoords?.longitude) {
        const distanceToDestination = calculateDistance(
          coords.latitude,
          coords.longitude,
          destinationCoords.latitude,
          destinationCoords.longitude
        );

        setRemainingDistance(formatDistance(distanceToDestination));

        // Check if arrived at destination (within 10 meters)
        if (distanceToDestination < 10) {
          Alert.alert(
            '🎉 Arrival',
            'You have arrived at your destination!',
            [
              {
                text: 'Done',
                onPress: () => navigation.goBack(),
              },
            ]
          );
        }
      }
    }
  };

  const handleCancelNavigation = () => {
    Alert.alert(
      'Cancel Navigation',
      'Are you sure you want to stop navigation?',
      [
        { text: 'Continue', style: 'cancel' },
        {
          text: 'Stop',
          style: 'destructive',
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  const getManeuverIcon = (maneuver) => {
    switch (maneuver?.toLowerCase()) {
      case 'turn-left':
      case 'left':
        return 'arrow-back';
      case 'turn-right':
      case 'right':
        return 'arrow-forward';
      case 'straight':
      case 'continue':
        return 'arrow-up';
      case 'uturn':
        return 'return-up-back';
      default:
        return 'arrow-up';
    }
  };

  const handleWebViewMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      console.log('WebView Message:', data.type);
      
      if (data.type === 'ERROR') {
        console.error('WebView Error:', data.message, 'Line:', data.line);
        Alert.alert('Map Error', `Map initialization failed: ${data.message}`);
      } else if (data.type === 'COMPASS_UPDATE') {
        // Update heading from device compass
        setHeading(data.heading);
        console.log('Compass heading:', data.heading);
      } else if (data.type === 'MAP_READY') {
        console.log('Map is ready!');
        setMapReady(true);
        
        // Draw the route on the map
        if (routeCoordinates && routeCoordinates.length > 0) {
          const pathCoords = routeCoordinates.map(coord => 
            `{lat: ${coord.latitude}, lng: ${coord.longitude}}`
          ).join(',');
          
          const jsCode = `
            if (window.routePath) {
              window.routePath.setMap(null);
            }
            
            window.routePath = new google.maps.Polyline({
              path: [${pathCoords}],
              geodesic: true,
              strokeColor: '${THEME_COLORS.SAFETY_GREEN}',
              strokeOpacity: 1.0,
              strokeWeight: 6
            });
            
            window.routePath.setMap(map);
            
            // Add destination marker
            if (window.destinationMarker) {
              window.destinationMarker.setMap(null);
            }
            
            window.destinationMarker = new google.maps.Marker({
              position: { lat: ${destinationCoords.latitude}, lng: ${destinationCoords.longitude} },
              map: map,
              icon: {
                path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z',
                fillColor: '#EF4444',
                fillOpacity: 1,
                strokeColor: '#FFFFFF',
                strokeWeight: 2,
                scale: 1.5,
                anchor: new google.maps.Point(12, 22)
              },
              title: 'Destination'
            });
            
            // Fit bounds to show entire route
            const bounds = new google.maps.LatLngBounds();
            ${routeCoordinates.map(coord => 
              `bounds.extend({lat: ${coord.latitude}, lng: ${coord.longitude}});`
            ).join('\n            ')}
            map.fitBounds(bounds);
            
            // Zoom in a bit after fitting
            setTimeout(() => {
              const currentZoom = map.getZoom();
              map.setZoom(currentZoom > 15 ? currentZoom : 15);
            }, 100);
            
            true;
          `;
          
          setTimeout(() => {
            webViewRef.current?.injectJavaScript(jsCode);
          }, 500);
        }
      }
    } catch (error) {
      // Silently handle parsing errors
    }
  };

  const startLat = currentLocation?.latitude || routeCoordinates?.[0]?.latitude || destinationCoords.latitude || 0;
  const startLng = currentLocation?.longitude || routeCoordinates?.[0]?.longitude || destinationCoords.longitude || 0;

  const apiKey = GOOGLE_MAPS_API_KEY || 'AIzaSyASprxP5RkR-UaRrK1_xTsZeda7zgKrAkM';
  
  console.log('LiveNavigationScreen - API Key:', apiKey ? 'Present' : 'Missing');
  console.log('LiveNavigationScreen - Destination:', destinationCoords);
  console.log('LiveNavigationScreen - Route Coordinates:', routeCoordinates?.length || 0);
  
  const mapHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <style>
          * { margin: 0; padding: 0; }
          html, body, #map { height: 100%; width: 100%; }
        </style>
        <script src="https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry"></script>
      </head>
      <body>
        <div id="map"></div>
        <script>
          let map;
          
          window.onerror = function(msg, url, line, col, error) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ 
              type: 'ERROR', 
              message: msg,
              line: line
            }));
            return false;
          };
          
          function initMap() {
            map = new google.maps.Map(document.getElementById('map'), {
              center: { lat: ${startLat}, lng: ${startLng} },
              zoom: 15,
              mapTypeId: '${mapStyle}',
              disableDefaultUI: true,
              zoomControl: false,
              mapTypeControl: false,
              scaleControl: false,
              streetViewControl: false,
              rotateControl: false,
              fullscreenControl: false,
              styles: []
            });
            
            // Add current location marker with direction arrow (pointing up/north)
            window.userMarker = new google.maps.Marker({
              position: { lat: ${startLat}, lng: ${startLng} },
              map: map,
              icon: {
                // Arrow shape: Triangle pointing up with a tail
                path: 'M 0,-20 L 8,0 L 0,-4 L -8,0 Z',
                scale: 1.2,
                fillColor: '#4285F4',
                fillOpacity: 1,
                strokeColor: '#FFFFFF',
                strokeWeight: 2,
                rotation: 0,
                anchor: new google.maps.Point(0, 0)
              },
              zIndex: 1000,
              optimized: false // Important for rotation to work smoothly
            });
            
            // Add a blue pulse circle around the marker for better visibility
            window.userCircle = new google.maps.Circle({
              map: map,
              center: { lat: ${startLat}, lng: ${startLng} },
              radius: 8, // 8 meters radius
              fillColor: '#4285F4',
              fillOpacity: 0.2,
              strokeColor: '#4285F4',
              strokeOpacity: 0.5,
              strokeWeight: 1,
              zIndex: 999
            });
            
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'MAP_READY' }));
            
            // Start device orientation tracking for compass
            if (window.DeviceOrientationEvent) {
              // Request permission for iOS 13+
              if (typeof DeviceOrientationEvent.requestPermission === 'function') {
                DeviceOrientationEvent.requestPermission()
                  .then(permissionState => {
                    if (permissionState === 'granted') {
                      window.addEventListener('deviceorientationabsolute', handleOrientation, true);
                    } else {
                      window.addEventListener('deviceorientation', handleOrientation, true);
                    }
                  })
                  .catch(console.error);
              } else {
                // Non iOS 13+ devices
                if ('ondeviceorientationabsolute' in window) {
                  window.addEventListener('deviceorientationabsolute', handleOrientation, true);
                } else {
                  window.addEventListener('deviceorientation', handleOrientation, true);
                }
              }
            }
          }
          
          // Handle device orientation for compass
          function handleOrientation(event) {
            let compassHeading;
            
            if (event.webkitCompassHeading) {
              // iOS
              compassHeading = event.webkitCompassHeading;
            } else if (event.absolute && event.alpha !== null) {
              // Android and others
              compassHeading = 360 - event.alpha;
            } else if (event.alpha !== null) {
              compassHeading = 360 - event.alpha;
            } else {
              return; // No heading available
            }
            
            // Update the marker rotation
            if (window.userMarker) {
              const icon = window.userMarker.getIcon();
              if (icon) {
                icon.rotation = compassHeading;
                window.userMarker.setIcon(icon);
              }
            }
            
            // Send heading back to React Native
            window.ReactNativeWebView.postMessage(JSON.stringify({ 
              type: 'COMPASS_UPDATE', 
              heading: compassHeading 
            }));
          }
          
          initMap();
        </script>
      </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      {/* Map View with WebView */}
      <WebView
        ref={webViewRef}
        source={{ html: mapHTML }}
        style={styles.map}
        onMessage={handleWebViewMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('WebView Error:', nativeEvent);
          setMapError('Failed to load map');
          setIsMapLoading(false);
          Alert.alert('Map Loading Error', 'Failed to load the map. Please check your internet connection.');
        }}
        onHttpError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('HTTP Error:', nativeEvent.statusCode);
          setMapError(`HTTP Error: ${nativeEvent.statusCode}`);
          setIsMapLoading(false);
        }}
        onLoadStart={() => {
          console.log('WebView loading started');
          setIsMapLoading(true);
        }}
        onLoadEnd={() => {
          console.log('WebView loading ended');
          setIsMapLoading(false);
        }}
        renderLoading={() => (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
            <Ionicons name="map" size={48} color={colors.textSecondary} />
            <Text style={{ color: colors.text, marginTop: 16, fontSize: 16 }}>Loading map...</Text>
            <Text style={{ color: colors.textSecondary, marginTop: 8, fontSize: 12 }}>Please wait</Text>
          </View>
        )}
      />

      {/* Loading Overlay */}
      {isMapLoading && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', zIndex: 999 }]}>
          <Ionicons name="map" size={64} color="#FFFFFF" />
          <Text style={{ color: '#FFFFFF', marginTop: 20, fontSize: 18, fontWeight: '600' }}>Loading Navigation...</Text>
          <Text style={{ color: '#FFFFFF', marginTop: 8, fontSize: 14 }}>Initializing map and GPS</Text>
        </View>
      )}

      {/* Error Overlay */}
      {mapError && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: 20 }]}>
          <Ionicons name="alert-circle" size={64} color={THEME_COLORS.DANGER_RED} />
          <Text style={{ color: colors.text, marginTop: 20, fontSize: 18, fontWeight: '600', textAlign: 'center' }}>Unable to Load Map</Text>
          <Text style={{ color: colors.textSecondary, marginTop: 12, fontSize: 14, textAlign: 'center' }}>{mapError}</Text>
          <TouchableOpacity 
            style={{ marginTop: 24, backgroundColor: THEME_COLORS.SAFETY_GREEN, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 8 }}
            onPress={() => {
              setMapError(null);
              setIsMapLoading(true);
              // Force reload
              if (webViewRef.current) {
                webViewRef.current.reload();
              }
            }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={{ marginTop: 16, paddingHorizontal: 32, paddingVertical: 12 }}
            onPress={() => navigation.goBack()}
          >
            <Text style={{ color: colors.textSecondary, fontSize: 16 }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Top Instruction Card */}
      <View style={[styles.instructionCard, { backgroundColor: THEME_COLORS.SAFETY_GREEN }]}>
        <View style={styles.instructionHeader}>
          <View style={styles.maneuverIconContainer}>
            <Ionicons name={getManeuverIcon(currentInstruction.maneuver)} size={32} color="#FFFFFF" />
          </View>
          <View style={styles.instructionDetails}>
            <Text style={styles.distanceText}>{currentInstruction.distance || '180 m'}</Text>
            <Text style={styles.instructionText} numberOfLines={2}>
              {currentInstruction.text || 'Turn left'}
            </Text>
          </View>
          <TouchableOpacity style={styles.voiceButton}>
            <Ionicons name="volume-high" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Next instruction preview */}
        {instructions && instructions.length > 1 && (
          <View style={styles.nextInstruction}>
            <Ionicons name="arrow-forward" size={16} color="rgba(255,255,255,0.8)" />
            <Text style={styles.nextInstructionText}>
              Then {instructions[1]?.instruction || instructions[1]?.text || 'continue straight'}
            </Text>
          </View>
        )}
      </View>

      {/* Bottom Info Bar */}
      <View style={[styles.bottomBar, { backgroundColor: colors.surface }]}>
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Ionicons name="time-outline" size={20} color={colors.text} />
            <Text style={[styles.infoValue, { color: colors.text }]}>{eta}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoItem}>
            <Ionicons name="navigate-outline" size={20} color={colors.text} />
            <Text style={[styles.infoValue, { color: colors.text }]}>{remainingDistance}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoItem}>
            <MaterialCommunityIcons name="clock-end" size={20} color={colors.text} />
            <Text style={[styles.infoValue, { color: colors.text }]}>5:35 am</Text>
          </View>
        </View>
      </View>

      {/* Cancel/Exit Button */}
      <TouchableOpacity 
        style={[styles.cancelButton, { backgroundColor: colors.surface }]}
        onPress={handleCancelNavigation}
      >
        <Ionicons name="close" size={28} color={colors.text} />
      </TouchableOpacity>

      {/* Re-center Button */}
      <TouchableOpacity 
        style={[styles.recenterButton, { backgroundColor: colors.surface }]}
        onPress={() => {
          if (currentLocation && webViewRef.current && mapReady) {
            const jsCode = `
              if (map && window.userMarker) {
                map.panTo({ lat: ${currentLocation.latitude}, lng: ${currentLocation.longitude} });
                map.setZoom(17);
              }
              true;
            `;
            webViewRef.current.injectJavaScript(jsCode);
          }
        }}
      >
        <MaterialCommunityIcons name="crosshairs-gps" size={24} color={colors.text} />
      </TouchableOpacity>

      {/* Compass Indicator */}
      <View style={[styles.compassContainer, { backgroundColor: colors.surface }]}>
        <View style={[styles.compassCircle, { transform: [{ rotate: `${-heading}deg` }] }]}>
          <View style={styles.compassNorth}>
            <Text style={styles.compassN}>N</Text>
          </View>
          <View style={styles.compassArrow} />
        </View>
        <Text style={[styles.compassDegree, { color: colors.text }]}>{Math.round(heading)}°</Text>
      </View>

      {/* Map Controls */}
      <View style={[styles.mapControls, { backgroundColor: colors.surface }]}>
        <TouchableOpacity 
          style={styles.controlButton}
          onPress={() => setShowMapStyleModal(true)}
        >
          <Ionicons name="layers-outline" size={24} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.controlButton}
          onPress={() => {
            setVoiceEnabled(!voiceEnabled);
            Alert.alert(
              voiceEnabled ? 'Voice Muted' : 'Voice Enabled',
              voiceEnabled ? 'Turn-by-turn voice instructions are now off' : 'Turn-by-turn voice instructions are now on'
            );
          }}
        >
          <Ionicons 
            name={voiceEnabled ? "volume-high" : "volume-mute"} 
            size={24} 
            color={voiceEnabled ? THEME_COLORS.SAFETY_GREEN : colors.textSecondary} 
          />
        </TouchableOpacity>
      </View>

      {/* Map Style Modal */}
      <Modal
        visible={showMapStyleModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMapStyleModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMapStyleModal(false)}
        >
          <View style={[styles.mapStyleModal, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Map Style</Text>
            
            {[
              { id: 'roadmap', name: 'Standard', icon: 'map-outline', desc: 'Default road map' },
              { id: 'satellite', name: 'Satellite', icon: 'earth-outline', desc: 'Satellite imagery' },
              { id: 'terrain', name: 'Terrain', icon: 'trail-sign-outline', desc: 'Topographic view' },
              { id: 'hybrid', name: 'Hybrid', icon: 'layers-outline', desc: 'Satellite with labels' }
            ].map((style) => (
              <TouchableOpacity
                key={style.id}
                style={[
                  styles.mapStyleOption,
                  { borderColor: colors.border },
                  mapStyle === style.id && { 
                    backgroundColor: THEME_COLORS.SAFETY_GREEN + '20',
                    borderColor: THEME_COLORS.SAFETY_GREEN 
                  }
                ]}
                onPress={() => {
                  setMapStyle(style.id);
                  if (webViewRef.current && mapReady) {
                    const jsCode = `
                      if (map) {
                        map.setMapTypeId('${style.id}');
                      }
                      true;
                    `;
                    webViewRef.current.injectJavaScript(jsCode);
                  }
                  setShowMapStyleModal(false);
                }}
              >
                <View style={styles.mapStyleIconContainer}>
                  <Ionicons 
                    name={style.icon} 
                    size={28} 
                    color={mapStyle === style.id ? THEME_COLORS.SAFETY_GREEN : colors.text} 
                  />
                </View>
                <View style={styles.mapStyleInfo}>
                  <Text style={[
                    styles.mapStyleName, 
                    { color: colors.text },
                    mapStyle === style.id && { fontWeight: '700', color: THEME_COLORS.SAFETY_GREEN }
                  ]}>
                    {style.name}
                  </Text>
                  <Text style={[styles.mapStyleDesc, { color: colors.textSecondary }]}>
                    {style.desc}
                  </Text>
                </View>
                {mapStyle === style.id && (
                  <Ionicons name="checkmark-circle" size={24} color={THEME_COLORS.SAFETY_GREEN} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Live GPS Tracking Indicator */}
      <View style={[styles.gpsIndicator, { backgroundColor: THEME_COLORS.SAFETY_GREEN }]}>
        <View style={styles.gpsPulse} />
        <Ionicons name="navigate" size={14} color="#FFFFFF" style={{ transform: [{ rotate: `${heading}deg` }] }} />
        <Text style={styles.gpsText}>LIVE</Text>
        <Text style={styles.headingText}>{Math.round(heading)}°</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  instructionCard: {
    position: 'absolute',
    top: STATUS_BAR_HEIGHT + 10,
    left: 16,
    right: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  instructionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  maneuverIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructionDetails: {
    flex: 1,
  },
  distanceText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  instructionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  voiceButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextInstruction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
  },
  nextInstructionText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: '#E5E7EB',
  },
  cancelButton: {
    position: 'absolute',
    top: STATUS_BAR_HEIGHT + 10,
    left: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  recenterButton: {
    position: 'absolute',
    right: 16,
    bottom: 120,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  mapControls: {
    position: 'absolute',
    right: 16,
    bottom: 180,
    borderRadius: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  controlButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gpsIndicator: {
    position: 'absolute',
    top: STATUS_BAR_HEIGHT + 180,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  gpsPulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    opacity: 0.8,
  },
  gpsText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  headingText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    opacity: 0.9,
  },
  compassContainer: {
    position: 'absolute',
    top: STATUS_BAR_HEIGHT + 10,
    right: 16,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  compassCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  compassNorth: {
    position: 'absolute',
    top: 2,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compassN: {
    fontSize: 14,
    fontWeight: '900',
    color: THEME_COLORS.ALERT_RED,
  },
  compassArrow: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderBottomWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: THEME_COLORS.ALERT_RED,
    position: 'absolute',
    top: 8,
  },
  compassDegree: {
    fontSize: 9,
    fontWeight: '600',
    position: 'absolute',
    bottom: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapStyleModal: {
    width: '85%',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  mapStyleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 12,
    gap: 12,
  },
  mapStyleIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapStyleInfo: {
    flex: 1,
  },
  mapStyleName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  mapStyleDesc: {
    fontSize: 13,
  },
});

export default LiveNavigationScreen;
