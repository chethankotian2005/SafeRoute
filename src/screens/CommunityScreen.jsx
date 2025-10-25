import React, { useState } from 'react';
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

const CommunityScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [radiusFilter, setRadiusFilter] = useState('5km');
  const [sortBy, setSortBy] = useState('recent');
  const [refreshing, setRefreshing] = useState(false);

  const alerts = [
    {
      id: 1,
      type: 'warning',
      title: 'Poor Street Lighting',
      location: 'MG Road, Near Metro',
      time: '2 hours ago',
      severity: 'medium',
      icon: 'warning',
      color: THEME_COLORS.WARNING_ORANGE,
      reportedBy: 'Sarah K.',
      upvotes: 12,
      verified: false,
      hasPhoto: true,
    },
    {
      id: 2,
      type: 'danger',
      title: 'Harassment Reported',
      location: 'College Street Junction',
      time: '5 hours ago',
      severity: 'high',
      icon: 'alert-circle',
      color: THEME_COLORS.ALERT_RED,
      reportedBy: 'John D.',
      upvotes: 28,
      verified: true,
      hasPhoto: false,
    },
    {
      id: 3,
      type: 'safe',
      title: 'Well-Lit Safe Path',
      location: 'Beach Road Walkway',
      time: '1 day ago',
      severity: 'low',
      icon: 'checkmark-circle',
      color: THEME_COLORS.SAFETY_GREEN,
      reportedBy: 'Mike R.',
      upvotes: 45,
      verified: true,
      hasPhoto: true,
    },
    {
      id: 4,
      type: 'warning',
      title: 'Suspicious Activity',
      location: 'Park Avenue',
      time: '2 days ago',
      severity: 'medium',
      icon: 'eye',
      color: THEME_COLORS.WARNING_ORANGE,
      reportedBy: 'Emma L.',
      upvotes: 7,
      verified: false,
      hasPhoto: false,
    },
  ];

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
    setTimeout(() => setRefreshing(false), 1500);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header with modern design */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.headerContent}>
          <Ionicons name="people-circle" size={28} color={THEME_COLORS.SAFETY_GREEN} />
          <Text style={[styles.headerTitle, { color: colors.text }]}>Community Alerts</Text>
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
        <TouchableOpacity style={[styles.topFilterButton, { backgroundColor: colors.background }]}>
          <Ionicons name="location-outline" size={16} color={THEME_COLORS.SAFETY_GREEN} />
          <Text style={[styles.topFilterText, { color: colors.text }]}>Within {radiusFilter}</Text>
          <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.topFilterButton, { backgroundColor: colors.background }]}>
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

        {alerts.length > 0 ? (
          alerts.map((alert) => {
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
                {alert.hasPhoto && (
                  <View style={styles.alertPhoto}>
                    <View style={[styles.photoPlaceholder, { backgroundColor: colors.disabled }]}>
                      <Ionicons name="image" size={24} color={colors.textSecondary} />
                    </View>
                  </View>
                )}

                {/* Action Buttons */}
                <View style={[styles.alertActions, { borderTopColor: colors.border }]}>
                  <TouchableOpacity style={styles.actionButton}>
                    <Ionicons name="arrow-up-circle-outline" size={20} color={THEME_COLORS.SAFETY_GREEN} />
                    <Text style={[styles.actionButtonText, { color: colors.text }]}>{alert.upvotes} confirms</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.actionButton}>
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
});

export default CommunityScreen;
