/**
 * useLocation Hook
 * Custom hook for managing device location
 */

import { useState, useEffect, useCallback } from 'react';
import LocationService from '../services/locationService';
import { ERROR_MESSAGES } from '../utils/constants';

export const useLocation = (watchLocation = false) => {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [permission, setPermission] = useState(null);
  const [accuracy, setAccuracy] = useState(null);

  /**
   * Get current location once
   */
  const getCurrentLocation = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const currentLocation = await LocationService.getCurrentLocation();
      setLocation(currentLocation);
      setAccuracy(currentLocation.accuracy);
      setPermission('granted');
      
      return currentLocation;
    } catch (err) {
      console.error('Error getting location:', err);
      setError(err.message || ERROR_MESSAGES.LOCATION_PERMISSION_DENIED);
      setPermission('denied');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Start watching location changes
   */
  const startWatching = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      await LocationService.watchLocation((newLocation) => {
        setLocation(newLocation);
        setAccuracy(newLocation.accuracy);
      });

      setPermission('granted');
    } catch (err) {
      console.error('Error watching location:', err);
      setError(err.message || ERROR_MESSAGES.LOCATION_PERMISSION_DENIED);
      setPermission('denied');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Stop watching location
   */
  const stopWatching = useCallback(() => {
    LocationService.stopWatchingLocation();
  }, []);

  /**
   * Refresh current location
   */
  const refreshLocation = useCallback(async () => {
    await getCurrentLocation();
  }, [getCurrentLocation]);

  // Auto-start watching if requested
  useEffect(() => {
    if (watchLocation) {
      startWatching();
      
      return () => {
        stopWatching();
      };
    } else {
      getCurrentLocation();
    }
  }, [watchLocation, startWatching, stopWatching, getCurrentLocation]);

  return {
    location,
    loading,
    error,
    permission,
    accuracy,
    getCurrentLocation,
    refreshLocation,
    startWatching,
    stopWatching,
  };
};

export default useLocation;
