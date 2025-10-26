/**
 * Walking Navigation Service
 * Provides turn-by-turn navigation for walking routes
 */

import * as Location from 'expo-location';

/**
 * Navigation state manager
 */
class NavigationManager {
  constructor() {
    this.isNavigating = false;
    this.currentRoute = null;
    this.currentStepIndex = 0;
    this.locationSubscription = null;
    this.onUpdateCallback = null;
    this.onArrivalCallback = null;
    this.onDeviationCallback = null;
    this.userLocation = null;
  }

  /**
   * Start navigation with turn-by-turn directions
   */
  async startNavigation(route, callbacks = {}) {
    try {
      this.currentRoute = route;
      this.currentStepIndex = 0;
      this.isNavigating = true;
      this.onUpdateCallback = callbacks.onUpdate;
      this.onArrivalCallback = callbacks.onArrival;
      this.onDeviationCallback = callbacks.onDeviation;

      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission denied');
      }

      // Start watching user location
      this.locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 2000, // Update every 2 seconds
          distanceInterval: 5, // Update every 5 meters
        },
        (location) => {
          this.handleLocationUpdate(location);
        }
      );

      return { success: true };
    } catch (error) {
      console.error('Error starting navigation:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Handle location updates during navigation
   */
  handleLocationUpdate(location) {
    if (!this.isNavigating || !this.currentRoute) return;

    this.userLocation = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      heading: location.coords.heading,
    };

    const currentStep = this.getCurrentStep();
    if (!currentStep) return;

    // Calculate distance to next step
    const endLat = (currentStep.end_location && currentStep.end_location.lat) 
      || (currentStep.endLocation && currentStep.endLocation.latitude);
    const endLng = (currentStep.end_location && currentStep.end_location.lng) 
      || (currentStep.endLocation && currentStep.endLocation.longitude);

    if (typeof endLat !== 'number' || typeof endLng !== 'number') {
      // If step doesn't have coordinates, skip update gracefully
      return;
    }

    const distanceToStep = this.calculateDistance(
      this.userLocation.latitude,
      this.userLocation.longitude,
      endLat,
      endLng
    );

    // Check if user reached current step
    if (distanceToStep < 0.02) { // 20 meters threshold
      this.moveToNextStep();
    }

    // Check for route deviation
    const distanceToRoute = this.calculateDistanceToRoute();
    if (distanceToRoute > 0.05) { // 50 meters off route
      this.handleDeviation();
    }

    // Send update to UI
    if (this.onUpdateCallback) {
      this.onUpdateCallback({
        currentStep: this.currentStepIndex,
        totalSteps: this.currentRoute.steps.length,
        distanceToNextStep: distanceToStep,
        instruction: currentStep.instruction || currentStep.html_instructions || '',
        maneuver: currentStep.maneuver,
        userLocation: this.userLocation,
        distanceRemaining: this.getRemainingDistance(),
        timeRemaining: this.getRemainingTime(),
      });
    }
  }

  /**
   * Move to next navigation step
   */
  moveToNextStep() {
    this.currentStepIndex++;

    if (this.currentStepIndex >= this.currentRoute.steps.length) {
      // Arrived at destination
      this.handleArrival();
    }
  }

  /**
   * Handle arrival at destination
   */
  handleArrival() {
    this.isNavigating = false;
    if (this.locationSubscription) {
      this.locationSubscription.remove();
    }

    if (this.onArrivalCallback) {
      this.onArrivalCallback({
        destination: this.currentRoute.destination,
        totalDistance: this.currentRoute.distance,
        totalDuration: this.currentRoute.duration,
      });
    }
  }

  /**
   * Handle route deviation
   */
  handleDeviation() {
    if (this.onDeviationCallback) {
      this.onDeviationCallback({
        userLocation: this.userLocation,
        suggestRecalculation: true,
      });
    }
  }

  /**
   * Get current navigation step
   */
  getCurrentStep() {
    if (!this.currentRoute || !this.currentRoute.steps) return null;
    return this.currentRoute.steps[this.currentStepIndex];
  }

  /**
   * Calculate distance to route polyline
   */
  calculateDistanceToRoute() {
    if (!this.currentRoute || !this.currentRoute.coordinates || !this.userLocation) {
      return 0;
    }

    // Find closest point on route
    let minDistance = Infinity;
    
    this.currentRoute.coordinates.forEach(coord => {
      const distance = this.calculateDistance(
        this.userLocation.latitude,
        this.userLocation.longitude,
        coord.latitude,
        coord.longitude
      );
      
      if (distance < minDistance) {
        minDistance = distance;
      }
    });

    return minDistance;
  }

  /**
   * Calculate remaining distance
   */
  getRemainingDistance() {
    if (!this.currentRoute || !this.currentRoute.steps) return 0;

    let remainingDistance = 0;
    for (let i = this.currentStepIndex; i < this.currentRoute.steps.length; i++) {
      remainingDistance += this.currentRoute.steps[i].distance.value;
    }

    return remainingDistance;
  }

  /**
   * Calculate remaining time
   */
  getRemainingTime() {
    if (!this.currentRoute || !this.currentRoute.steps) return 0;

    let remainingTime = 0;
    for (let i = this.currentStepIndex; i < this.currentRoute.steps.length; i++) {
      remainingTime += this.currentRoute.steps[i].duration.value;
    }

    return remainingTime;
  }

  /**
   * Stop navigation
   */
  stopNavigation() {
    this.isNavigating = false;
    this.currentRoute = null;
    this.currentStepIndex = 0;

    if (this.locationSubscription) {
      this.locationSubscription.remove();
      this.locationSubscription = null;
    }
  }

  /**
   * Calculate distance between two points (Haversine)
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return distance;
  }

  toRad(value) {
    return value * Math.PI / 180;
  }

  /**
   * Format distance for display
   */
  formatDistance(meters) {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(1)} km`;
  }

  /**
   * Format duration for display
   */
  formatDuration(seconds) {
    if (seconds < 60) {
      return `${seconds} sec`;
    }
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  }

  /**
   * Get maneuver icon
   */
  getManeuverIcon(maneuver) {
    const icons = {
      'turn-right': 'arrow-forward',
      'turn-left': 'arrow-back',
      'turn-slight-right': 'arrow-forward',
      'turn-slight-left': 'arrow-back',
      'turn-sharp-right': 'arrow-forward',
      'turn-sharp-left': 'arrow-back',
      'uturn-right': 'return-up-back',
      'uturn-left': 'return-up-forward',
      'straight': 'arrow-up',
      'ramp-right': 'trending-up',
      'ramp-left': 'trending-up',
      'merge': 'git-merge',
      'fork-right': 'git-branch',
      'fork-left': 'git-branch',
      'roundabout-right': 'radio-button-on',
      'roundabout-left': 'radio-button-on',
    };

    return icons[maneuver] || 'navigate';
  }
}

// Export singleton instance
export const navigationManager = new NavigationManager();

/**
 * Parse navigation steps from Google Directions API response
 */
export const parseNavigationSteps = (directionsLeg) => {
  if (!directionsLeg || !directionsLeg.steps) return [];

  return directionsLeg.steps.map((step, index) => ({
    index,
    distance: step.distance,
    duration: step.duration,
    html_instructions: step.html_instructions.replace(/<[^>]*>/g, ''), // Strip HTML tags
    maneuver: step.maneuver || 'straight',
    start_location: step.start_location,
    end_location: step.end_location,
    polyline: step.polyline,
  }));
};

/**
 * Generate voice instruction from step
 */
export const generateVoiceInstruction = (step, distanceToStep) => {
  const maneuverText = {
    'turn-right': 'Turn right',
    'turn-left': 'Turn left',
    'turn-slight-right': 'Slight right',
    'turn-slight-left': 'Slight left',
    'turn-sharp-right': 'Sharp right',
    'turn-sharp-left': 'Sharp left',
    'uturn-right': 'Make a U-turn',
    'uturn-left': 'Make a U-turn',
    'straight': 'Continue straight',
    'ramp-right': 'Take the ramp on the right',
    'ramp-left': 'Take the ramp on the left',
  };

  const action = maneuverText[step.maneuver] || 'Continue';
  const distance = navigationManager.formatDistance(distanceToStep * 1000);
  
  if (distanceToStep < 0.05) { // Less than 50 meters
    return `${action} now`;
  } else {
    return `In ${distance}, ${action}`;
  }
};
