/**
 * useSafetyData Hook
 * Custom hook for fetching and managing safety-related data
 */

import { useState, useEffect, useCallback } from 'react';
import { getNearbySafeSpots } from '../services/googleMapsService';
import { calculateSafetyScore, rankRoutesBySafety } from '../services/safetyScoring';
import { getCommunityReportsNearLocation } from '../services/firebaseService';
import { SAFE_SPOT_CONFIG } from '../utils/constants';

export const useSafetyData = (location, routes = []) => {
  const [safeSpots, setSafeSpots] = useState([]);
  const [communityReports, setCommunityReports] = useState([]);
  const [scoredRoutes, setScoredRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch nearby safe spots
   */
  const fetchSafeSpots = useCallback(async (customLocation) => {
    try {
      const targetLocation = customLocation || location;
      if (!targetLocation) return;

      const spots = await getNearbySafeSpots(
        targetLocation,
        SAFE_SPOT_CONFIG.SEARCH_RADIUS
      );
      setSafeSpots(spots);
      return spots;
    } catch (err) {
      console.error('Error fetching safe spots:', err);
      setError(err.message);
      return [];
    }
  }, [location]);

  /**
   * Fetch community reports
   */
  const fetchCommunityReports = useCallback(async (customLocation) => {
    try {
      const targetLocation = customLocation || location;
      if (!targetLocation) return;

      const reports = await getCommunityReportsNearLocation(targetLocation);
      setCommunityReports(reports);
      return reports;
    } catch (err) {
      console.error('Error fetching community reports:', err);
      setError(err.message);
      return [];
    }
  }, [location]);

  /**
   * Calculate safety scores for routes
   */
  const scoreRoutes = useCallback(async (routesToScore) => {
    try {
      setLoading(true);
      setError(null);

      const targetRoutes = routesToScore || routes;
      if (!targetRoutes || targetRoutes.length === 0) {
        setScoredRoutes([]);
        return [];
      }

      // Fetch community reports if not already loaded
      let reports = communityReports;
      if (reports.length === 0 && location) {
        reports = await fetchCommunityReports();
      }

      // Rank routes by safety
      const ranked = await rankRoutesBySafety(targetRoutes, reports);
      setScoredRoutes(ranked);
      return ranked;
    } catch (err) {
      console.error('Error scoring routes:', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [routes, communityReports, location, fetchCommunityReports]);

  /**
   * Calculate safety score for a single route
   */
  const calculateRouteScore = useCallback(async (route) => {
    try {
      const reports = communityReports.length > 0 
        ? communityReports 
        : await fetchCommunityReports();
      
      const safetyData = await calculateSafetyScore(route, reports);
      return safetyData;
    } catch (err) {
      console.error('Error calculating route score:', err);
      throw err;
    }
  }, [communityReports, fetchCommunityReports]);

  /**
   * Refresh all safety data
   */
  const refreshSafetyData = useCallback(async () => {
    if (!location) return;

    setLoading(true);
    setError(null);

    try {
      await Promise.all([
        fetchSafeSpots(),
        fetchCommunityReports(),
      ]);

      if (routes.length > 0) {
        await scoreRoutes();
      }
    } catch (err) {
      console.error('Error refreshing safety data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [location, routes, fetchSafeSpots, fetchCommunityReports, scoreRoutes]);

  // Auto-fetch data when location changes
  useEffect(() => {
    if (location) {
      refreshSafetyData();
    }
  }, [location?.latitude, location?.longitude]); // Only re-run if coordinates change

  return {
    safeSpots,
    communityReports,
    scoredRoutes,
    loading,
    error,
    fetchSafeSpots,
    fetchCommunityReports,
    scoreRoutes,
    calculateRouteScore,
    refreshSafetyData,
  };
};

export default useSafetyData;
