/**
 * useCommunityAlerts Hook
 * Custom hook for managing community alerts and reports
 */

import { useState, useEffect, useCallback } from 'react';
import {
  addCommunityReport,
  getCommunityReportsNearLocation,
  upvoteCommunityReport,
} from '../services/firebaseService';
import {
  validateCommunityReport,
  sanitizeInput,
} from '../utils/validators';
import {
  RATE_LIMITS,
  SUCCESS_MESSAGES,
  ERROR_MESSAGES,
} from '../utils/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LAST_REPORT_KEY = 'last_report_timestamp';
const REPORT_COUNT_KEY = 'report_count_today';

export const useCommunityAlerts = (location) => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [canReport, setCanReport] = useState(true);
  const [reportCooldown, setReportCooldown] = useState(0);

  /**
   * Check if user can submit a new report (rate limiting)
   */
  const checkReportEligibility = useCallback(async () => {
    try {
      const lastReportTime = await AsyncStorage.getItem(LAST_REPORT_KEY);
      const reportCount = await AsyncStorage.getItem(REPORT_COUNT_KEY);
      
      const now = Date.now();
      const oneHourAgo = now - 60 * 60 * 1000;
      const todayStart = new Date().setHours(0, 0, 0, 0);

      // Check if within cooldown period
      if (lastReportTime && parseInt(lastReportTime) > now - RATE_LIMITS.REPORT_COOLDOWN_MS) {
        const remainingCooldown = Math.ceil(
          (parseInt(lastReportTime) + RATE_LIMITS.REPORT_COOLDOWN_MS - now) / 1000
        );
        setCanReport(false);
        setReportCooldown(remainingCooldown);
        return false;
      }

      // Check hourly limit
      const count = reportCount ? parseInt(reportCount) : 0;
      const countTimestamp = parseInt(lastReportTime) || 0;

      if (countTimestamp > oneHourAgo && count >= RATE_LIMITS.MAX_REPORTS_PER_HOUR) {
        setCanReport(false);
        return false;
      }

      setCanReport(true);
      setReportCooldown(0);
      return true;
    } catch (err) {
      console.error('Error checking report eligibility:', err);
      return false;
    }
  }, []);

  /**
   * Submit a new community report
   */
  const submitReport = useCallback(async (reportData) => {
    try {
      setLoading(true);
      setError(null);

      // Check rate limiting
      const eligible = await checkReportEligibility();
      if (!eligible) {
        throw new Error(ERROR_MESSAGES.REPORT_LIMIT_EXCEEDED);
      }

      // Sanitize inputs
      const sanitizedData = {
        ...reportData,
        description: sanitizeInput(reportData.description),
      };

      // Validate report data
      const validation = validateCommunityReport(sanitizedData);
      if (!validation.isValid) {
        const firstError = Object.values(validation.errors)[0];
        throw new Error(firstError);
      }

      // Submit report
      const reportId = await addCommunityReport(sanitizedData);

      // Update rate limiting data
      const now = Date.now();
      await AsyncStorage.setItem(LAST_REPORT_KEY, now.toString());
      
      const reportCount = await AsyncStorage.getItem(REPORT_COUNT_KEY);
      const count = reportCount ? parseInt(reportCount) : 0;
      await AsyncStorage.setItem(REPORT_COUNT_KEY, (count + 1).toString());

      // Refresh alerts
      await fetchAlerts();

      return {
        success: true,
        reportId,
        message: SUCCESS_MESSAGES.REPORT_SUBMITTED,
      };
    } catch (err) {
      console.error('Error submitting report:', err);
      setError(err.message);
      return {
        success: false,
        error: err.message,
      };
    } finally {
      setLoading(false);
    }
  }, [checkReportEligibility]);

  /**
   * Fetch community alerts near location
   */
  const fetchAlerts = useCallback(async (customLocation, radiusKm = 5) => {
    try {
      setLoading(true);
      setError(null);

      const targetLocation = customLocation || location;
      if (!targetLocation) {
        setAlerts([]);
        return [];
      }

      const reports = await getCommunityReportsNearLocation(targetLocation, radiusKm);
      
      // Sort by timestamp (most recent first)
      const sortedReports = reports.sort((a, b) => {
        const timeA = a.timestamp?.toMillis?.() || 0;
        const timeB = b.timestamp?.toMillis?.() || 0;
        return timeB - timeA;
      });

      setAlerts(sortedReports);
      return sortedReports;
    } catch (err) {
      console.error('Error fetching alerts:', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [location]);

  /**
   * Upvote a community report
   */
  const upvoteReport = useCallback(async (reportId) => {
    try {
      await upvoteCommunityReport(reportId);
      
      // Update local state
      setAlerts((prevAlerts) =>
        prevAlerts.map((alert) =>
          alert.id === reportId
            ? { ...alert, upvotes: (alert.upvotes || 0) + 1 }
            : alert
        )
      );

      return { success: true };
    } catch (err) {
      console.error('Error upvoting report:', err);
      return { success: false, error: err.message };
    }
  }, []);

  /**
   * Filter alerts by type
   */
  const filterAlertsByType = useCallback((type) => {
    if (!type) return alerts;
    return alerts.filter((alert) => alert.reportType === type);
  }, [alerts]);

  /**
   * Filter alerts by severity
   */
  const filterAlertsBySeverity = useCallback((severity) => {
    if (!severity) return alerts;
    return alerts.filter((alert) => alert.severity === severity);
  }, [alerts]);

  /**
   * Get recent alerts (within last 24 hours)
   */
  const getRecentAlerts = useCallback(() => {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    return alerts.filter((alert) => {
      const alertTime = alert.timestamp?.toMillis?.() || 0;
      return alertTime > oneDayAgo;
    });
  }, [alerts]);

  /**
   * Get high-severity alerts
   */
  const getCriticalAlerts = useCallback(() => {
    return alerts.filter((alert) =>
      alert.severity === 'critical' || alert.severity === 'high'
    );
  }, [alerts]);

  // Auto-fetch alerts when location changes
  useEffect(() => {
    if (location) {
      fetchAlerts();
    }
  }, [location?.latitude, location?.longitude]);

  // Check report eligibility on mount and periodically
  useEffect(() => {
    checkReportEligibility();
    
    const interval = setInterval(() => {
      checkReportEligibility();
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [checkReportEligibility]);

  // Countdown timer for cooldown
  useEffect(() => {
    if (reportCooldown > 0) {
      const timer = setTimeout(() => {
        setReportCooldown(reportCooldown - 1);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [reportCooldown]);

  return {
    alerts,
    loading,
    error,
    canReport,
    reportCooldown,
    submitReport,
    fetchAlerts,
    upvoteReport,
    filterAlertsByType,
    filterAlertsBySeverity,
    getRecentAlerts,
    getCriticalAlerts,
    checkReportEligibility,
  };
};

export default useCommunityAlerts;
