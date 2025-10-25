/**
 * MapScreen - Working Map with WebView
 * Works with Expo Go
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
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { GOOGLE_MAPS_API_KEY } from '@env';
import { useTheme } from '../context/ThemeContext';
import { useLocation } from '../hooks/useLocation';

const { width, height } = Dimensions.get('window');

const MapScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const webViewRef = useRef(null);
  
  const { location: userLocation, loading: locationLoading } = useLocation();
  
  const [mapReady, setMapReady] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const getMapHTML = () => {
    const lat = userLocation?.latitude || 13.0099;
    const lng = userLocation?.longitude || 74.7949;
    
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
    
    function initMap() {
      const userLocation = { lat: ${lat}, lng: ${lng} };
      
      map = new google.maps.Map(document.getElementById('map'), {
        center: userLocation,
        zoom: 15,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });
      
      userMarker = new google.maps.Marker({
        position: userLocation,
        map: map,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#10B981',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 3,
        },
        title: 'Your Location',
      });
      
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'MAP_READY' }));
      }
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
          map.setCenter(place.geometry.location);
          new google.maps.Marker({
            map: map,
            position: place.geometry.location,
            title: place.name,
          });
        }
      });
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
        console.log('✅ Map is ready!');
        setMapReady(true);
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  };

  useEffect(() => {
    if (mapReady && userLocation && webViewRef.current) {
      const script = `updateUserLocation(${userLocation.latitude}, ${userLocation.longitude});`;
      webViewRef.current.injectJavaScript(script);
    }
  }, [userLocation, mapReady]);

  const handleSearch = () => {
    if (searchQuery.trim() && mapReady && webViewRef.current) {
      const script = `searchPlace("${searchQuery.replace(/"/g, '\\"')}");`;
      webViewRef.current.injectJavaScript(script);
    }
  };

  if (locationLoading) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>
          Loading your location...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar 
        barStyle={colors.background === '#FFFFFF' ? 'dark-content' : 'light-content'}
        backgroundColor={colors.surface}
      />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, { color: colors.text }]}>SafeRoute Map</Text>
        
        <TouchableOpacity 
          onPress={() => {
            if (webViewRef.current && userLocation) {
              webViewRef.current.injectJavaScript(`
                map.setCenter({ lat: ${userLocation.latitude}, lng: ${userLocation.longitude} });
                map.setZoom(15);
              `);
            }
          }} 
          style={styles.headerButton}
        >
          <Ionicons name="locate" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
        <View style={[styles.searchBar, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search destination..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

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
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={{ color: colors.text, marginTop: 10 }}>Loading map...</Text>
            </View>
          )}
        />
      </View>

      {/* Location Info */}
      {userLocation && (
        <View style={[styles.locationInfo, { backgroundColor: colors.surface }]}>
          <Ionicons name="location" size={16} color={colors.primary} />
          <Text style={[styles.locationText, { color: colors.text }]}>
            {userLocation.latitude.toFixed(6)}, {userLocation.longitude.toFixed(6)}
          </Text>
        </View>
      )}
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'ios' ? 50 : 12,
    borderBottomWidth: 1,
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  searchContainer: {
    padding: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  mapContainer: {
    flex: 1,
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
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
  },
  locationText: {
    marginLeft: 8,
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});

export default MapScreen;
