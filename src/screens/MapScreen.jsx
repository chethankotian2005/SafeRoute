/**
 * MapScreen - Navigate Screen with Safe Spots
 * Shows hospitals, police stations, and safe spaces
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  StatusBar,
  Dimensions,
  FlatList,
  Keyboard,
  Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { GOOGLE_MAPS_API_KEY } from '../config/apiKeys';
import { useTheme } from '../context/ThemeContext';
import { useLocation } from '../hooks/useLocation';

const { width, height } = Dimensions.get('window');

const MapScreen = ({ navigation, route }) => {
  const { colors } = useTheme();
  const webViewRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  
  const { location: userLocation, loading: locationLoading, error: locationError } = useLocation();
  
  const [mapReady, setMapReady] = useState(false);
  const [destination, setDestination] = useState(route?.params?.destination || '');
  const [routeInfo, setRouteInfo] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [currentAddress, setCurrentAddress] = useState('Locating...');
  const [isCalculating, setIsCalculating] = useState(false);
  const [showMapTypeSelector, setShowMapTypeSelector] = useState(false);
  const [mapType, setMapType] = useState('standard');
  const [showTraffic, setShowTraffic] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [activeFilter, setActiveFilter] = useState('safest');
  
  const getMapHTML = () => {
    const lat = userLocation?.latitude || 13.0100;
    const lng = userLocation?.longitude || 74.7948;
    
    return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
  <style>
    * { margin: 0; padding: 0; }
    html, body, #map { height: 100%; width: 100%; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    let map;
    let userMarker;
    let destinationMarker = null;
    let safeSpotMarkers = [];
    
    function initMap() {
      const userLocation = { lat: ${lat}, lng: ${lng} };
      
      map = new google.maps.Map(document.getElementById('map'), {
        center: userLocation,
        zoom: 15,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });
      
      // User location marker (blue dot)
      userMarker = new google.maps.Marker({
        position: userLocation,
        map: map,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#3B82F6',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 3,
        },
        title: 'Your Location',
        zIndex: 1000,
      });
      
      // Add safe spots nearby
      findSafeSpots(userLocation);
      
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'MAP_READY' }));
      }
    }
    
    function findSafeSpots(location) {
      const service = new google.maps.places.PlacesService(map);
      
      // Find hospitals
      service.nearbySearch({
        location: location,
        radius: 2000,
        type: 'hospital'
      }, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
          results.slice(0, 5).forEach(place => {
            addSafeSpotMarker(place, 'hospital');
          });
        }
      });
      
      // Find police stations
      service.nearbySearch({
        location: location,
        radius: 2000,
        type: 'police'
      }, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
          results.slice(0, 5).forEach(place => {
            addSafeSpotMarker(place, 'police');
          });
        }
      });
      
      // Find other safe places (pharmacies)
      service.nearbySearch({
        location: location,
        radius: 1500,
        keyword: 'pharmacy'
      }, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
          results.slice(0, 3).forEach(place => {
            addSafeSpotMarker(place, 'pharmacy');
          });
        }
      });
    }
    
    function addSafeSpotMarker(place, type) {
      let iconUrl = '';
      
      if (type === 'hospital') {
        // Red cross for hospitals
        iconUrl = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
          '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">' +
          '<circle cx="16" cy="16" r="14" fill="white" stroke="#EF4444" stroke-width="2"/>' +
          '<rect x="14" y="8" width="4" height="16" fill="#EF4444"/>' +
          '<rect x="8" y="14" width="16" height="4" fill="#EF4444"/>' +
          '</svg>'
        );
      } else if (type === 'police') {
        // Shield for police stations
        iconUrl = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
          '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">' +
          '<path d="M16 4 L8 8 L8 14 C8 20 16 26 16 26 C16 26 24 20 24 14 L24 8 Z" fill="#3B82F6" stroke="white" stroke-width="2"/>' +
          '<text x="16" y="19" text-anchor="middle" font-size="14" font-weight="bold" fill="white">P</text>' +
          '</svg>'
        );
      } else {
        // Green circle for other safe spots
        iconUrl = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
          '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">' +
          '<circle cx="14" cy="14" r="12" fill="#10B981" stroke="white" stroke-width="2"/>' +
          '<text x="14" y="18" text-anchor="middle" font-size="16" font-weight="bold" fill="white">+</text>' +
          '</svg>'
        );
      }
      
      const marker = new google.maps.Marker({
        position: place.geometry.location,
        map: map,
        icon: {
          url: iconUrl,
          scaledSize: new google.maps.Size(type === 'hospital' ? 32 : type === 'police' ? 32 : 28, type === 'hospital' ? 32 : type === 'police' ? 32 : 28)
        },
        title: place.name,
      });
      
      safeSpotMarkers.push(marker);
    }
    
    function updateUserLocation(lat, lng) {
      const newPos = { lat: lat, lng: lng };
      if (userMarker) {
        userMarker.setPosition(newPos);
      }
      if (map) {
        map.setCenter(newPos);
      }
    }
    
    function searchPlace(query) {
      const service = new google.maps.places.PlacesService(map);
      const request = {
        query: query,
        fields: ['name', 'geometry'],
      };
      
      service.findPlaceFromQuery(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          const place = results[0];
          const location = place.geometry.location;
          
          // Center map on the destination
          map.setCenter(location);
          map.setZoom(16);
          
          // Remove old destination marker if exists
          if (destinationMarker) {
            destinationMarker.setMap(null);
          }
          
          // Add new destination marker (green)
          destinationMarker = new google.maps.Marker({
            map: map,
            position: location,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: '#10B981',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 3,
            },
            title: place.name,
          });
          
          // Send destination info back to React Native
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'DESTINATION_FOUND',
              name: place.name,
              lat: location.lat(),
              lng: location.lng()
            }));
          }
        } else {
          // Send error back to React Native
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'SEARCH_ERROR',
              message: 'Place not found'
            }));
          }
        }
      });
    }
    
    function clearDestinationMarker() {
      if (destinationMarker) {
        destinationMarker.setMap(null);
        destinationMarker = null;
      }
    }
    
    function recenterMap() {
      if (userMarker && map) {
        map.setCenter(userMarker.getPosition());
        map.setZoom(15);
      }
    }
  </script>
  <script async defer
    src="https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&callback=initMap">
  </script>
</body>
</html>`;
  };

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'MAP_READY') {
        console.log('Map is ready with safe spots!');
        setMapReady(true);
      } else if (data.type === 'DESTINATION_FOUND') {
        setIsCalculating(false);
        setRouteInfo({
          distance: data.distance || '2.5 km',
          duration: data.duration || '8 mins',
          routesAvailable: data.routeCount || 1
        });
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  };

  // Reverse geocode to get address from coordinates
  const getAddressFromCoords = async (latitude, longitude) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();
      
      if (data.results && data.results[0]) {
        const address = data.results[0].formatted_address;
        const shortAddress = address.split(',').slice(0, 2).join(',');
        return shortAddress;
      }
      return 'Location unavailable';
    } catch (error) {
      console.error('Geocoding error:', error);
      return 'Location unavailable';
    }
  };

  // Update address when location changes
  useEffect(() => {
    if (userLocation) {
      getAddressFromCoords(userLocation.latitude, userLocation.longitude)
        .then(address => setCurrentAddress(address));
    }
  }, [userLocation]);

  useEffect(() => {
    if (mapReady && userLocation && webViewRef.current) {
      const script = `updateUserLocation(${userLocation.latitude}, ${userLocation.longitude});`;
      webViewRef.current.injectJavaScript(script);
    }
  }, [userLocation, mapReady]);

  // Fetch autocomplete suggestions
  const fetchSuggestions = async (input) => {
    if (!input || input.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${GOOGLE_MAPS_API_KEY}&location=${userLocation?.latitude},${userLocation?.longitude}&radius=50000`
      );
      const data = await response.json();
      
      if (data.predictions) {
        setSuggestions(data.predictions);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  const handleDestinationChange = (text) => {
    setDestination(text);
    
    // Debounce the API call
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      fetchSuggestions(text);
    }, 300);
  };

  const selectSuggestion = (suggestion) => {
    setDestination(suggestion.description);
    setShowSuggestions(false);
    setSuggestions([]);
    Keyboard.dismiss();
    
    // Automatically search the selected place
    if (mapReady && webViewRef.current) {
      const script = `searchPlace("${suggestion.description.replace(/"/g, '\\"')}");`;
      webViewRef.current.injectJavaScript(script);
    }
  };

  const handleSearch = () => {
    if (destination.trim() && mapReady && webViewRef.current) {
      setIsCalculating(true);
      const script = `searchPlace("${destination.replace(/"/g, '\\"')}");`;
      webViewRef.current.injectJavaScript(script);
      setShowSuggestions(false);
      Keyboard.dismiss();
    }
  };
  
  const handleRecenter = () => {
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript('recenterMap();');
    }
  };

  const clearDestination = () => {
    setDestination('');
    setSuggestions([]);
    setShowSuggestions(false);
    setRouteInfo(null);
    setIsCalculating(false);
    
    // Clear destination marker from map
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript('clearDestinationMarker();');
    }
  };

  const toggleMapType = () => {
    setShowMapTypeSelector(!showMapTypeSelector);
  };

  const selectMapType = (type) => {
    setMapType(type);
    setShowMapTypeSelector(false);
    // Update map type in WebView
    if (webViewRef.current) {
      const mapTypeId = type === 'satellite' ? 'SATELLITE' : type === 'hybrid' ? 'HYBRID' : 'ROADMAP';
      webViewRef.current.injectJavaScript(`
        if (map) {
          map.setMapTypeId(google.maps.MapTypeId.${mapTypeId});
        }
      `);
    }
  };

  const toggleTraffic = () => {
    setShowTraffic(!showTraffic);
    // Toggle traffic layer in WebView
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        if (!window.trafficLayer) {
          window.trafficLayer = new google.maps.TrafficLayer();
        }
        if (${!showTraffic}) {
          window.trafficLayer.setMap(map);
        } else {
          window.trafficLayer.setMap(null);
        }
      `);
    }
  };

  const toggleHeatmap = () => {
    setShowHeatmap(!showHeatmap);
  };
  
  const handleStartNavigation = () => {
    if (destination && userLocation && routeInfo) {
      console.log('🚀 Starting navigation from current location:', userLocation);
      
      navigation.navigate('RouteDetails', {
        origin: `${userLocation.latitude},${userLocation.longitude}`,
        destination: destination,
        startLocation: {
          lat: userLocation.latitude,
          lng: userLocation.longitude,
        },
        endLocation: null,
        distance: routeInfo.distance,
        duration: routeInfo.duration,
      });
    } else if (!userLocation) {
      Alert.alert('Location Required', 'Waiting for your location. Please enable GPS and try again.');
    } else if (!destination) {
      Alert.alert('Destination Required', 'Please enter a destination first.');
    } else if (!routeInfo) {
      Alert.alert('Calculating Route', 'Please wait while we calculate the route.');
    }
  };

  const getButtonText = () => {
    if (!destination) return 'Enter Destination';
    if (isCalculating) return 'Calculating Route...';
    if (!routeInfo) return 'Search First';
    return 'Start Navigation';
  };

  const canStartNavigation = destination && userLocation && routeInfo && !isCalculating;

  if (locationLoading) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: '#FFFFFF' }]}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>
          Loading your location...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: '#F3F4F6' }]}>
      <StatusBar barStyle="light-content" backgroundColor="#1F2937" />

      {/* Simplified Header with Integrated Search */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        
        <View style={styles.searchBarHeader}>
          <Ionicons name="search" size={20} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Where do you want to go?"
            placeholderTextColor="#9CA3AF"
            value={destination}
            onChangeText={handleDestinationChange}
            onSubmitEditing={handleSearch}
            onFocus={() => destination.length >= 2 && setShowSuggestions(true)}
            autoFocus={false}
          />
          {destination.length > 0 && (
            <TouchableOpacity onPress={clearDestination}>
              <Ionicons name="close-circle" size={20} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity style={styles.menuButton}>
          <Ionicons name="ellipsis-vertical" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Autocomplete Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <FlatList
            data={suggestions}
            keyExtractor={(item) => item.place_id}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.suggestionItem}
                onPress={() => selectSuggestion(item)}
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
          />
        </View>
      )}

      {/* Map */}
      <View style={styles.mapContainer}>
        <WebView
          ref={webViewRef}
          source={{ html: getMapHTML() }}
          style={styles.map}
          onMessage={handleMessage}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#10B981" />
              <Text style={{ color: '#1F2937', marginTop: 10 }}>Loading map...</Text>
            </View>
          )}
        />
        
        {/* Live Location Badge */}
        {userLocation && (
          <View style={styles.liveLocationBadge}>
            <View style={styles.liveLocationDot} />
            <Text style={styles.liveLocationText}>Live Location</Text>
            <Text style={styles.coordinatesText}>
              {userLocation.latitude.toFixed(5)}, {userLocation.longitude.toFixed(5)}
            </Text>
          </View>
        )}
      </View>

      {/* Bottom Sheet - Route Selection */}
      <View style={styles.bottomSheet}>
        <View style={styles.sheetHandle} />
        
        <Text style={styles.sheetTitle}>Choose Your Route</Text>
        
        {routeInfo && (
          <Text style={styles.routeAvailable}>{routeInfo.routesAvailable} routes available</Text>
        )}
        
        {/* Route Type Indicators */}
        <View style={styles.routeTypes}>
          <View style={styles.routeTypeItem}>
            <View style={[styles.routeTypeDot, { backgroundColor: '#10B981' }]} />
            <Text style={styles.routeTypeText}>Safest</Text>
          </View>
          <View style={styles.routeTypeItem}>
            <View style={[styles.routeTypeDot, { backgroundColor: '#F59E0B' }]} />
            <Text style={styles.routeTypeText}>Fast</Text>
          </View>
          <View style={styles.routeTypeItem}>
            <View style={[styles.routeTypeDot, { backgroundColor: '#EF4444' }]} />
            <Text style={styles.routeTypeText}>Alt</Text>
          </View>
        </View>
        
        {/* Start Navigation Button */}
        <TouchableOpacity 
          style={[styles.startButton, !destination && styles.startButtonDisabled]}
          onPress={handleStartNavigation}
          disabled={!destination}
        >
          <Ionicons name="navigate" size={24} color="#FFFFFF" />
          <View style={styles.startButtonTextContainer}>
            <Text style={styles.startButtonTitle}>Start Navigation</Text>
            <Text style={styles.startButtonSubtitle}>Turn-by-turn directions</Text>
          </View>
          <Ionicons name="arrow-forward" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#1F2937',
  },
  header: {
    backgroundColor: '#1F2937',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
  },
  backButton: {
    padding: 4,
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  destinationBar: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  destinationInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginRight: 12,
  },
  destinationInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#1F2937',
  },
  recenterButton: {
    padding: 8,
  },
  suggestionsContainer: {
    backgroundColor: '#FFFFFF',
    maxHeight: 250,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  suggestionTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  suggestionMainText: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  suggestionSecondaryText: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  liveLocationBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  liveLocationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    marginRight: 6,
  },
  liveLocationText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  coordinatesText: {
    fontSize: 10,
    color: '#9CA3AF',
    marginLeft: 8,
  },
  bottomSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  routeAvailable: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  routeTypes: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  routeTypeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  routeTypeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  routeTypeText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  startButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
  },
  startButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  startButtonTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  startButtonTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  startButtonSubtitle: {
    fontSize: 13,
    color: '#FFFFFF',
    opacity: 0.9,
    marginTop: 2,
  },
});

export default MapScreen;
