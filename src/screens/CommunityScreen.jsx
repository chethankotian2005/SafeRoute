import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Alert, 
  RefreshControl,
  Image 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME_COLORS } from '../utils/constants';
import { useTheme } from '../context/ThemeContext';
import { getCommunityReportsNearLocation, upvoteCommunityReport } from '../services/firebaseService';
import { useLocation } from '../hooks/useLocation';

const CommunityScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { location } = useLocation();
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [radiusFilter, setRadiusFilter] = useState('5km');
  const [radiusKm, setRadiusKm] = useState(5);
  const [showRadiusPicker, setShowRadiusPicker] = useState(false);
  const [showSortPicker, setShowSortPicker] = useState(false);
  const [sortBy, setSortBy] = useState('recent');
  const [refreshing, setRefreshing] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch community reports on component mount and when location changes
  useEffect(() => {
    if (location) {
      fetchCommunityReports();
    }
  }, [location, radiusKm]);

  const fetchCommunityReports = async () => {
    try {
      setLoading(true);
      const reports = await getCommunityReportsNearLocation(location, radiusKm);
      
      // Transform Firebase data to UI format
      const transformedAlerts = reports.map(report => ({
        id: report.id,
        type: getReportType(report.type),
        title: report.title || getTitleFromType(report.type),
        location: buildLocationLine(report),
        time: getTimeAgo(report.timestamp),
        severity: getSeverityFromType(report.type),
        icon: getIconFromType(report.type),
        color: getColorFromType(report.type),
        reportedBy: 'Anonymous', // Firebase doesn't store user names in reports
        upvotes: report.upvotes || 0,
        verified: report.verified || false,
        hasPhoto: report.imageUrl ? true : false,
        imageUrl: report.imageUrl,
        reportData: report, // Keep original data for actions
        distanceKm: typeof report.distanceKm === 'number' ? report.distanceKm : null,
      }));
      
      setAlerts(transformedAlerts);
    } catch (error) {
      console.error('Error fetching community reports:', error);
      Alert.alert('Error', 'Failed to load community reports');
    } finally {
      setLoading(false);
    }
  };

  // Build a user-friendly location line with distance if available
  const buildLocationLine = (report) => {
    const label = report.locationDescription || 'Location not specified';
    if (typeof report.distanceKm === 'number') {
      const d = report.distanceKm < 1 ? `${Math.round(report.distanceKm * 1000)} m` : `${report.distanceKm.toFixed(1)} km`;
      return `${d} away • ${label}`;
    }
    return label;
  };

  // Helper functions to transform Firebase data
  const getReportType = (type) => {
    const typeMap = {
      'harassment': 'danger',
      'lighting': 'warning',
      'suspicious': 'warning',
      'safe': 'safe',
      'accident': 'danger',
      'other': 'warning'
    };
    return typeMap[type] || 'warning';
  };

  const getTitleFromType = (type) => {
    const titleMap = {
      'harassment': 'Harassment Reported',
      'lighting': 'Poor Street Lighting',
      'suspicious': 'Suspicious Activity',
      'safe': 'Safe Area Reported',
      'accident': 'Accident Reported',
      'other': 'Incident Reported'
    };
    return titleMap[type] || 'Incident Reported';
  };

  const getSeverityFromType = (type) => {
    const severityMap = {
      'harassment': 'high',
      'accident': 'high',
      'lighting': 'medium',
      'suspicious': 'medium',
      'safe': 'low',
      'other': 'medium'
    };
    return severityMap[type] || 'medium';
  };

  const getIconFromType = (type) => {
    const iconMap = {
      'harassment': 'alert-circle',
      'lighting': 'bulb-outline',
      'suspicious': 'eye-outline',
      'safe': 'checkmark-circle',
      'accident': 'medical',
      'other': 'ellipsis-horizontal-circle'
    };
    return iconMap[type] || 'warning';
  };

  const getColorFromType = (type) => {
    const colorMap = {
      'harassment': THEME_COLORS.ALERT_RED,
      'accident': THEME_COLORS.ALERT_RED,
      'lighting': THEME_COLORS.WARNING_ORANGE,
      'suspicious': THEME_COLORS.WARNING_ORANGE,
      'safe': THEME_COLORS.SAFETY_GREEN,
      'other': THEME_COLORS.ACCENT_BLUE
    };
    return colorMap[type] || THEME_COLORS.WARNING_ORANGE;
  };

  const getTimeAgo = (timestamp) => {
    if (!timestamp) return 'Unknown time';
    
    const now = new Date();
    const reportTime = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const diffMs = now - reportTime;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return reportTime.toLocaleDateString();
  };

  const getSeverityBadge = (severity) => {
    const badges = {
      high: { bg: '#FEE2E2', text: THEME_COLORS.ALERT_RED, label: 'High' },
      medium: { bg: '#FEF3C7', text: THEME_COLORS.WARNING_ORANGE, label: 'Medium' },
      low: { bg: '#D1FAE5', text: THEME_COLORS.SAFETY_GREEN, label: 'Low' },
    };
    return badges[severity] || badges.low;
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchCommunityReports().finally(() => setRefreshing(false));
  };

  const sortAlerts = (alertsToSort) => {
    const sorted = [...alertsToSort];
    if (sortBy === 'recent') {
      return sorted.sort((a, b) => {
        const timeA = a.reportData?.timestamp?.toDate?.() || new Date(a.reportData?.timestamp);
        const timeB = b.reportData?.timestamp?.toDate?.() || new Date(b.reportData?.timestamp);
        return timeB - timeA; // Most recent first
      });
    } else if (sortBy === 'verified') {
      return sorted.sort((a, b) => {
        if (a.verified === b.verified) return 0;
        return a.verified ? -1 : 1; // Verified first
      });
    } else if (sortBy === 'nearby') {
      return sorted.sort((a, b) => {
        const distA = a.distanceKm !== null ? a.distanceKm : Infinity;
        const distB = b.distanceKm !== null ? b.distanceKm : Infinity;
        return distA - distB; // Closest first
      });
    }
    return sorted;
  };

  const handleUpvote = async (reportId) => {
    try {
      await upvoteCommunityReport(reportId);
      // Update local state to reflect the upvote
      setAlerts(prevAlerts => 
        prevAlerts.map(alert => 
          alert.id === reportId 
            ? { ...alert, upvotes: alert.upvotes + 1 }
            : alert
        )
      );
    } catch (error) {
      console.error('Error upvoting report:', error);
      Alert.alert('Error', 'Failed to upvote report');
    }
  };

  const handleViewOnMap = (alert) => {
    // Navigate to map screen with the report location
    navigation.navigate('Map', {
      focusLocation: alert.reportData.location,
      reportId: alert.id
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header with modern design */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.headerContent}>
          <Ionicons name="people-circle" size={28} color={THEME_COLORS.SAFETY_GREEN} />
          <Text style={[styles.headerTitle, { color: colors.text }]}>Community</Text>
        </View>
        <TouchableOpacity
          style={styles.reportButton}
          onPress={() => navigation.navigate('ReportForm')}
        >
          <Ionicons name="add-circle" size={28} color={THEME_COLORS.SAFETY_GREEN} />
        </TouchableOpacity>
      </View>

      {/* Location & Sort Filters */}
      <View style={[styles.topFilters, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          style={[styles.topFilterButton, { backgroundColor: colors.background }]}
          onPress={() => setShowRadiusPicker(true)}
        > 
          <Ionicons name="location-outline" size={16} color={THEME_COLORS.SAFETY_GREEN} />
          <Text style={[styles.topFilterText, { color: colors.text }]}>Within {radiusFilter}</Text>
          <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.topFilterButton, { backgroundColor: colors.background }]}
          onPress={() => setShowSortPicker(true)}
        >
          <Ionicons name="swap-vertical" size={16} color={colors.textSecondary} />
          <Text style={[styles.topFilterText, { color: colors.text }]}>
            {sortBy === 'recent' ? 'Recent' : sortBy === 'verified' ? 'Most Verified' : 'Nearby'}
          </Text>
          <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Alerts List with Pull to Refresh */}
      <ScrollView 
        style={styles.alertsList} 
        contentContainerStyle={styles.alertsContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[THEME_COLORS.SAFETY_GREEN]} />
        }
      >
        {/* Filter Chips - Horizontally Scrollable - Now inside main scroll */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
          contentContainerStyle={styles.filterContent}
        >
          <TouchableOpacity 
            style={[
              styles.filterChip, 
              selectedFilter === 'all' && styles.filterChipActive,
              { backgroundColor: selectedFilter === 'all' ? THEME_COLORS.SAFETY_GREEN : colors.disabled }
            ]}
            onPress={() => setSelectedFilter('all')}
          >
            <Text style={[
              styles.filterChipText,
              selectedFilter === 'all' && styles.filterChipTextActive,
              { color: selectedFilter === 'all' ? '#FFFFFF' : colors.textSecondary }
            ]}>All</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.filterChip,
              selectedFilter === 'danger' && styles.filterChipActive,
              { backgroundColor: selectedFilter === 'danger' ? THEME_COLORS.ALERT_RED : colors.disabled }
            ]}
            onPress={() => setSelectedFilter('danger')}
          >
            <Ionicons 
              name="alert-circle" 
              size={14} 
              color={selectedFilter === 'danger' ? '#FFFFFF' : colors.textSecondary} 
            />
            <Text style={[
              styles.filterChipText,
              selectedFilter === 'danger' && styles.filterChipTextActive,
              { color: selectedFilter === 'danger' ? '#FFFFFF' : colors.textSecondary }
            ]}>Danger</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.filterChip,
              selectedFilter === 'warning' && styles.filterChipActive,
              { backgroundColor: selectedFilter === 'warning' ? THEME_COLORS.WARNING_ORANGE : colors.disabled }
            ]}
            onPress={() => setSelectedFilter('warning')}
          >
            <Ionicons 
              name="warning" 
              size={14} 
              color={selectedFilter === 'warning' ? '#FFFFFF' : colors.textSecondary} 
            />
            <Text style={[
              styles.filterChipText,
              selectedFilter === 'warning' && styles.filterChipTextActive,
              { color: selectedFilter === 'warning' ? '#FFFFFF' : colors.textSecondary }
            ]}>Warning</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.filterChip,
              selectedFilter === 'safe' && styles.filterChipActive,
              { backgroundColor: selectedFilter === 'safe' ? THEME_COLORS.SAFETY_GREEN : colors.disabled }
            ]}
            onPress={() => setSelectedFilter('safe')}
          >
            <Ionicons 
              name="checkmark-circle" 
              size={14} 
              color={selectedFilter === 'safe' ? '#FFFFFF' : colors.textSecondary} 
            />
            <Text style={[
              styles.filterChipText,
              selectedFilter === 'safe' && styles.filterChipTextActive,
              { color: selectedFilter === 'safe' ? '#FFFFFF' : colors.textSecondary }
            ]}>Safe</Text>
          </TouchableOpacity>
        </ScrollView>

        {loading ? (
          <View style={styles.loadingState}>
            <Ionicons name="refresh-circle" size={40} color={THEME_COLORS.SAFETY_GREEN} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading community reports...</Text>
          </View>
        ) : alerts.length > 0 ? (
          sortAlerts(alerts)
            .filter(alert => selectedFilter === 'all' || alert.type === selectedFilter)
            .map((alert) => {
            const badge = getSeverityBadge(alert.severity);
            return (
              <View
                key={alert.id}
                style={[styles.alertCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                {/* User Avatar & Info */}
                <View style={styles.alertCardHeader}>
                  <View style={styles.userInfo}>
                    <View style={styles.userAvatar}>
                      <Ionicons name="person" size={16} color={THEME_COLORS.SAFETY_GREEN} />
                    </View>
                    <View>
                      <Text style={[styles.userName, { color: colors.text }]}>{alert.reportedBy}</Text>
                      <Text style={[styles.alertTime, { color: colors.textSecondary }]}>{alert.time}</Text>
                    </View>
                  </View>
                  {alert.verified && (
                    <View style={styles.verifiedBadge}>
                      <Ionicons name="checkmark-circle" size={16} color={THEME_COLORS.SAFETY_GREEN} />
                      <Text style={styles.verifiedText}>Verified</Text>
                    </View>
                  )}
                </View>

                {/* Alert Content */}
                <View style={styles.alertMainContent}>
                  <View style={[styles.alertIcon, { backgroundColor: `${alert.color}20` }]}>
                    <Ionicons name={alert.icon} size={24} color={alert.color} />
                  </View>
                  
                  <View style={styles.alertContent}>
                    <View style={styles.alertHeader}>
                      <Text style={[styles.alertTitle, { color: colors.text }]}>{alert.title}</Text>
                      <View style={[styles.severityBadge, { backgroundColor: badge.bg }]}>
                        <Text style={[styles.severityText, { color: badge.text }]}>{badge.label}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.alertMeta}>
                      <Ionicons name="location" size={14} color={THEME_COLORS.SAFETY_GREEN} />
                      <Text style={[styles.alertLocation, { color: colors.textSecondary }]}>{alert.location}</Text>
                    </View>
                  </View>
                </View>

                {/* Photo if available */}
                {alert.hasPhoto && alert.imageUrl && (
                  <View style={styles.alertPhoto}>
                    <Image source={{ uri: alert.imageUrl }} style={styles.alertImage} />
                  </View>
                )}

                {/* Action Buttons */}
                <View style={[styles.alertActions, { borderTopColor: colors.border }]}>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => handleUpvote(alert.id)}
                  >
                    <Ionicons name="arrow-up-circle-outline" size={20} color={THEME_COLORS.SAFETY_GREEN} />
                    <Text style={[styles.actionButtonText, { color: colors.text }]}>{alert.upvotes} confirms</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => handleViewOnMap(alert)}
                  >
                    <Ionicons name="map-outline" size={20} color={colors.primary} />
                    <Text style={[styles.actionButtonText, { color: colors.text }]}>View on Map</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        ) : (
          // Empty State
          <View style={styles.emptyState}>
            <Ionicons name="shield-checkmark-outline" size={80} color={colors.disabled} />
            <Text style={[styles.emptyStateTitle, { color: colors.text }]}>No Alerts in Your Area</Text>
            <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
              Your community is safe! Be the first to report an incident.
            </Text>
          </View>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('ReportForm')}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Sort Picker Modal */}
      {showSortPicker && (
        <View style={styles.radiusOverlay}>
          <View style={[styles.radiusSheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.radiusTitle, { color: colors.text }]}>Sort by</Text>
            <View style={styles.radiusOptionsRow}>
              <TouchableOpacity
                style={[styles.radiusPill, sortBy === 'recent' && styles.radiusPillActive]}
                onPress={() => {
                  setSortBy('recent');
                  setShowSortPicker(false);
                }}
              >
                <Text style={[styles.radiusPillText, sortBy === 'recent' && styles.radiusPillTextActive]}>Recent</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.radiusPill, sortBy === 'verified' && styles.radiusPillActive]}
                onPress={() => {
                  setSortBy('verified');
                  setShowSortPicker(false);
                }}
              >
                <Text style={[styles.radiusPillText, sortBy === 'verified' && styles.radiusPillTextActive]}>Most Verified</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.radiusPill, sortBy === 'nearby' && styles.radiusPillActive]}
                onPress={() => {
                  setSortBy('nearby');
                  setShowSortPicker(false);
                }}
              >
                <Text style={[styles.radiusPillText, sortBy === 'nearby' && styles.radiusPillTextActive]}>Nearby</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.radiusClose} onPress={() => setShowSortPicker(false)}>
              <Text style={[styles.radiusCloseText, { color: colors.text }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Radius Picker Modal */}
      {showRadiusPicker && (
        <View style={styles.radiusOverlay}>
          <View style={[styles.radiusSheet, { backgroundColor: colors.surface, borderColor: colors.border }] }>
            <Text style={[styles.radiusTitle, { color: colors.text }]}>Show alerts within</Text>
            <View style={styles.radiusOptionsRow}>
              { [1,2,3,5,10,20].map((km) => (
                <TouchableOpacity
                  key={km}
                  style={[styles.radiusPill, radiusKm === km && styles.radiusPillActive]}
                  onPress={() => {
                    setRadiusKm(km);
                    setRadiusFilter(`${km}km`);
                    setShowRadiusPicker(false);
                  }}
                >
                  <Text style={[styles.radiusPillText, radiusKm === km && styles.radiusPillTextActive]}>{km} km</Text>
                </TouchableOpacity>
              )) }
            </View>
            <TouchableOpacity style={styles.radiusClose} onPress={() => setShowRadiusPicker(false)}>
              <Text style={[styles.radiusCloseText, { color: colors.text }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  reportButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: '#D1FAE5',
  },
  topFilters: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: 1,
  },
  topFilterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  topFilterText: {
    fontSize: 14,
    fontWeight: '600',
  },
  filterContainer: {
    marginBottom: 12,
  },
  filterContent: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 6,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  filterChipActive: {
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  filterChipTextActive: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  alertsList: {
    flex: 1,
  },
  alertsContent: {
    padding: 12,
    paddingBottom: 100,
  },
  alertCard: {
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
  },
  alertCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  userAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontSize: 12,
    fontWeight: '600',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#D1FAE5',
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME_COLORS.SAFETY_GREEN,
  },
  alertMainContent: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  alertIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertContent: {
    flex: 1,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  alertTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  severityBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  severityText: {
    fontSize: 10,
    fontWeight: '600',
  },
  alertMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  alertLocation: {
    fontSize: 12,
  },
  alertTime: {
    fontSize: 11,
    marginTop: 2,
  },
  alertPhoto: {
    marginTop: 8,
    marginBottom: 8,
  },
  photoPlaceholder: {
    height: 100,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertImage: {
    width: '100%',
    height: 100,
    borderRadius: 8,
  },
  alertActions: {
    flexDirection: 'row',
    paddingTop: 10,
    borderTopWidth: 1,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 6,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  fab: {
    position: 'absolute',
    bottom: 28,
    right: 28,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: THEME_COLORS.SAFETY_GREEN,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: THEME_COLORS.SAFETY_GREEN,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  // Radius picker styles
  radiusOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  radiusSheet: {
    width: '100%',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderTopWidth: 1,
  },
  radiusTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  radiusOptionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  radiusPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  radiusPillActive: {
    backgroundColor: '#DCFCE7',
    borderColor: THEME_COLORS.SAFETY_GREEN,
  },
  radiusPillText: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '600',
  },
  radiusPillTextActive: {
    color: THEME_COLORS.SAFETY_GREEN,
  },
  radiusClose: {
    marginTop: 14,
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  radiusCloseText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default CommunityScreen;
