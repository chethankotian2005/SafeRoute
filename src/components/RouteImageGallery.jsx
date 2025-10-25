/**
 * RouteImageGallery Component
 * Swipeable carousel for Street View images with safety overlays
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import SafetyOverlay from './SafetyOverlay';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const IMAGE_WIDTH = SCREEN_WIDTH - 40;
const IMAGE_HEIGHT = 250;

const RouteImageGallery = ({ images, onImagePress }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const scrollViewRef = useRef(null);

  const handleGesture = ({ nativeEvent }) => {
    if (nativeEvent.state === State.END) {
      const { translationX } = nativeEvent;

      if (translationX < -50 && currentIndex < images.length - 1) {
        // Swipe left - next image
        const nextIndex = currentIndex + 1;
        setCurrentIndex(nextIndex);
        scrollViewRef.current?.scrollTo({
          x: nextIndex * (IMAGE_WIDTH + 20),
          animated: true,
        });
      } else if (translationX > 50 && currentIndex > 0) {
        // Swipe right - previous image
        const prevIndex = currentIndex - 1;
        setCurrentIndex(prevIndex);
        scrollViewRef.current?.scrollTo({
          x: prevIndex * (IMAGE_WIDTH + 20),
          animated: true,
        });
      }
    }
  };

  const navigateToImage = (index) => {
    setCurrentIndex(index);
    scrollViewRef.current?.scrollTo({
      x: index * (IMAGE_WIDTH + 20),
      animated: true,
    });
  };

  const openFullscreen = (image) => {
    setFullscreenImage(image);
    if (onImagePress) {
      onImagePress(image);
    }
  };

  if (!images || images.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No preview images available</Text>
      </View>
    );
  }

  const currentImage = images[currentIndex];

  return (
    <View style={styles.container}>
      {/* Main image carousel */}
      <PanGestureHandler onHandlerStateChange={handleGesture}>
        <View style={styles.carouselContainer}>
          <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            scrollEnabled={false}
            contentContainerStyle={styles.scrollContent}
          >
            {images.map((image, index) => (
              <TouchableOpacity
                key={index}
                style={styles.imageContainer}
                onPress={() => openFullscreen(image)}
                activeOpacity={0.9}
              >
                <View style={styles.imageWrapper}>
                  <Image
                    source={{ uri: image.url }}
                    style={styles.image}
                    resizeMode="cover"
                  />
                  {image.analysis && (
                    <View style={StyleSheet.absoluteFill}>
                      <SafetyOverlay
                        analysis={image.analysis}
                        width={IMAGE_WIDTH}
                        height={IMAGE_HEIGHT}
                      />
                    </View>
                  )}
                  {/* Image info overlay */}
                  <View style={styles.infoOverlay}>
                    <Text style={styles.distanceText}>
                      {Math.round(image.distanceFromStart)}m from start
                    </Text>
                    {image.type === 'start' && (
                      <View style={styles.typeBadge}>
                        <Text style={styles.typeBadgeText}>START</Text>
                      </View>
                    )}
                    {image.type === 'destination' && (
                      <View style={[styles.typeBadge, styles.destinationBadge]}>
                        <Text style={styles.typeBadgeText}>DESTINATION</Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Navigation arrows */}
          {currentIndex > 0 && (
            <TouchableOpacity
              style={[styles.navButton, styles.navButtonLeft]}
              onPress={() => navigateToImage(currentIndex - 1)}
            >
              <Text style={styles.navButtonText}>‹</Text>
            </TouchableOpacity>
          )}

          {currentIndex < images.length - 1 && (
            <TouchableOpacity
              style={[styles.navButton, styles.navButtonRight]}
              onPress={() => navigateToImage(currentIndex + 1)}
            >
              <Text style={styles.navButtonText}>›</Text>
            </TouchableOpacity>
          )}
        </View>
      </PanGestureHandler>

      {/* Dot indicators */}
      <View style={styles.dotsContainer}>
        {images.map((_, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => navigateToImage(index)}
            style={[
              styles.dot,
              index === currentIndex && styles.dotActive,
            ]}
          />
        ))}
      </View>

      {/* Image counter */}
      <View style={styles.counterContainer}>
        <Text style={styles.counterText}>
          {currentIndex + 1} / {images.length}
        </Text>
      </View>

      {/* Current image details */}
      {currentImage && currentImage.analysis && (
        <View style={styles.detailsContainer}>
          <Text style={styles.detailsTitle}>Key Features:</Text>
          <View style={styles.featuresList}>
            {currentImage.analysis.lighting && (
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>💡</Text>
                <Text style={styles.featureText}>
                  Lighting: {currentImage.analysis.lighting.level}
                </Text>
              </View>
            )}
            {currentImage.analysis.sidewalk && currentImage.analysis.sidewalk.detected && (
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>🚶</Text>
                <Text style={styles.featureText}>Sidewalk present</Text>
              </View>
            )}
            {currentImage.analysis.crowdDensity && (
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>👥</Text>
                <Text style={styles.featureText}>
                  {currentImage.analysis.crowdDensity.density} foot traffic
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Fullscreen modal */}
      {fullscreenImage && (
        <Modal
          visible={true}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setFullscreenImage(null)}
        >
          <View style={styles.fullscreenContainer}>
            <TouchableOpacity
              style={styles.fullscreenClose}
              onPress={() => setFullscreenImage(null)}
            >
              <Text style={styles.fullscreenCloseText}>✕</Text>
            </TouchableOpacity>
            <Image
              source={{ uri: fullscreenImage.url }}
              style={styles.fullscreenImage}
              resizeMode="contain"
            />
            {fullscreenImage.analysis && (
              <View style={StyleSheet.absoluteFill}>
                <SafetyOverlay
                  analysis={fullscreenImage.analysis}
                  width={SCREEN_WIDTH}
                  height={SCREEN_HEIGHT}
                />
              </View>
            )}
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  emptyContainer: {
    height: IMAGE_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    marginHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  carouselContainer: {
    height: IMAGE_HEIGHT,
    position: 'relative',
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  imageContainer: {
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
    marginRight: 20,
  },
  imageWrapper: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  infoOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceText: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    color: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    fontSize: 12,
    fontWeight: '600',
  },
  typeBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginLeft: 8,
  },
  destinationBadge: {
    backgroundColor: '#2196F3',
  },
  typeBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -25 }],
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  navButtonLeft: {
    left: 5,
  },
  navButtonRight: {
    right: 5,
  },
  navButtonText: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ccc',
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: '#2196F3',
    width: 24,
  },
  counterContainer: {
    alignItems: 'center',
    marginTop: 5,
  },
  counterText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  detailsContainer: {
    marginHorizontal: 20,
    marginTop: 15,
    padding: 15,
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
  },
  detailsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  featuresList: {
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  featureText: {
    fontSize: 13,
    color: '#555',
  },
  fullscreenContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  fullscreenClose: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 100,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenCloseText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default RouteImageGallery;
