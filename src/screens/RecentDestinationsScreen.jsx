import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  SafeAreaView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { THEME_COLORS } from '../utils/constants';
import { useTheme } from '../context/ThemeContext';

const RecentDestinationsScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const [destinations, setDestinations] = useState([]);

  useEffect(() => {
    loadDestinations();
    
    const unsubscribe = navigation.addListener('focus', () => {
      loadDestinations();
    });

    return unsubscribe;
  }, [navigation]);

  const loadDestinations = async () => {
    try {
      const stored = await AsyncStorage.getItem('recentDestinations');
      if (stored) {
        setDestinations(JSON.parse(stored));
      }
    } catch (error) {
      console.log('Error loading destinations:', error);
    }
  };

  const removeDestination = async (placeId) => {
    try {
      const updated = destinations.filter(d => d.placeId !== placeId);
      await AsyncStorage.setItem('recentDestinations', JSON.stringify(updated));
      setDestinations(updated);
    } catch (error) {
      console.log('Error removing destination:', error);
    }
  };

  const clearAll = () => {
    Alert.alert(
      'Clear All Destinations',
      'Are you sure you want to clear all recent destinations?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              // Set to empty array instead of removing the item
              await AsyncStorage.setItem('recentDestinations', JSON.stringify([]));
              setDestinations([]);
            } catch (error) {
              console.log('Error clearing destinations:', error);
            }
          },
        },
      ]
    );
  };

  const navigateToDestination = (destination) => {
    navigation.navigate('Navigate', {
      selectedDestination: destination,
    });
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Recently';
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Recent Destinations</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            {destinations.length} {destinations.length === 1 ? 'destination' : 'destinations'}
          </Text>
        </View>
        {destinations.length > 0 && (
          <TouchableOpacity onPress={clearAll} style={styles.clearButton}>
            <Text style={[styles.clearButtonText, { color: THEME_COLORS.ALERT_RED }]}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {destinations.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="location-outline" size={64} color={colors.disabled} />
            <Text style={[styles.emptyStateTitle, { color: colors.text }]}>No Recent Destinations</Text>
            <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
              Your search history will appear here
            </Text>
          </View>
        ) : (
          destinations.map((destination, index) => (
            <TouchableOpacity
              key={destination.placeId || index}
              style={[styles.destinationCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => navigateToDestination(destination)}
              activeOpacity={0.7}
            >
              <View style={styles.iconContainer}>
                <Ionicons name="location" size={24} color={THEME_COLORS.SAFETY_GREEN} />
              </View>
              
              <View style={styles.destinationContent}>
                <Text style={[styles.destinationName, { color: colors.text }]} numberOfLines={1}>
                  {destination.name}
                </Text>
                <Text style={[styles.destinationAddress, { color: colors.textSecondary }]} numberOfLines={1}>
                  {destination.address}
                </Text>
                <View style={styles.metaRow}>
                  <View style={styles.safetyBadge}>
                    <Ionicons name="shield-checkmark" size={12} color={THEME_COLORS.SAFETY_GREEN} />
                    <Text style={styles.safetyText}>{destination.safetyScore || 7}/10</Text>
                  </View>
                  <Text style={[styles.timestampText, { color: colors.textSecondary }]}>
                    {formatDate(destination.timestamp)}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  removeDestination(destination.placeId);
                }}
                style={styles.removeButton}
              >
                <Ionicons name="close-circle" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerContent: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  clearButton: {
    padding: 8,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
  },
  destinationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  destinationContent: {
    flex: 1,
  },
  destinationName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  destinationAddress: {
    fontSize: 14,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  safetyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  safetyText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME_COLORS.SAFETY_GREEN,
  },
  timestampText: {
    fontSize: 12,
  },
  removeButton: {
    padding: 8,
    marginLeft: 8,
  },
});

export default RecentDestinationsScreen;
