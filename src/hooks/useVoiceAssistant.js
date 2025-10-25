import { useState, useEffect, useRef, useCallback } from 'react';
import { AppState } from 'react-native';
import voiceAssistant from '../services/voiceAssistant';

/**
 * Custom hook for managing voice assistant functionality
 * @param {object} options - Configuration options
 * @param {boolean} options.autoStart - Auto-start listening when hook mounts
 * @param {function} options.onCommand - Callback when command is recognized
 * @param {function} options.onError - Callback when error occurs
 * @returns {object} Voice assistant state and controls
 */
export function useVoiceAssistant(options = {}) {
  const {
    autoStart = false,
    onCommand = null,
    onError = null,
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [lastCommand, setLastCommand] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState(null);
  const [language, setLanguage] = useState('en-US');

  const appState = useRef(AppState.currentState);
  const initializationAttempted = useRef(false);

  /**
   * Initialize voice assistant
   */
  const initialize = useCallback(async () => {
    if (initializationAttempted.current) return;
    initializationAttempted.current = true;

    try {
      const success = await voiceAssistant.initialize();
      setIsInitialized(success);
      
      if (success) {
        const currentLang = voiceAssistant.getCurrentLanguage();
        setLanguage(currentLang);
      } else {
        setError('Failed to initialize voice assistant');
        if (onError) {
          onError(new Error('Initialization failed'));
        }
      }
    } catch (err) {
      console.error('Error initializing voice assistant:', err);
      setError(err.message);
      if (onError) {
        onError(err);
      }
    }
  }, [onError]);

  /**
   * Start listening for voice commands
   */
  const startListening = useCallback(async () => {
    try {
      const success = await voiceAssistant.startListening();
      if (success) {
        setIsListening(true);
        setIsActive(true);
        setError(null);
      } else {
        setError('Failed to start listening');
      }
      return success;
    } catch (err) {
      console.error('Error starting voice assistant:', err);
      setError(err.message);
      if (onError) {
        onError(err);
      }
      return false;
    }
  }, [onError]);

  /**
   * Stop listening for voice commands
   */
  const stopListening = useCallback(async () => {
    try {
      const success = await voiceAssistant.stopListening();
      if (success) {
        setIsListening(false);
        setIsActive(false);
      }
      return success;
    } catch (err) {
      console.error('Error stopping voice assistant:', err);
      if (onError) {
        onError(err);
      }
      return false;
    }
  }, [onError]);

  /**
   * Toggle voice assistant on/off
   */
  const toggle = useCallback(async () => {
    if (isActive) {
      await stopListening();
    } else {
      await startListening();
    }
  }, [isActive, startListening, stopListening]);

  /**
   * Execute a manual voice command (for testing)
   */
  const manualCommand = useCallback(async (command) => {
    try {
      setLastCommand(command);
      await voiceAssistant.executeCommand(command);
      if (onCommand) {
        onCommand(command);
      }
    } catch (err) {
      console.error('Error executing manual command:', err);
      if (onError) {
        onError(err);
      }
    }
  }, [onCommand, onError]);

  /**
   * Change voice assistant language
   */
  const changeLanguage = useCallback(async (languageCode) => {
    try {
      await voiceAssistant.setLanguage(languageCode);
      setLanguage(languageCode);
      
      // Restart listening if currently active
      if (isActive) {
        await voiceAssistant.stopListening();
        await voiceAssistant.startListening();
      }
    } catch (err) {
      console.error('Error changing language:', err);
      if (onError) {
        onError(err);
      }
    }
  }, [isActive, onError]);

  /**
   * Speak text using TTS
   */
  const speak = useCallback(async (text, options = {}) => {
    try {
      await voiceAssistant.speak(text, options);
    } catch (err) {
      console.error('Error speaking:', err);
      if (onError) {
        onError(err);
      }
    }
  }, [onError]);

  /**
   * Start emergency recording
   */
  const startRecording = useCallback(async () => {
    try {
      const path = await voiceAssistant.startEmergencyRecording();
      setIsRecording(true);
      return path;
    } catch (err) {
      console.error('Error starting recording:', err);
      if (onError) {
        onError(err);
      }
      return null;
    }
  }, [onError]);

  /**
   * Stop emergency recording
   */
  const stopRecording = useCallback(async () => {
    try {
      const path = await voiceAssistant.stopEmergencyRecording();
      setIsRecording(false);
      return path;
    } catch (err) {
      console.error('Error stopping recording:', err);
      if (onError) {
        onError(err);
      }
      return null;
    }
  }, [onError]);

  /**
   * Initialize on mount
   */
  useEffect(() => {
    initialize();

    if (autoStart) {
      startListening();
    }

    return () => {
      voiceAssistant.stopListening();
    };
  }, [initialize, autoStart, startListening]);

  /**
   * Handle app state changes (pause/resume)
   */
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App came to foreground - restart listening if it was active
        if (isActive) {
          voiceAssistant.startListening();
        }
      } else if (
        appState.current === 'active' &&
        nextAppState.match(/inactive|background/)
      ) {
        // App going to background - pause listening
        if (isActive) {
          voiceAssistant.stopListening();
        }
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [isActive]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      voiceAssistant.destroy();
    };
  }, []);

  return {
    // State
    isListening,
    isActive,
    isInitialized,
    lastCommand,
    isRecording,
    error,
    language,
    
    // Actions
    toggle,
    startListening,
    stopListening,
    manualCommand,
    changeLanguage,
    speak,
    startRecording,
    stopRecording,
  };
}

export default useVoiceAssistant;
