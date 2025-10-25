/**
 * StreetViewPreview Component
 * Main preview screen showing route safety analysis
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import Modal from 'react-native-modal';
import RouteImageGallery from './RouteImageGallery';
import ConfidenceRating from './ConfidenceRating';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const StreetViewPreview = ({
  visible,
  preview,
  loading,
  loadingProgress,
  onClose,
  onStartNavigation,
  onRequestAlternative,
  onRatingSubmit,
}) => {
  const [showDetails, setShowDetails] = useState(false);

  if (!visible) {
    return null;
  }

  // Loading state
  if (loading) {
    return (
      <Modal
        isVisible={visible}
        onBackdropPress={onClose}
        onBackButtonPress={onClose}
        style={styles.modal}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>
            {loadingProgress?.stage === 'sampling' && 'Analyzing route...'}
            {loadingProgress?.stage === 'fetching' &&
              `Fetching images (${loadingProgress.current || 0}/${loadingProgress.total || 0})`}
            {loadingProgress?.stage === 'analyzing' &&
              `AI Safety Analysis (${loadingProgress.current || 0}/${loadingProgress.total || 0})`}
            {loadingProgress?.stage === 'finalizing' && 'Finalizing preview...'}
            {!loadingProgress?.stage && 'Preparing route preview...'}
          </Text>
          {loadingProgress?.progress !== undefined && (
            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBar,
                  { width: `${loadingProgress.progress * 100}%` },
                ]}
              />
            </View>
          )}
        </View>
      </Modal>
    );
  }

  // Error state
  if (!preview || preview.error) {
    return (
      <Modal
        isVisible={visible}
        onBackdropPress={onClose}
        onBackButtonPress={onClose}
        style={styles.modal}
      >
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Preview Unavailable</Text>
          <Text style={styles.errorText}>
            {preview?.error || 'Unable to generate route preview'}
          </Text>
          <TouchableOpacity style={styles.errorButton} onPress={onClose}>
            <Text style={styles.errorButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  const { statistics, sampledPoints } = preview;

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onClose}
      onBackButtonPress={onClose}
      style={styles.modal}
      propagateSwipe={true}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Route Safety Preview</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Overall Safety Score Card */}
          <View style={[styles.scoreCard, { backgroundColor: statistics.color + '20' }]}>
            <View style={styles.scoreHeader}>
              <Text style={styles.scoreLabel}>Overall Safety Score</Text>
              <TouchableOpacity
                onPress={() => setShowDetails(!showDetails)}
                style={styles.detailsToggle}
              >
                <Text style={styles.detailsToggleText}>
                  {showDetails ? 'Hide Details' : 'Show Details'}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.scoreContent}>
              <View
                style={[
                  styles.scoreBadge,
                  { backgroundColor: statistics.color },
                ]}
              >
                <Text style={styles.scoreValue}>
                  {statistics.overallSafetyScore.toFixed(1)}
                </Text>
                <Text style={styles.scoreMax}>/10</Text>
              </View>
              <View style={styles.scoreInfo}>
                <Text style={[styles.scoreGrade, { color: statistics.color }]}>
                  {statistics.grade}
                </Text>
                <Text style={styles.scoreDescription}>
                  Based on {statistics.segmentCount} analyzed segments
                </Text>
              </View>
            </View>

            {/* Breakdown */}
            {showDetails && statistics.breakdown && (
              <View style={styles.breakdown}>
                <Text style={styles.breakdownTitle}>Breakdown:</Text>
                {Object.entries(statistics.breakdown).map(([key, value]) => (
                  <View key={key} style={styles.breakdownItem}>
                    <Text style={styles.breakdownLabel}>
                      {key.replace(/([A-Z])/g, ' $1').trim()}:
                    </Text>
                    <View style={styles.breakdownBarContainer}>
                      <View
                        style={[
                          styles.breakdownBar,
                          {
                            width: `${(value / 10) * 100}%`,
                            backgroundColor: getScoreColor(value),
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.breakdownValue}>{value.toFixed(1)}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Image Gallery */}
          {sampledPoints && sampledPoints.length > 0 && (
            <RouteImageGallery images={sampledPoints} />
          )}

          {/* Positives */}
          {statistics.positives && statistics.positives.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>✓ Safety Features</Text>
              <View style={styles.list}>
                {statistics.positives.map((positive, index) => (
                  <View key={index} style={styles.listItem}>
                    <View style={[styles.listBullet, styles.positiveBullet]} />
                    <Text style={styles.listText}>{positive}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Concerns */}
          {statistics.concerns && statistics.concerns.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>⚠️ Areas of Concern</Text>
              <View style={styles.list}>
                {statistics.concerns.slice(0, 5).map((concernObj, index) => (
                  <View key={index} style={styles.listItem}>
                    <View style={[styles.listBullet, styles.concernBullet]} />
                    <View style={styles.concernContent}>
                      <Text style={styles.listText}>{concernObj.concern}</Text>
                      <Text style={styles.concernLocation}>
                        {concernObj.location}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Recommendations */}
          {statistics.recommendations && statistics.recommendations.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>💡 Recommendations</Text>
              <View style={styles.list}>
                {statistics.recommendations.map((recommendation, index) => (
                  <View key={index} style={styles.listItem}>
                    <View style={[styles.listBullet, styles.recommendationBullet]} />
                    <Text style={styles.listText}>{recommendation}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Problem Segments */}
          {statistics.problemSegments && statistics.problemSegments.length > 0 && (
            <View style={[styles.section, styles.problemSection]}>
              <Text style={styles.sectionTitle}>🚨 Problem Segments</Text>
              <Text style={styles.problemDescription}>
                These segments have safety scores below 4.0:
              </Text>
              {statistics.problemSegments.map((segment, index) => (
                <View key={index} style={styles.problemSegment}>
                  <Text style={styles.problemSegmentTitle}>
                    Segment {segment.index + 1} ({segment.distance}m from start)
                  </Text>
                  <Text style={styles.problemSegmentScore}>
                    Score: {segment.score.toFixed(1)}/10
                  </Text>
                  {segment.mainIssues.map((issue, idx) => (
                    <Text key={idx} style={styles.problemSegmentIssue}>
                      • {issue}
                    </Text>
                  ))}
                </View>
              ))}
            </View>
          )}

          {/* Confidence Rating */}
          <View style={styles.ratingSection}>
            <ConfidenceRating
              onRatingSubmit={(rating) => {
                if (onRatingSubmit) onRatingSubmit(rating);
                if (rating.id === 'comfortable' && onStartNavigation) {
                  setTimeout(onStartNavigation, 500);
                }
              }}
              onRequestAlternative={onRequestAlternative}
              showAlternativeButton={statistics.overallSafetyScore < 6}
            />
          </View>

          {/* Metadata */}
          {preview.metadata && (
            <View style={styles.metadata}>
              <Text style={styles.metadataText}>
                Preview generated {new Date(preview.metadata.generatedAt).toLocaleTimeString()}
              </Text>
              <Text style={styles.metadataText}>
                Analysis time: {(preview.metadata.generationTime / 1000).toFixed(1)}s
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const getScoreColor = (score) => {
  if (score >= 7.5) return '#4CAF50';
  if (score >= 6) return '#8BC34A';
  if (score >= 4.5) return '#FFC107';
  if (score >= 3) return '#FF9800';
  return '#FF5252';
};

const styles = StyleSheet.create({
  modal: {
    margin: 0,
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '95%',
    minHeight: '50%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#666',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  progressBarContainer: {
    width: '100%',
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    marginTop: 20,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#2196F3',
  },
  errorContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  errorButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    backgroundColor: '#2196F3',
    borderRadius: 8,
  },
  errorButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  scoreCard: {
    margin: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  detailsToggle: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    borderRadius: 12,
  },
  detailsToggleText: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: '600',
  },
  scoreContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  scoreMax: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  scoreInfo: {
    flex: 1,
  },
  scoreGrade: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  scoreDescription: {
    fontSize: 13,
    color: '#666',
  },
  breakdown: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  breakdownTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  breakdownLabel: {
    fontSize: 13,
    color: '#666',
    width: 100,
    textTransform: 'capitalize',
  },
  breakdownBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  breakdownBar: {
    height: '100%',
    borderRadius: 4,
  },
  breakdownValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    width: 30,
    textAlign: 'right',
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  list: {
    gap: 8,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  listBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
    marginTop: 6,
  },
  positiveBullet: {
    backgroundColor: '#4CAF50',
  },
  concernBullet: {
    backgroundColor: '#FF9800',
  },
  recommendationBullet: {
    backgroundColor: '#2196F3',
  },
  listText: {
    flex: 1,
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  concernContent: {
    flex: 1,
  },
  concernLocation: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  problemSection: {
    backgroundColor: '#FFF3E0',
    padding: 16,
    borderRadius: 12,
  },
  problemDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
  },
  problemSegment: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#FF5252',
  },
  problemSegmentTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  problemSegmentScore: {
    fontSize: 13,
    color: '#FF5252',
    fontWeight: 'bold',
    marginBottom: 6,
  },
  problemSegmentIssue: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
    marginTop: 2,
  },
  ratingSection: {
    marginTop: 10,
    marginBottom: 20,
  },
  metadata: {
    padding: 20,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  metadataText: {
    fontSize: 11,
    color: '#999',
    marginBottom: 2,
  },
});

export default StreetViewPreview;
