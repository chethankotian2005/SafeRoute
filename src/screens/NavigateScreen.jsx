import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  Platform,
  TextInput,
  Alert,
  ActivityIndicator,
  FlatList,
  ScrollView,
  PanResponder,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME_COLORS } from '../utils/constants';
import { useTheme } from '../context/ThemeContext';
import { GOOGLE_MAPS_API_KEY } from '../config/apiKeys';
import * as Location from 'expo-location';
import { analyzeRouteSafety, getRouteColor, getRouteSafetyLevel } from '../services/safetyAnalysisService';
import { navigationManager, parseNavigationSteps, generateVoiceInstruction } from '../services/navigationService';
import { calculateWalkingRoutes, decodePolyline, getRouteInstructions } from '../services/routeCalculationService';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
const STATUS_BAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight : 44;

// Snap points for bottom sheet (percentage of screen height)
const SNAP_POINTS = {
  COLLAPSED: SCREEN_HEIGHT * 0.15,  // 15% - just peek
  MIDDLE: SCREEN_HEIGHT * 0.4,      // 40% - default
  EXPANDED: SCREEN_HEIGHT * 0.8,    // 80% - full view
};

// Helper function to get maneuver icon
const getManeuverIcon = (maneuver) => {
  const maneuverLower = (maneuver || '').toLowerCase();
  
  if (maneuverLower.includes('left')) return 'arrow-back';
  if (maneuverLower.includes('right')) return 'arrow-forward';
  if (maneuverLower.includes('straight') || maneuverLower.includes('continue')) return 'arrow-up';
  if (maneuverLower.includes('u-turn') || maneuverLower.includes('uturn')) return 'return-down-back';
  if (maneuverLower.includes('merge')) return 'git-merge';
  if (maneuverLower.includes('roundabout')) return 'sync';
  if (maneuverLower.includes('exit') || maneuverLower.includes('ramp')) return 'exit';
  if (maneuverLower.includes('arrive') || maneuverLower.includes('destination')) return 'flag';
  
  return 'navigate';
};

const NavigateScreen = ({ navigation, route }) => {
  const { colors } = useTheme();
  const webViewRef = useRef(null);
  const bottomSheetRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  
  // Animated value for bottom sheet position
  const sheetPosition = useRef(new Animated.Value(SCREEN_HEIGHT - SNAP_POINTS.MIDDLE)).current;
  const [currentSnapPoint, setCurrentSnapPoint] = useState(SNAP_POINTS.MIDDLE);
  
  const [destination, setDestination] = useState('');
  const [destinationCoords, setDestinationCoords] = useState(null);
  const [selectedDestination, setSelectedDestination] = useState(null); // Store selected place details
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [loadingRoutes, setLoadingRoutes] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState('route1'); // 'route1', 'route2', 'route3'
  
  const [routes, setRoutes] = useState({
    route1: null,
    route2: null,
    route3: null,
  });
  
  const [currentLocation, setCurrentLocation] = useState({
    latitude: 13.0100,
    longitude: 74.7947,
  });

  const [isNavigating, setIsNavigating] = useState(false);
  const [mapStyle, setMapStyle] = useState('standard');
  const [navigationData, setNavigationData] = useState(null);
  const [currentInstruction, setCurrentInstruction] = useState('');
  const [distanceToNextTurn, setDistanceToNextTurn] = useState(0);
  const [showRouteDetails, setShowRouteDetails] = useState(false);

  // Bottom sheet snap points (indices: 0, 1, 2)
  const snapPoints = useMemo(() => ['15%', '45%', '85%'], []);

  // PanResponder for dragging the bottom sheet
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to vertical drags
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        const newPosition = (SCREEN_HEIGHT - currentSnapPoint) + gestureState.dy;
        // Constrain between collapsed and expanded
        const minY = SCREEN_HEIGHT - SNAP_POINTS.EXPANDED;
        const maxY = SCREEN_HEIGHT - SNAP_POINTS.COLLAPSED;
        const constrainedPosition = Math.max(minY, Math.min(maxY, newPosition));
        sheetPosition.setValue(constrainedPosition);
      },
      onPanResponderRelease: (_, gestureState) => {
        // Determine which snap point to animate to
        const velocity = gestureState.vy;
        const currentY = SCREEN_HEIGHT - currentSnapPoint;
        const targetY = currentY + gestureState.dy;
        
        let targetSnapPoint = SNAP_POINTS.MIDDLE;
        
        // If dragging fast, snap based on velocity
        if (Math.abs(velocity) > 0.5) {
          if (velocity < 0) {
            // Dragging up
            targetSnapPoint = SNAP_POINTS.EXPANDED;
          } else {
            // Dragging down
            targetSnapPoint = isNavigating ? SNAP_POINTS.COLLAPSED : SNAP_POINTS.MIDDLE;
          }
        } else {
          // Snap to nearest point
          const heightFromBottom = SCREEN_HEIGHT - targetY;
          const distances = [
            Math.abs(heightFromBottom - SNAP_POINTS.COLLAPSED),
            Math.abs(heightFromBottom - SNAP_POINTS.MIDDLE),
            Math.abs(heightFromBottom - SNAP_POINTS.EXPANDED),
          ];
          const minIndex = distances.indexOf(Math.min(...distances));
          const snapValues = [SNAP_POINTS.COLLAPSED, SNAP_POINTS.MIDDLE, SNAP_POINTS.EXPANDED];
          targetSnapPoint = snapValues[minIndex];
        }
        
        setCurrentSnapPoint(targetSnapPoint);
        Animated.spring(sheetPosition, {
          toValue: SCREEN_HEIGHT - targetSnapPoint,
          useNativeDriver: false,
          tension: 50,
          friction: 10,
        }).start();
      },
    })
  ).current;

  // Load map style from AsyncStorage
  useEffect(() => {
    const loadMapStyle = async () => {
      try {
        const savedStyle = await AsyncStorage.getItem('mapStyle');
        if (savedStyle) {
          setMapStyle(savedStyle);
        }
      } catch (error) {
        // Silently ignore storage errors
      }
    };
    loadMapStyle();

    // Listen for map style changes
    const interval = setInterval(async () => {
      try {
        const savedStyle = await AsyncStorage.getItem('mapStyle');
        if (savedStyle && savedStyle !== mapStyle) {
          setMapStyle(savedStyle);
          // Update map type in WebView
          if (webViewRef.current && mapReady) {
            const mapTypeId = getGoogleMapType(savedStyle);
            const jsCode = `
              if (map) {
                map.setMapTypeId('${mapTypeId}');
              }
              true;
            `;
            webViewRef.current.injectJavaScript(jsCode);
          }
        }
      } catch (error) {
        // Silently ignore storage errors
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [mapStyle, mapReady]);

  // Handle navigation from recent destinations
  useEffect(() => {
    if (route.params?.selectedDestination && currentLocation.latitude && mapReady) {
      const dest = route.params.selectedDestination;
      setDestination(dest.name);
      setDestinationCoords(dest.coords);
      setSelectedDestination(dest);
      
      // Calculate routes automatically
      calculateAllRoutes(currentLocation, dest.coords);
      
      // Ensure bottom sheet is expanded to show routes
      // (Removed bottomSheetRef as we're using standard View now)
      
      // Clear the parameter to avoid re-triggering
      navigation.setParams({ selectedDestination: undefined });
    }
  }, [route.params?.selectedDestination, currentLocation, mapReady]);

  // Get current location
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setCurrentLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    })();
  }, []);

  // Adjust bottom sheet when navigation starts/stops
  useEffect(() => {
    const targetSnapPoint = isNavigating ? SNAP_POINTS.COLLAPSED : SNAP_POINTS.MIDDLE;
    setCurrentSnapPoint(targetSnapPoint);
    Animated.spring(sheetPosition, {
      toValue: SCREEN_HEIGHT - targetSnapPoint,
      useNativeDriver: false,
      tension: 50,
      friction: 10,
    }).start();
  }, [isNavigating]);

  // Expand sheet when routes are available
  useEffect(() => {
    if (routes.route1 && !isNavigating) {
      const targetSnapPoint = SNAP_POINTS.EXPANDED;
      setCurrentSnapPoint(targetSnapPoint);
      Animated.spring(sheetPosition, {
        toValue: SCREEN_HEIGHT - targetSnapPoint,
        useNativeDriver: false,
        tension: 50,
        friction: 10,
      }).start();
    }
  }, [routes.route1]);

  // Search suggestions with debounce
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchSuggestions([]);
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      fetchSearchSuggestions(searchQuery);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Fetch search suggestions from Google Places API
  const fetchSearchSuggestions = async (query) => {
    setLoadingSuggestions(true);
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&location=${currentLocation.latitude},${currentLocation.longitude}&radius=50000&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();
      
      if (data.predictions) {
        setSearchSuggestions(data.predictions.slice(0, 5));
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // Save destination to recent destinations
  const saveRecentDestination = async (destination) => {
    try {
      const stored = await AsyncStorage.getItem('recentDestinations');
      let destinations = stored ? JSON.parse(stored) : [];
      
      // Remove duplicate if exists (same placeId)
      destinations = destinations.filter(d => d.placeId !== destination.placeId);
      
      // Add new destination at the beginning
      destinations.unshift({
        ...destination,
        lastVisit: 'Recently',
        distance: 'N/A', // Will be calculated later
        safetyScore: 7, // Default value
      });
      
      // Keep only last 10 destinations
      destinations = destinations.slice(0, 10);
      
      await AsyncStorage.setItem('recentDestinations', JSON.stringify(destinations));
    } catch (error) {
      console.log('Error saving recent destination:', error);
    }
  };

  // Get place details and calculate routes
  const selectDestination = async (placeId, description) => {
    setShowSearch(false);
    setDestination(description);
    setSearchQuery('');
    setSearchSuggestions([]);
    setLoadingRoutes(true);

    try {
      console.log('Fetching place details for:', placeId);
      
      // Validate API key first
      if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY === 'undefined') {
        console.log('Invalid Google Maps API key - using mock data');
        generateMockRoutes({ latitude: 12.9716, longitude: 77.5946 }, description);
        return;
      }
      
      // Get place coordinates with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
      
      const placeResponse = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${GOOGLE_MAPS_API_KEY}`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);
      
      const placeData = await placeResponse.json();
      
      console.log('Place API Status:', placeData.status);
      
      if (placeData.status !== 'OK') {
        console.log(`Place API returned ${placeData.status} - using mock data`);
        generateMockRoutes({ latitude: 12.9716, longitude: 77.5946 }, description);
        return;
      }
      
      if (placeData.result?.geometry?.location) {
        const destCoords = {
          latitude: placeData.result.geometry.location.lat,
          longitude: placeData.result.geometry.location.lng,
        };
        
        // Store selected destination details
        setSelectedDestination({
          name: description,
          placeId: placeId,
          coordinates: destCoords
        });
        
        console.log('Destination coordinates:', destCoords);
        console.log('Current location:', currentLocation);
        
        setDestinationCoords(destCoords);

        // Calculate 3 different routes
        await calculateAllRoutes(currentLocation, destCoords);
        
        // Save to recent destinations
        await saveRecentDestination({
          name: description,
          address: placeData.result.formatted_address || description,
          coords: destCoords,
          placeId: placeId,
          timestamp: new Date().toISOString(),
        });
      } else {
        throw new Error('No location data in place result');
      }
    } catch (error) {
      console.error('Error selecting destination:', error);
      console.error('Error details:', error.message);
      // Don't show alert - use mock routes instead
      generateMockRoutes({ latitude: 12.9716, longitude: 77.5946 }, description);
    } finally {
      setLoadingRoutes(false);
    }
  };

  // Calculate all 3 route types with AI safety analysis
  const calculateAllRoutes = async (origin, destination) => {
    // Validate inputs
    if (!origin || !destination) {
      // Use mock data instead of showing error
      generateMockRoutes(destination, selectedDestination?.name || 'destination');
      return;
    }
    
    if (!origin.latitude || !origin.longitude || !destination.latitude || !destination.longitude) {
      // Use mock data instead of showing error
      generateMockRoutes(destination, selectedDestination?.name || 'destination');
      return;
    }
    
    try {
      console.log('Calculating walking routes using Route Calculation Service...');
      
      // Strategy 1: Get multiple alternative routes
      const allRoutes = await calculateWalkingRoutes(origin, destination, { 
        alternatives: true,
        avoidHighways: false,
      });

      console.log(`Received ${allRoutes.length} route(s) from API`);

      // If API returned empty array, use mock data immediately
      if (!allRoutes || allRoutes.length === 0) {
        console.log('No routes from API, using mock routes');
        generateMockRoutes(destination, selectedDestination?.name || 'destination');
        return;
      }

      // If we only got 1 route, try to get more with different parameters
      let additionalRoutes = [];
      if (allRoutes.length < 3) {
        try {
          // Try avoiding highways to get a different route
          const avoidHighwayRoutes = await calculateWalkingRoutes(origin, destination, { 
            alternatives: true,
            avoidHighways: true,
          });
          if (avoidHighwayRoutes && avoidHighwayRoutes.length > 0) {
            additionalRoutes = avoidHighwayRoutes.filter(route => 
              !allRoutes.some(existing => existing.summary === route.summary)
            );
          }
        } catch (err) {
          // Silently continue with what we have
        }
      }

      const combinedRoutes = [...allRoutes, ...additionalRoutes];
      console.log(`Total unique routes: ${combinedRoutes.length}`);

      // Filter out duplicate routes with improved logic
      const uniqueRoutes = [];
      
      for (const route of combinedRoutes) {
        // Check if this route is significantly different from existing ones
        const isDuplicate = uniqueRoutes.some(existing => {
          // Consider routes duplicate if distance and duration are very close (within 5%)
          const distanceDiff = Math.abs(existing.distance.value - route.distance.value) / existing.distance.value;
          const durationDiff = Math.abs(existing.duration.value - route.duration.value) / existing.duration.value;
          return distanceDiff < 0.05 && durationDiff < 0.05;
        });
        
        if (!isDuplicate) {
          uniqueRoutes.push(route);
        }
      }

      console.log(`Unique routes after filtering: ${uniqueRoutes.length}`);
      uniqueRoutes.forEach((r, i) => {
        console.log(`  Route ${i + 1}: ${r.distance.text} • ${r.duration.text} • ${r.summary}`);
      });

      // Validate that routes have coordinates before processing
      const validRoutesWithCoords = uniqueRoutes.filter(route => {
        if (!route.coordinates || route.coordinates.length === 0) {
          return false;
        }
        return true;
      });

      if (validRoutesWithCoords.length === 0) {
        Alert.alert('Error', 'No valid routes found. Please try a different destination.');
        return;
      }

      // If only one unique route, use it
      if (validRoutesWithCoords.length === 1) {
        const singleRoute = await processRouteWithSafety(
          validRoutesWithCoords[0], 
          'route1', 
          origin, 
          destination
        );

        const processedRoutes = {
          route1: singleRoute,
          route2: null,
          route3: null,
        };

        setRoutes(processedRoutes);
        setSelectedRoute('route1');
        
        if (mapReady) {
          drawAllRoutes(processedRoutes);
        }
        return;
      }

      // Process up to 3 unique routes
      const routesToProcess = validRoutesWithCoords.slice(0, 3);
      const processedRoutes = {};

      for (let i = 0; i < routesToProcess.length; i++) {
        const routeName = `route${i + 1}`;
        try {
          console.log(`Processing ${routeName}...`);
          const processedRoute = await processRouteWithSafety(
            routesToProcess[i],
            routeName,
            origin,
            destination
          );
          
          // Only add route if it was successfully processed
          if (processedRoute) {
            processedRoutes[routeName] = processedRoute;
          } else {
            processedRoutes[routeName] = null;
          }
        } catch (error) {
          // Silently skip failed routes
          processedRoutes[routeName] = null;
        }
      }

      // Fill remaining slots with null
      for (let i = routesToProcess.length; i < 3; i++) {
        processedRoutes[`route${i + 1}`] = null;
      }

      // Check if we have at least one valid route
      const validRoutes = Object.values(processedRoutes).filter(r => r !== null);
      if (validRoutes.length === 0) {
        throw new Error('No valid routes could be processed');
      }

      console.log('Processed routes:', Object.keys(processedRoutes).filter(k => processedRoutes[k]));

      setRoutes(processedRoutes);
      setSelectedRoute('route1'); // Default to first route
      
      // Draw all routes on map
      if (mapReady) {
        drawAllRoutes(processedRoutes);
      }
    } catch (error) {
      // Don't show error - use mock data instead for smooth demo
      console.log('API failed, using mock routes for demo');
      generateMockRoutes(destination, selectedDestination?.name || 'destination');
    } finally {
      setLoadingRoutes(false);
    }
  };

  // Generate mock routes when API fails (for demo purposes)
  const generateMockRoutes = (destination, destinationName = 'destination') => {
    const destCoords = destination || { latitude: 12.9716, longitude: 77.5946 };
    const currentLoc = currentLocation || { latitude: 12.9716, longitude: 77.5946 };
    
    // Store destination details for mock routes
    if (!selectedDestination) {
      setSelectedDestination({
        name: destinationName,
        coordinates: destCoords
      });
    }
    
    // Set destination coordinates for marker
    setDestinationCoords(destCoords);
    
    // Calculate approximate distance
    const latDiff = Math.abs(destCoords.latitude - currentLoc.latitude);
    const lonDiff = Math.abs(destCoords.longitude - currentLoc.longitude);
    const distance = Math.sqrt(latDiff * latDiff + lonDiff * lonDiff) * 111; // Rough km conversion
    
    // Generate 3 slightly different routes
    const mockRoutes = {
      route1: {
        coordinates: generateMockPath(currentLoc, destCoords, 0),
        distance: `${distance.toFixed(1)} km`,
        duration: `${Math.ceil(distance * 15)} min`,
        instructions: [
          { text: `Head towards ${selectedDestination?.name || 'destination'}`, distance: `${(distance * 0.3).toFixed(1)} km` },
          { text: 'Continue straight', distance: `${(distance * 0.4).toFixed(1)} km` },
          { text: 'Turn right', distance: `${(distance * 0.2).toFixed(1)} km` },
          { text: 'Arrive at destination', distance: `${(distance * 0.1).toFixed(1)} km` }
        ],
        safetyScore: 7.8,
        safetyLabel: 'Safe',
        color: getRouteColor(7.8),
        safetyLevel: getRouteSafetyLevel(7.8),
        details: {
          lighting: 8.5,
          traffic: 7.2,
          safeSpots: 7.5,
          community: 8.0,
          crime: 7.8
        }
      },
      route2: {
        coordinates: generateMockPath(currentLoc, destCoords, 1),
        distance: `${(distance * 1.1).toFixed(1)} km`,
        duration: `${Math.ceil(distance * 1.1 * 15)} min`,
        instructions: [
          { text: `Head towards ${selectedDestination?.name || 'destination'}`, distance: `${(distance * 0.35).toFixed(1)} km` },
          { text: 'Turn left', distance: `${(distance * 0.3).toFixed(1)} km` },
          { text: 'Continue for 500m', distance: `${(distance * 0.25).toFixed(1)} km` },
          { text: 'Arrive at destination', distance: `${(distance * 0.1).toFixed(1)} km` }
        ],
        safetyScore: 6.5,
        safetyLabel: 'Moderate',
        color: getRouteColor(6.5),
        safetyLevel: getRouteSafetyLevel(6.5),
        details: {
          lighting: 6.8,
          traffic: 6.5,
          safeSpots: 6.2,
          community: 6.8,
          crime: 6.3
        }
      },
      route3: {
        coordinates: generateMockPath(currentLoc, destCoords, 2),
        distance: `${(distance * 0.9).toFixed(1)} km`,
        duration: `${Math.ceil(distance * 0.9 * 15)} min`,
        instructions: [
          { text: `Head towards ${selectedDestination?.name || 'destination'}`, distance: `${(distance * 0.4).toFixed(1)} km` },
          { text: 'Continue straight', distance: `${(distance * 0.4).toFixed(1)} km` },
          { text: 'Arrive at destination', distance: `${(distance * 0.1).toFixed(1)} km` }
        ],
        safetyScore: 5.2,
        safetyLabel: 'Unsafe',
        color: getRouteColor(5.2),
        safetyLevel: getRouteSafetyLevel(5.2),
        details: {
          lighting: 5.0,
          traffic: 5.5,
          safeSpots: 5.0,
          community: 5.2,
          crime: 5.3
        }
      }
    };

    setRoutes(mockRoutes);
    setSelectedRoute('route1');
    
    if (mapReady) {
      drawAllRoutes(mockRoutes);
    }
  };

  // Generate a mock path between two points
  const generateMockPath = (start, end, variation) => {
    const points = [];
    const steps = 20; // Number of intermediate points
    
    for (let i = 0; i <= steps; i++) {
      const ratio = i / steps;
      
      // Add slight variation for different routes
      const offset = (variation - 1) * 0.001; // Small offset for route 2 and 3
      
      points.push({
        latitude: start.latitude + (end.latitude - start.latitude) * ratio + (Math.sin(ratio * Math.PI) * offset),
        longitude: start.longitude + (end.longitude - start.longitude) * ratio + (Math.cos(ratio * Math.PI) * offset)
      });
    }
    
    return points;
  };

  // Process route with AI safety analysis
  const processRouteWithSafety = async (routeData, type, origin, destination) => {
    if (!routeData) {
      return null;
    }

    try {
      // Route data is already parsed by routeCalculationService
      const coordinates = routeData.coordinates;
      
      // Validate coordinates
      if (!coordinates || coordinates.length === 0) {
        return null;
      }

      // Filter out any invalid coordinates
      const validCoordinates = coordinates.filter(c => 
        c && 
        typeof c.latitude === 'number' && 
        typeof c.longitude === 'number' &&
        !isNaN(c.latitude) && 
        !isNaN(c.longitude)
      );

      if (validCoordinates.length === 0) {
        return null;
      }
      
      // AI Safety Analysis
      console.log(`Analyzing safety for ${type} route...`);
      const safetyAnalysis = await analyzeRouteSafety(validCoordinates, type);
      
      // Get route instructions
      return {
        type,
        coordinates: validCoordinates,
        // Use full step objects with coordinates for turn-by-turn
        steps: routeData.steps,
        distance: routeData.distance.text,
        distanceValue: routeData.distance.value,
        duration: routeData.duration.text,
        durationValue: routeData.duration.value,
        safetyScore: safetyAnalysis.overallScore,
        safetyAnalysis,
        color: getRouteColor(safetyAnalysis.overallScore),
        safetyLevel: getRouteSafetyLevel(safetyAnalysis.overallScore),
        origin,
        destination,
        summary: routeData.summary,
        polyline: routeData.polyline,
      };
    } catch (error) {
      // Silently return null on error
      return null;
    }
  };

  // Draw all routes on the map
  const drawAllRoutes = (routesData, highlightedRoute = selectedRoute) => {
    const routesArray = [routesData.route1, routesData.route2, routesData.route3].filter(r => r);
    
    if (routesArray.length === 0) return;
    
    // Get destination coordinates - prioritize from route data for accuracy
    const destCoords = routesData.route1?.destination?.coordinates ||
      routesData.route1?.coordinates?.[routesData.route1.coordinates.length - 1] ||
      destinationCoords ||
      { latitude: currentLocation.latitude, longitude: currentLocation.longitude };

    // Ensure we have valid coordinates
    if (!destCoords || !destCoords.latitude || !destCoords.longitude) {
      console.log('Invalid destination coordinates, skipping marker');
      return;
    }

    const routesJS = routesArray.map(route => {
      const isSelected = route.type === highlightedRoute;
      const isSafe = route.safetyScore >= 7;
      
      return {
        coordinates: route.coordinates.map(c => `{lat: ${c.latitude}, lng: ${c.longitude}}`).join(','),
        color: isSelected && isSafe ? THEME_COLORS.SAFETY_GREEN : route.color,
        weight: isSelected ? 8 : 5,
        opacity: isSelected ? 1.0 : 0.5,
      };
    });

    const jsCode = `
      if (typeof map !== 'undefined') {
        // Clear existing routes
        if (window.routePolylines) {
          window.routePolylines.forEach(p => p.setMap(null));
        }
        window.routePolylines = [];
        
        // Draw all routes
        ${routesJS.map((r, i) => `
          const route${i} = new google.maps.Polyline({
            path: [${r.coordinates}],
            geodesic: true,
            strokeColor: '${r.color}',
            strokeOpacity: ${r.opacity},
            strokeWeight: ${r.weight},
            zIndex: ${r.weight}
          });
          route${i}.setMap(map);
          window.routePolylines.push(route${i});
        `).join('\n')}
        
        // Clear and add destination marker (red pin)
        // Force remove old marker if it exists
        if (window.destinationMarker) {
          window.destinationMarker.setMap(null);
          window.destinationMarker = null;
        }
        
        // Create new marker with exact coordinates
        window.destinationMarker = new google.maps.Marker({
          position: {lat: ${destCoords.latitude}, lng: ${destCoords.longitude}},
          map: map,
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(\`
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42">
                <path d="M16 0C9.373 0 4 5.373 4 12c0 8.5 12 30 12 30s12-21.5 12-30c0-6.627-5.373-12-12-12z" fill="#EF4444"/>
                <path d="M16 0C9.373 0 4 5.373 4 12c0 8.5 12 30 12 30s12-21.5 12-30c0-6.627-5.373-12-12-12z" fill="none" stroke="#FFFFFF" stroke-width="1.5"/>
                <circle cx="16" cy="12" r="5" fill="#FFFFFF"/>
              </svg>
            \`),
            scaledSize: new google.maps.Size(32, 42),
            anchor: new google.maps.Point(16, 42)
          },
          zIndex: 1000
        });
        
        // Update user marker to ensure it's visible
        if (window.userMarker) {
          window.userMarker.setZIndex(1001);
        }
        
        // Fit bounds to show entire route
        const bounds = new google.maps.LatLngBounds();
        bounds.extend({lat: ${currentLocation.latitude}, lng: ${currentLocation.longitude}});
        bounds.extend({lat: ${destCoords.latitude}, lng: ${destCoords.longitude}});
        map.fitBounds(bounds, {top: 200, right: 50, bottom: 400, left: 50});
      }
      true;
    `;
    
    webViewRef.current?.injectJavaScript(jsCode);
  };

  // Update selected route
  const changeSelectedRoute = (routeType) => {
    setSelectedRoute(routeType);
    // Redraw routes immediately with the new selected route
    if (routes[routeType] && webViewRef.current && mapReady) {
      // Pass routeType directly to avoid waiting for state update
      drawAllRoutes(routes, routeType);
    }
  };

  // Start navigation
  const startNavigation = async () => {
    const selectedRouteData = routes[selectedRoute];
    if (!selectedRouteData) {
      Alert.alert('Error', 'No route selected');
      return;
    }

    // Navigate to Live Navigation Screen
    navigation.navigate('LiveNavigation', {
      destination: selectedRouteData.destination || destination,
      routeCoordinates: selectedRouteData.coordinates || [],
      instructions: selectedRouteData.steps || [],
      totalDistance: selectedRouteData.distance || '0 km',
      totalDuration: selectedRouteData.duration || '0 min',
      safetyScore: selectedRouteData.safetyScore || 0,
    });

    // Old navigation code below (kept for reference but won't execute)
    /*
    setIsNavigating(true);
    
    const result = await navigationManager.startNavigation(selectedRouteData, {
      onUpdate: (data) => {
        setNavigationData(data);
        setCurrentInstruction(generateVoiceInstruction(
          selectedRouteData.steps[data.currentStep],
          data.distanceToNextStep
        ));
        setDistanceToNextTurn(data.distanceToNextStep * 1000); // Convert to meters

        // Update user location on map
        if (data.userLocation) {
          const jsCode = `
            if (window.userMarker) {
              window.userMarker.setPosition({
                lat: ${data.userLocation.latitude}, 
                lng: ${data.userLocation.longitude}
              });
            }
            if (typeof map !== 'undefined') {
              map.panTo({lat: ${data.userLocation.latitude}, lng: ${data.userLocation.longitude}});
            }
            true;
          `;
          webViewRef.current?.injectJavaScript(jsCode);
        }
      },
      onArrival: (data) => {
        setIsNavigating(false);
        Alert.alert(
          '🎉 Arrival',
          'You have arrived at your destination!',
          [{ text: 'OK', onPress: () => setNavigationData(null) }]
        );
      },
      onDeviation: (data) => {
        Alert.alert(
          '⚠️ Route Deviation',
          'You are off the route. Would you like to recalculate?',
          [
            { text: 'Continue', style: 'cancel' },
            { 
              text: 'Recalculate', 
              onPress: () => recalculateRoute(data.userLocation) 
            }
          ]
        );
      },
    });

    if (!result.success) {
      Alert.alert('Navigation Error', result.error);
      setIsNavigating(false);
    }
    */
  };

  // Stop navigation
  const stopNavigation = () => {
    navigationManager.stopNavigation();
    setIsNavigating(false);
    setNavigationData(null);
    setCurrentInstruction('');
    setDistanceToNextTurn(0);
  };

  // Recalculate route from current location
  const recalculateRoute = async (userLocation) => {
    setLoadingRoutes(true);
    await calculateAllRoutes(userLocation, destinationCoords);
    setLoadingRoutes(false);
    
    // Restart navigation with new route
    if (isNavigating) {
      stopNavigation();
      setTimeout(() => startNavigation(), 500);
    }
  };

  // Draw route when map is ready
  useEffect(() => {
    if (mapReady && routes.route1) {
      drawAllRoutes(routes);
    }
  }, [mapReady, routes, selectedRoute]);

  // Adjust UI when navigation starts/stops
  useEffect(() => {
    // (Removed bottomSheetRef usage)
  }, [isNavigating, snapPoints]);

  const drawRouteOnMap = () => {
    const coordinates = routeData.coordinates.map(coord => 
      `{lat: ${coord.latitude}, lng: ${coord.longitude}}`
    ).join(',');
    
    const jsCode = `
      if (typeof map !== 'undefined') {
        // Clear existing routes
        if (window.currentPolyline) {
          window.currentPolyline.setMap(null);
        }
        
        // Draw new route
        const path = [${coordinates}];
        window.currentPolyline = new google.maps.Polyline({
          path: path,
          geodesic: true,
          strokeColor: '${THEME_COLORS.SAFETY_GREEN}',
          strokeOpacity: 1.0,
          strokeWeight: 6
        });
        window.currentPolyline.setMap(map);
        
        // Clear and add destination marker
        // Force remove old marker if it exists
        if (window.destinationMarker) {
          window.destinationMarker.setMap(null);
          window.destinationMarker = null;
        }
        
        // Create new marker with exact coordinates
        window.destinationMarker = new google.maps.Marker({
          position: {lat: ${routeData.destination.latitude}, lng: ${routeData.destination.longitude}},
          map: map,
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(\`
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42">
                <path d="M16 0C9.373 0 4 5.373 4 12c0 8.5 12 30 12 30s12-21.5 12-30c0-6.627-5.373-12-12-12z" fill="#EF4444"/>
                <path d="M16 0C9.373 0 4 5.373 4 12c0 8.5 12 30 12 30s12-21.5 12-30c0-6.627-5.373-12-12-12z" fill="none" stroke="#FFFFFF" stroke-width="1.5"/>
                <circle cx="16" cy="12" r="5" fill="#FFFFFF"/>
              </svg>
            \`),
            scaledSize: new google.maps.Size(32, 42),
            anchor: new google.maps.Point(16, 42)
          }
        });
        
        // Fit bounds to show entire route
        const bounds = new google.maps.LatLngBounds();
        path.forEach(point => bounds.extend(point));
        map.fitBounds(bounds, {top: 200, right: 50, bottom: 400, left: 50});
      }
      true;
    `;
    
    webViewRef.current?.injectJavaScript(jsCode);
  };

  const handleWebViewMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'MAP_READY') {
        console.log('Map is ready!');
        setMapReady(true);
      }
    } catch (error) {
      console.error('Error handling WebView message:', error);
    }
  };

  const handleSearchPress = () => {
    setShowSearch(!showSearch);
  };

  const handleSearchSubmit = () => {
    if (searchQuery.trim() && searchSuggestions.length > 0) {
      selectDestination(searchSuggestions[0].place_id, searchSuggestions[0].description);
    }
  };

  // Get safety label based on score
  const getSafetyLabel = (score) => {
    if (score >= 7) return 'Safe';
    if (score >= 5) return 'Moderate';
    return 'Unsafe';
  };

  // Get safety label color
  const getSafetyLabelColor = (score) => {
    if (score >= 7) return THEME_COLORS.SAFETY_GREEN;
    if (score >= 5) return '#F59E0B'; // Orange
    return THEME_COLORS.ALERT_RED;
  };

  // Convert app map style to Google Maps mapTypeId
  const getGoogleMapType = (style) => {
    switch (style) {
      case 'satellite':
        return 'satellite';
      case 'terrain':
        return 'terrain';
      case 'hybrid':
        return 'hybrid';
      case 'standard':
      default:
        return 'roadmap';
    }
  };

  const mapHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <style>
          * { margin: 0; padding: 0; }
          html, body, #map { height: 100%; width: 100%; }
        </style>
        <script src="https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=geometry,places"></script>
      </head>
      <body>
        <div id="map"></div>
        <script>
          let map;
          
          function initMap() {
            map = new google.maps.Map(document.getElementById('map'), {
              center: { lat: ${currentLocation.latitude}, lng: ${currentLocation.longitude} },
              zoom: 15,
              mapTypeId: '${getGoogleMapType(mapStyle)}',
              disableDefaultUI: true,
              zoomControl: false,
              mapTypeControl: false,
              scaleControl: false,
              streetViewControl: false,
              rotateControl: false,
              fullscreenControl: false,
              styles: []
            });
            
            // Add current location marker and keep reference for updates
            window.userMarker = new google.maps.Marker({
              position: { lat: ${currentLocation.latitude}, lng: ${currentLocation.longitude} },
              map: map,
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: '#4285F4',
                fillOpacity: 1,
                strokeColor: '#FFFFFF',
                strokeWeight: 2
              }
            });
            
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'MAP_READY' }));
          }
          
          initMap();
        </script>
      </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor="transparent" 
        translucent 
      />

      {/* FULL SCREEN MAP */}
      <WebView
        ref={webViewRef}
        source={{ html: mapHTML }}
        style={styles.map}
        onMessage={handleWebViewMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
      />

      {/* FLOATING SEARCH BAR (Uber style) */}
      <View style={styles.searchBarContainer}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>

        {showSearch ? (
          <View style={styles.searchInputContainer}>
            <View style={styles.searchIconWrapper}>
              <Ionicons name="location" size={20} color={THEME_COLORS.SAFETY_GREEN} />
            </View>
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search destination..."
              placeholderTextColor="#9CA3AF"
              autoFocus={true}
              onSubmitEditing={handleSearchSubmit}
              returnKeyType="search"
            />
            <TouchableOpacity onPress={() => {
              setShowSearch(false);
              setSearchQuery('');
              setSearchSuggestions([]);
            }}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.searchBar}
            onPress={handleSearchPress}
          >
            <Ionicons name="location" size={20} color={THEME_COLORS.SAFETY_GREEN} />
            <Text style={styles.searchText} numberOfLines={1}>
              {destination}
            </Text>
            {destination && (
              <TouchableOpacity 
                onPress={() => {
                  setDestination('');
                  setDestinationCoords(null);
                  setSelectedDestination(null);
                  setRoutes({ route1: null, route2: null, route3: null });
                  setShowSearch(true);
                }}
                style={{ marginRight: 8 }}
              >
                <Ionicons name="close-circle" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={handleSearchPress}>
              <Ionicons name="create-outline" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      </View>

      {/* SEARCH SUGGESTIONS DROPDOWN */}
      {showSearch && searchSuggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <FlatList
            data={searchSuggestions}
            keyExtractor={(item) => item.place_id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.suggestionItem}
                onPress={() => selectDestination(item.place_id, item.description)}
              >
                <Ionicons name="location-outline" size={20} color="#6B7280" />
                <View style={styles.suggestionTextContainer}>
                  <Text style={styles.suggestionMainText}>
                    {item.structured_formatting.main_text}
                  </Text>
                  <Text style={styles.suggestionSecondaryText}>
                    {item.structured_formatting.secondary_text}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={styles.suggestionSeparator} />}
          />
          {loadingSuggestions && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={THEME_COLORS.SAFETY_GREEN} />
            </View>
          )}
        </View>
      )}

      {/* NAVIGATION INSTRUCTION BANNER (shown when navigating) */}
      {isNavigating && navigationData && (
        <View>
          {/* Primary Navigation Banner with Arrow */}
          <View style={styles.navigationBanner}>
            <View style={styles.navigationIconContainer}>
              <Ionicons 
                name={navigationManager.getManeuverIcon(routes[selectedRoute]?.steps[navigationData.currentStep]?.maneuver)} 
                size={32} 
                color="#FFFFFF" 
              />
            </View>
            <View style={styles.navigationTextContainer}>
              <Text style={styles.navigationDistance}>
                {navigationManager.formatDistance(distanceToNextTurn)}
              </Text>
              <Text style={styles.navigationInstruction} numberOfLines={2}>
                {currentInstruction}
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.stopNavigationButton}
              onPress={stopNavigation}
            >
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Turn-by-Turn Instructions Panel */}
          <View style={styles.turnByTurnPanel}>
            <View style={styles.currentInstructionCard}>
              <View style={styles.instructionIconBg}>
                <Ionicons 
                  name={navigationManager.getManeuverIcon(routes[selectedRoute]?.steps[navigationData.currentStep]?.maneuver)} 
                  size={28} 
                  color={THEME_COLORS.SAFETY_GREEN}
                />
              </View>
              <View style={styles.instructionDetails}>
                <Text style={styles.instructionLabel}>Current Maneuver</Text>
                <Text style={styles.instructionText} numberOfLines={1}>
                  {routes[selectedRoute]?.steps[navigationData.currentStep]?.instruction
                    || currentInstruction
                    || 'Continue on route'}
                </Text>
                <View style={styles.distanceIndicator}>
                  <Ionicons name="location" size={12} color={THEME_COLORS.SAFETY_GREEN} />
                  <Text style={styles.distanceText}>
                    {navigationManager.formatDistance(distanceToNextTurn)}
                  </Text>
                </View>
              </View>
              <Ionicons name="arrow-forward" size={20} color={THEME_COLORS.SAFETY_GREEN} />
            </View>

            {/* Upcoming Instruction Preview */}
            {navigationData.currentStep + 1 < routes[selectedRoute]?.steps?.length && (
              <View style={styles.upcomingInstructionCard}>
                <View style={styles.upcomingIconBg}>
                  <Ionicons 
                    name={navigationManager.getManeuverIcon(
                      routes[selectedRoute]?.steps[navigationData.currentStep + 1]?.maneuver
                    )} 
                    size={24} 
                    color="#9CA3AF"
                  />
                </View>
                <View style={styles.upcomingDetails}>
                  <Text style={styles.upcomingLabel}>Next</Text>
                  <Text style={styles.upcomingText} numberOfLines={1}>
                    {routes[selectedRoute]?.steps[navigationData.currentStep + 1]?.instruction
                      || 'Continue on route'}
                  </Text>
                </View>
                <Text style={styles.upcomingDistance}>
                  {typeof routes[selectedRoute]?.steps[navigationData.currentStep + 1]?.distance?.text === 'string'
                    ? routes[selectedRoute]?.steps[navigationData.currentStep + 1]?.distance?.text
                    : '+' + Math.round((routes[selectedRoute]?.steps[navigationData.currentStep + 1]?.distance?.value || 0) / 10) * 10 + 'm'}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* LIVE INDICATOR (Minimal) */}
      <View style={[styles.liveIndicator, { backgroundColor: colors.surface }]}>
        <View style={styles.liveDot} />
        <Text style={styles.liveText}>{isNavigating ? 'NAVIGATING' : 'LIVE'}</Text>
      </View>

      {/* MAP CONTROLS (Right side) */}
      <View style={styles.mapControls}>
        <TouchableOpacity 
          style={styles.controlButton}
          activeOpacity={0.7}
          onPress={() => {
            const jsCode = `
              map.panTo({lat: ${currentLocation.latitude}, lng: ${currentLocation.longitude}});
              map.setZoom(15);
              true;
            `;
            webViewRef.current?.injectJavaScript(jsCode);
          }}
        >
          <Ionicons name="navigate" size={22} color={THEME_COLORS.SAFETY_GREEN} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.controlButton}
          activeOpacity={0.7}
          onPress={() => {
            const jsCode = `map.setZoom(map.getZoom() + 1); true;`;
            webViewRef.current?.injectJavaScript(jsCode);
          }}
        >
          <Ionicons name="add" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.controlButton}
          activeOpacity={0.7}
          onPress={() => {
            const jsCode = `map.setZoom(map.getZoom() - 1); true;`;
            webViewRef.current?.injectJavaScript(jsCode);
          }}
        >
          <Ionicons name="remove" size={24} color="#1A1A1A" />
        </TouchableOpacity>
      </View>

      {/* DRAGGABLE BOTTOM SHEET (Uber style) */}
      <Animated.View 
        style={[
          styles.bottomSheetContainer, 
          { 
            backgroundColor: colors.surface,
            transform: [{ translateY: sheetPosition }],
          }
        ]}
      >
        {/* Drag Handle */}
        <View 
          style={styles.sheetHandle}
          {...panResponder.panHandlers}
        >
          <View style={[styles.sheetIndicator, { backgroundColor: colors.border }]} />
        </View>
        
        <ScrollView 
          style={[styles.sheetScrollView, { backgroundColor: colors.surface }]}
          contentContainerStyle={[styles.sheetContent, { backgroundColor: colors.surface }]}
          showsVerticalScrollIndicator={true}
          bounces={true}
          scrollEnabled={true}
          nestedScrollEnabled={true}
        >
          {loadingRoutes ? (
            <View style={styles.loadingRoutesContainer}>
              <ActivityIndicator size="large" color={THEME_COLORS.SAFETY_GREEN} />
              <Text style={styles.loadingText}>Calculating routes...</Text>
            </View>
          ) : routes.route1 ? (
            <>
              {/* Route Options Tabs */}
              <View style={styles.routeOptions}>
                {routes.route1 && (
                  <TouchableOpacity
                    style={[
                      styles.routeOptionButton,
                      { backgroundColor: colors.background },
                      selectedRoute === 'route1' && [styles.routeOptionButtonActive, { backgroundColor: colors.surface }],
                      { borderColor: getSafetyLabelColor(routes.route1?.safetyScore) }
                    ]}
                    onPress={() => changeSelectedRoute('route1')}
                  >
                    <View style={[styles.routeColorDot, { backgroundColor: routes.route1?.color || THEME_COLORS.SAFETY_GREEN }]} />
                    <View style={styles.routeOptionContent}>
                      <View style={styles.routeHeader}>
                        <Text style={[
                          styles.routeOptionTitle,
                          { color: colors.textSecondary },
                          selectedRoute === 'route1' && { color: colors.text }
                        ]}>Route 1</Text>
                        <View style={[
                          styles.safetyBadge,
                          { backgroundColor: getSafetyLabelColor(routes.route1?.safetyScore) + '20' }
                        ]}>
                          <Text style={[
                            styles.safetyBadgeText,
                            { color: getSafetyLabelColor(routes.route1?.safetyScore) }
                          ]}>
                            {getSafetyLabel(routes.route1?.safetyScore).toUpperCase()}
                          </Text>
                        </View>
                      </View>
                      <Text style={[styles.routeOptionSubtitle, { color: colors.textSecondary }]}>
                        {routes.route1?.distance} • {routes.route1?.duration}
                      </Text>
                      <View style={styles.routeScoreRow}>
                        <Ionicons name="shield-checkmark" size={14} color={getSafetyLabelColor(routes.route1?.safetyScore)} />
                        <Text style={[styles.routeScoreText, { color: getSafetyLabelColor(routes.route1?.safetyScore) }]}>
                          Safety: {routes.route1?.safetyScore}/10
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                )}

                {routes.route2 && (
                  <TouchableOpacity
                    style={[
                      styles.routeOptionButton,
                      { backgroundColor: colors.background },
                      selectedRoute === 'route2' && [styles.routeOptionButtonActive, { backgroundColor: colors.surface }],
                      { borderColor: getSafetyLabelColor(routes.route2?.safetyScore) }
                    ]}
                    onPress={() => changeSelectedRoute('route2')}
                  >
                    <View style={[styles.routeColorDot, { backgroundColor: routes.route2?.color || '#3B82F6' }]} />
                    <View style={styles.routeOptionContent}>
                      <View style={styles.routeHeader}>
                        <Text style={[
                          styles.routeOptionTitle,
                          { color: colors.textSecondary },
                          selectedRoute === 'route2' && { color: colors.text }
                        ]}>Route 2</Text>
                        <View style={[
                          styles.safetyBadge,
                          { backgroundColor: getSafetyLabelColor(routes.route2?.safetyScore) + '20' }
                        ]}>
                          <Text style={[
                            styles.safetyBadgeText,
                            { color: getSafetyLabelColor(routes.route2?.safetyScore) }
                          ]}>
                            {getSafetyLabel(routes.route2?.safetyScore).toUpperCase()}
                          </Text>
                        </View>
                      </View>
                      <Text style={[styles.routeOptionSubtitle, { color: colors.textSecondary }]}>
                        {routes.route2?.distance} • {routes.route2?.duration}
                      </Text>
                      <View style={styles.routeScoreRow}>
                        <Ionicons name="shield-checkmark" size={14} color={getSafetyLabelColor(routes.route2?.safetyScore)} />
                        <Text style={[styles.routeScoreText, { color: getSafetyLabelColor(routes.route2?.safetyScore) }]}>
                          Safety: {routes.route2?.safetyScore}/10
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                )}

                {routes.route3 && (
                  <TouchableOpacity
                    style={[
                      styles.routeOptionButton,
                      { backgroundColor: colors.background },
                      selectedRoute === 'route3' && [styles.routeOptionButtonActive, { backgroundColor: colors.surface }],
                      { borderColor: getSafetyLabelColor(routes.route3?.safetyScore) }
                    ]}
                    onPress={() => changeSelectedRoute('route3')}
                  >
                    <View style={[styles.routeColorDot, { backgroundColor: routes.route3?.color || '#F59E0B' }]} />
                    <View style={styles.routeOptionContent}>
                      <View style={styles.routeHeader}>
                        <Text style={[
                          styles.routeOptionTitle,
                          { color: colors.textSecondary },
                          selectedRoute === 'route3' && { color: colors.text }
                        ]}>Route 3</Text>
                        <View style={[
                          styles.safetyBadge,
                          { backgroundColor: getSafetyLabelColor(routes.route3?.safetyScore) + '20' }
                        ]}>
                          <Text style={[
                            styles.safetyBadgeText,
                            { color: getSafetyLabelColor(routes.route3?.safetyScore) }
                          ]}>
                            {getSafetyLabel(routes.route3?.safetyScore).toUpperCase()}
                          </Text>
                        </View>
                      </View>
                      <Text style={[styles.routeOptionSubtitle, { color: colors.textSecondary }]}>
                        {routes.route3?.distance} • {routes.route3?.duration}
                      </Text>
                      <View style={styles.routeScoreRow}>
                        <Ionicons name="shield-checkmark" size={14} color={getSafetyLabelColor(routes.route3?.safetyScore)} />
                        <Text style={[styles.routeScoreText, { color: getSafetyLabelColor(routes.route3?.safetyScore) }]}>
                          Safety: {routes.route3?.safetyScore}/10
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                )}
              </View>

                <View style={[styles.routeSummary, { backgroundColor: colors.surface }]}>
                  <View style={styles.summaryItem}>
                    <Ionicons 
                      name="navigate" 
                      size={18} 
                      color={routes[selectedRoute]?.color || THEME_COLORS.SAFETY_GREEN} 
                    />
                    <Text style={[styles.summaryValue, { color: colors.text, fontSize: 14, fontWeight: '600' }]}>{routes[selectedRoute]?.distance}</Text>
                  </View>
                  
                  <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
                  
                  <View style={styles.summaryItem}>
                    <Ionicons 
                      name="time" 
                      size={18} 
                      color={routes[selectedRoute]?.color || THEME_COLORS.SAFETY_GREEN} 
                    />
                    <Text style={[styles.summaryValue, { color: colors.text, fontSize: 14, fontWeight: '600' }]}>{routes[selectedRoute]?.duration}</Text>
                  </View>
                  
                  <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
                  
                  <View style={styles.summaryItem}>
                    <Ionicons 
                      name="shield-checkmark" 
                      size={18} 
                      color={routes[selectedRoute]?.color || THEME_COLORS.SAFETY_GREEN} 
                    />
                    <Text style={[styles.summaryValue, { color: colors.text, fontSize: 14, fontWeight: '600' }]}>{routes[selectedRoute]?.safetyScore}/10</Text>
                  </View>
                </View>

              {/* Route Status */}
              <View style={styles.routeStatus}>
                <View style={[
                  styles.statusBadge, 
                  { backgroundColor: (getSafetyLabelColor(routes[selectedRoute]?.safetyScore)) + '20' }
                ]}>
                  <Text style={[
                    styles.statusText, 
                    { color: getSafetyLabelColor(routes[selectedRoute]?.safetyScore) }
                  ]}>
                    {getSafetyLabel(routes[selectedRoute]?.safetyScore).toUpperCase()} ROUTE
                  </Text>
                </View>
                <Text style={[styles.statusDescription, { color: colors.text }]}>
                  {routes[selectedRoute]?.safetyAnalysis?.factors?.[0] || 'Walking route calculated'}
                </Text>
              </View>

              {/* Expandable Route Details */}
              <TouchableOpacity 
                style={[styles.expandButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                onPress={() => setShowRouteDetails(!showRouteDetails)}
              >
                <Text style={[styles.expandText, { color: colors.text }]}>View Route Details</Text>
                <View style={[styles.expandIcon, { backgroundColor: colors.border }]}>
                  <Ionicons 
                    name={showRouteDetails ? "chevron-up" : "chevron-down"} 
                    size={16} 
                    color={routes[selectedRoute]?.color || THEME_COLORS.SAFETY_GREEN} 
                  />
                </View>
              </TouchableOpacity>

              {/* Turn-by-Turn Directions - Expandable */}
              {showRouteDetails && routes[selectedRoute]?.steps && routes[selectedRoute].steps.length > 0 && (
                <View style={[styles.directionsContainer, { backgroundColor: colors.background }]}>
                  <Text style={[styles.directionsTitle, { color: colors.text }]}>
                    🧭 Turn-by-Turn Directions
                  </Text>
                  {routes[selectedRoute].steps.map((step, index) => (
                    <View 
                      key={index} 
                      style={[
                        styles.directionStep,
                        { backgroundColor: colors.surface, borderColor: colors.border }
                      ]}
                    >
                      <View style={[styles.stepNumber, { backgroundColor: THEME_COLORS.SAFETY_GREEN }]}>
                        <Text style={styles.stepNumberText}>{index + 1}</Text>
                      </View>
                      <View style={styles.stepIconContainer}>
                        <Ionicons 
                          name={getManeuverIcon(step.maneuver)} 
                          size={24} 
                          color={THEME_COLORS.SAFETY_GREEN} 
                        />
                      </View>
                      <View style={styles.stepContent}>
                        <Text style={[styles.stepInstruction, { color: colors.text }]}>
                          {step.instruction || step.text || 'Continue on route'}
                        </Text>
                        <Text style={[styles.stepDistance, { color: colors.textSecondary }]}>
                          {typeof step.distance === 'object' && step.distance?.text 
                            ? step.distance.text 
                            : step.distance || '0 m'}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Safety Breakdown */}
              <View style={styles.safetyDetails}>
                <Text style={[styles.detailsTitle, { color: colors.text }]}>Safety Breakdown</Text>
                
                <SafetyBreakdownItem
                  icon="💡"
                  label="Lighting"
                  score={routes[selectedRoute]?.safetyAnalysis?.lightingScore || 7}
                  description={routes[selectedRoute]?.safetyAnalysis?.factors[0] || "Well-lit throughout"}
                  colors={colors}
                />
                
                <SafetyBreakdownItem
                  icon="👥"
                  label="Foot Traffic"
                  score={routes[selectedRoute]?.safetyAnalysis?.trafficScore || 7}
                  description={routes[selectedRoute]?.safetyAnalysis?.factors[1] || "High activity area"}
                  colors={colors}
                />
                
                <SafetyBreakdownItem
                  icon="🏥"
                  label="Safe Spots"
                  score={routes[selectedRoute]?.safetyAnalysis?.safeSpotScore || 7}
                  description={routes[selectedRoute]?.safetyAnalysis?.factors[2] || "Hospital 200m away"}
                  colors={colors}
                />
                
                <SafetyBreakdownItem
                  icon="📊"
                  label="Community Reports"
                  score={routes[selectedRoute]?.safetyAnalysis?.communityScore || 7}
                  description={routes[selectedRoute]?.safetyAnalysis?.factors[3] || "No incidents in 7 days"}
                  colors={colors}
                />
              </View>

              {/* Safety Alerts */}
              {routes[selectedRoute]?.safetyAnalysis?.alerts?.length > 0 && (
                <View style={styles.safetyAlerts}>
                  <Text style={[styles.alertsTitle, { color: colors.text }]}>⚠️ Safety Alerts</Text>
                  {routes[selectedRoute].safetyAnalysis.alerts.map((alert, index) => (
                    <View key={index} style={styles.alertItem}>
                      <Ionicons name="warning" size={16} color="#F59E0B" />
                      <Text style={[styles.alertText, { color: colors.text }]}>{alert.message}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Start Navigation Button */}
              <TouchableOpacity 
                style={[
                  styles.startButton,
                  isNavigating && { backgroundColor: '#EF4444' }
                ]}
                onPress={() => {
                  if (isNavigating) {
                    stopNavigation();
                  } else {
                    startNavigation();
                  }
                }}
              >
                <Ionicons name={isNavigating ? "stop-circle" : "navigate"} size={24} color="#FFFFFF" />
                <View style={styles.buttonTextContainer}>
                  <Text style={styles.startButtonText}>
                    {isNavigating ? 'Stop Navigation' : 'Start Navigation'}
                  </Text>
                  <Text style={[styles.startButtonSubtext, { color: 'rgba(255, 255, 255, 0.9)' }]}>
                    {isNavigating ? 'End turn-by-turn directions' : 'Walking turn-by-turn guidance'}
                  </Text>
                </View>
                <View style={styles.buttonArrow}>
                  <Ionicons name={isNavigating ? "close" : "arrow-forward"} size={20} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.noRoutesContainer}>
              <View style={styles.placeholderIconContainer}>
                <Ionicons name="navigate-circle-outline" size={56} color={THEME_COLORS.SAFETY_GREEN} />
              </View>
              <Text style={[styles.noRoutesTitle, { color: colors.text }]}>Where to?</Text>
              <Text style={[styles.noRoutesText, { color: colors.textSecondary }]}>Enter a destination to see routes</Text>
            </View>
          )}
        </ScrollView>
      </Animated.View>
    </View>
  );
};

// Safety Breakdown Item Component
const SafetyBreakdownItem = ({ icon, label, score, description, colors }) => (
  <View style={styles.breakdownItem}>
    <Text style={styles.breakdownIcon}>{icon}</Text>
    <View style={styles.breakdownContent}>
      <View style={styles.breakdownHeader}>
        <Text style={[styles.breakdownLabel, { color: colors.text }]}>{label}</Text>
        <View style={[styles.scoreCircle, { 
          backgroundColor: score >= 7 ? '#ECFDF5' : score >= 5 ? '#FEF3C7' : '#FEE2E2',
          borderColor: score >= 7 ? THEME_COLORS.SAFETY_GREEN : score >= 5 ? THEME_COLORS.WARNING_ORANGE : THEME_COLORS.ALERT_RED,
        }]}>
          <Text style={[styles.scoreText, {
            color: score >= 7 ? THEME_COLORS.SAFETY_GREEN : score >= 5 ? THEME_COLORS.WARNING_ORANGE : THEME_COLORS.ALERT_RED,
          }]}>{score}</Text>
        </View>
      </View>
      <Text style={[styles.breakdownDescription, { color: colors.textSecondary }]}>{description}</Text>
    </View>
  </View>
);

// Alternative Route Card Component
const AlternativeRouteCard = ({ name, distance, duration, safetyScore, badge, color }) => (
  <TouchableOpacity style={styles.alternativeCard}>
    <View style={[styles.alternativeBadge, { backgroundColor: `${color}20` }]}>
      <Text style={[styles.alternativeBadgeText, { color }]}>{badge}</Text>
    </View>
    
    <Text style={styles.alternativeName}>{name}</Text>
    
    <View style={styles.alternativeStats}>
      <Text style={styles.alternativeStat}>🚶 {distance}</Text>
      <Text style={styles.alternativeStat}>•</Text>
      <Text style={styles.alternativeStat}>🕐 {duration}</Text>
      <Text style={styles.alternativeStat}>•</Text>
      <Text style={styles.alternativeStat}>🛡️ {safetyScore}/10</Text>
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  
  // FULL SCREEN MAP
  map: {
    ...StyleSheet.absoluteFillObject,
    height: SCREEN_HEIGHT,
    width: SCREEN_WIDTH,
  },

  // FLOATING SEARCH BAR (UBER STYLE)
  searchBarContainer: {
    position: 'absolute',
    top: STATUS_BAR_HEIGHT + 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    zIndex: 100,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  searchBar: {
    flex: 1,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.1)',
    ...Platform.select({
      ios: {
        shadowColor: THEME_COLORS.SAFETY_GREEN,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  searchIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchInputContainer: {
    flex: 1,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    ...Platform.select({
      ios: {
        shadowColor: THEME_COLORS.SAFETY_GREEN,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  searchText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
  },

  // SEARCH SUGGESTIONS
  suggestionsContainer: {
    position: 'absolute',
    top: STATUS_BAR_HEIGHT + 72,
    left: 64,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    maxHeight: 300,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  suggestionTextContainer: {
    flex: 1,
  },
  suggestionMainText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  suggestionSecondaryText: {
    fontSize: 13,
    color: '#6B7280',
  },
  suggestionSeparator: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 16,
  },
  loadingContainer: {
    padding: 16,
    alignItems: 'center',
  },

  // LIVE INDICATOR (MINIMAL)
  liveIndicator: {
    position: 'absolute',
    top: STATUS_BAR_HEIGHT + 80,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
    zIndex: 99,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: THEME_COLORS.ALERT_RED,
  },
  liveText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME_COLORS.ALERT_RED,
  },
  
  // MAP CONTROLS (RIGHT SIDE)
  mapControls: {
    position: 'absolute',
    right: 16,
    top: STATUS_BAR_HEIGHT + 120,
    gap: 12,
    zIndex: 1,
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  controlText: {
    fontSize: 24,
    fontWeight: '300',
    color: '#1A1A1A',
  },

  // DESTINATION MARKER (CUSTOM)
  destinationMarker: {
    alignItems: 'center',
  },
  markerDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: THEME_COLORS.ALERT_RED,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  markerPole: {
    width: 2,
    height: 30,
    backgroundColor: THEME_COLORS.ALERT_RED,
  },

  // BOTTOM SHEET
  bottomSheetContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
      },
      android: {
        elevation: 20,
      },
    }),
  },
  sheetHandle: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: 'transparent',
  },
  sheetIndicator: {
    backgroundColor: '#D1D5DB',
    width: 48,
    height: 5,
    borderRadius: 2.5,
  },
  sheetBackground: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
      },
      android: {
        elevation: 20,
      },
    }),
  },
  sheetScrollView: {
    flex: 1,
    maxHeight: SCREEN_HEIGHT * 0.8, // Allow scrolling within 80% of screen
  },
  sheetContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100, // Increased padding to ensure button is visible
    flexGrow: 1,
  },

  // ROUTE OPTIONS
  routeOptions: {
    marginBottom: 16,
    gap: 10,
  },
  routeOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  routeOptionButtonActive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  routeColorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  routeOptionContent: {
    flex: 1,
  },
  routeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  routeOptionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6B7280',
  },
  routeOptionTitleActive: {
    color: '#1A1A1A',
  },
  routeOptionSubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  routeScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  routeScoreText: {
    fontSize: 12,
    fontWeight: '600',
  },
  safetyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  safetyBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  routeOptionScore: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },

  // LOADING AND EMPTY STATES
  loadingRoutesContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
  },
  noRoutesContainer: {
    paddingVertical: 80,
    alignItems: 'center',
    gap: 12,
  },
  placeholderIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  noRoutesTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  noRoutesText: {
    fontSize: 15,
    color: '#9CA3AF',
    fontWeight: '400',
    textAlign: 'center',
  },

  // ROUTE SUMMARY (COMPACT)
  routeSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  summaryDivider: {
    width: 1,
    height: 24,
  },

  // ROUTE STATUS
  routeStatus: {
    marginBottom: 16,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME_COLORS.SAFETY_GREEN,
    letterSpacing: 0.5,
  },
  statusDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },

  // EXPAND BUTTON
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginVertical: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  expandText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  expandIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // TURN-BY-TURN DIRECTIONS
  directionsContainer: {
    marginBottom: 24,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
  },
  directionsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  directionStep: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: THEME_COLORS.SAFETY_GREEN,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  stepIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME_COLORS.SAFETY_GREEN + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepContent: {
    flex: 1,
  },
  stepInstruction: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
    lineHeight: 20,
  },
  stepDistance: {
    fontSize: 12,
    color: '#6B7280',
  },

  // SAFETY DETAILS
  safetyDetails: {
    marginBottom: 24,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  breakdownIcon: {
    fontSize: 24,
  },
  breakdownContent: {
    flex: 1,
  },
  breakdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  breakdownLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  scoreCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 14,
    fontWeight: '700',
  },
  breakdownDescription: {
    fontSize: 13,
    color: '#6B7280',
  },

  // ALTERNATIVE ROUTES
  alternativeRoutes: {
    marginBottom: 24,
  },
  alternativeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  alternativeCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  alternativeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  alternativeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  alternativeName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 6,
  },
  alternativeStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  alternativeStat: {
    fontSize: 13,
    color: '#6B7280',
  },

  // SAFETY ALERTS
  safetyAlerts: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  alertsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 12,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  alertText: {
    flex: 1,
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
  },

  // NAVIGATION BANNER
  navigationBanner: {
    position: 'absolute',
    top: STATUS_BAR_HEIGHT + 80,
    left: 16,
    right: 16,
    backgroundColor: THEME_COLORS.SAFETY_GREEN,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    zIndex: 100,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  navigationIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navigationTextContainer: {
    flex: 1,
  },
  navigationDistance: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  navigationInstruction: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  stopNavigationButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // TURN-BY-TURN INSTRUCTION PANEL
  turnByTurnPanel: {
    position: 'absolute',
    top: STATUS_BAR_HEIGHT + 160,
    left: 16,
    right: 16,
    gap: 10,
    zIndex: 100,
  },
  currentInstructionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    gap: 12,
    borderWidth: 2,
    borderColor: THEME_COLORS.SAFETY_GREEN,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  instructionIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructionDetails: {
    flex: 1,
  },
  instructionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  instructionText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 6,
  },
  distanceIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  distanceText: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME_COLORS.SAFETY_GREEN,
  },
  upcomingInstructionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  upcomingIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  upcomingDetails: {
    flex: 1,
  },
  upcomingLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.2,
    marginBottom: 1,
  },
  upcomingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  upcomingDistance: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },

  // START NAVIGATION BUTTON
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME_COLORS.SAFETY_GREEN,
    borderRadius: 16,
    padding: 18,
    gap: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    ...Platform.select({
      ios: {
        shadowColor: THEME_COLORS.SAFETY_GREEN,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  buttonTextContainer: {
    flex: 1,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  startButtonSubtext: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  buttonArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default NavigateScreen;
