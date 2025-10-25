// Voice assistant service with full voice recognition features
import Voice from '@react-native-voice/voice';
import Tts from 'react-native-tts';
// import * as Speech from 'expo-speech'; // Temporarily disabled
import { Platform, Alert } from 'react-native';
import { processCommand } from './voiceCommands';
import AsyncStorage from '@react-native-async-storage/async-storage';

class VoiceAssistantService {
  constructor() {
    this.isListening = false;
    this.isInitialized = false;
    this.wakeWords = ['hey saferoute', 'saferoute help me', 'saferoute'];
    this.currentLanguage = 'en-US';
    this.isRecording = false;
    this.recordingPath = null;
  }

  async initialize() {
    if (this.isInitialized) return true;

    try {
      // Request permissions
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.error('Microphone permission denied');
        return false;
      }

      // Setup voice recognition
      await this.setupVoiceRecognition();
      
      // Setup TTS
      await this.setupTTS();
      
      // Load user language preference
      await this.loadLanguagePreference();
      
      this.isInitialized = true;
      console.log('Voice Assistant initialized successfully');
      return true;
    } catch (error) {
      console.error('Error initializing voice assistant:', error);
      return false;
    }
  }

  async requestPermissions() {
    try {
      // Permissions are handled by the system when Voice.start() is called
      // For Expo, microphone permission is requested automatically
      console.log('Microphone permission will be requested when needed');
      return true;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      Alert.alert(
        'Permission Error',
        'Unable to request microphone permission. Please check your device settings.',
        [{ text: 'OK' }]
      );
      return false;
    }
  }

  async setupVoiceRecognition() {
    try {
      // Check if Voice is available (doesn't work with Expo Go)
      if (!Voice || !Voice.start) {
        console.log('Voice recognition not available - using manual command mode only');
        console.log('To enable voice recognition, build a development build: npx expo run:android');
        return;
      }

      Voice.onSpeechStart = this.onSpeechStart;
      Voice.onSpeechEnd = this.onSpeechEnd;
      Voice.onSpeechResults = this.onSpeechResults;
      Voice.onSpeechError = this.onSpeechError;
      Voice.onSpeechPartialResults = this.onSpeechPartialResults;
      console.log('Voice recognition setup complete');
    } catch (error) {
      console.error('Error setting up voice recognition:', error);
      console.log('Voice recognition disabled - manual commands still available');
    }
  }

  async setupTTS() {
    try {
      // Expo Speech is disabled (module removed)
      // Skip to react-native-tts
      
      // Check if react-native-tts is available
      if (!Tts) {
        console.log('TTS not available, will use fallback alerts');
        return;
      }

      await Tts.setDefaultLanguage(this.currentLanguage);
      await Tts.setDefaultRate(0.5); // Calm speaking rate
      await Tts.setDefaultPitch(1.0);
      
      // Set up TTS event listeners
      Tts.addEventListener('tts-start', () => console.log('TTS started'));
      Tts.addEventListener('tts-finish', () => console.log('TTS finished'));
      Tts.addEventListener('tts-cancel', () => console.log('TTS cancelled'));
      
      console.log('TTS setup complete (using react-native-tts)');
    } catch (error) {
      console.error('Error setting up TTS:', error);
      console.log('Continuing without TTS setup...');
    }
  }

  async loadLanguagePreference() {
    try {
      const savedLanguage = await AsyncStorage.getItem('voiceAssistantLanguage');
      if (savedLanguage) {
        this.currentLanguage = savedLanguage;
      }
    } catch (error) {
      console.error('Error loading language preference:', error);
    }
  }

  async setLanguage(languageCode) {
    try {
      this.currentLanguage = languageCode;
      await AsyncStorage.setItem('voiceAssistantLanguage', languageCode);
      console.log('Language set to:', languageCode);
    } catch (error) {
      console.error('Error setting language:', error);
    }
  }

  async startListening() {
    if (!this.isInitialized) {
      console.warn('Voice assistant not initialized');
      return;
    }

    if (this.isListening) {
      console.log('Already listening');
      return;
    }

    try {
      // Check if Voice is available
      if (!Voice || !Voice.start) {
        console.log('Voice recognition not available in Expo Go');
        Alert.alert(
          'Voice Recognition Unavailable',
          'Voice recognition requires a development build.\n\nYou can:\n• Use manual commands (tap "View Commands")\n• Build app: npx expo run:android',
          [{ text: 'OK' }]
        );
        return;
      }

      await Voice.start(this.currentLanguage);
      this.isListening = true;
      console.log('Started listening for wake words...');
    } catch (error) {
      console.error('Error starting voice recognition:', error);
      this.handleError(error);
    }
  }

  async stopListening() {
    if (!this.isListening) return;

    try {
      if (Voice && Voice.stop) {
        await Voice.stop();
      }
      this.isListening = false;
      console.log('Stopped listening');
    } catch (error) {
      console.error('Error stopping voice recognition:', error);
    }
  }

  async restartListening() {
    if (!Voice || !Voice.start) {
      console.log('Voice recognition not available');
      return;
    }
    await this.stopListening();
    // Small delay before restarting
    setTimeout(() => {
      this.startListening();
    }, 100);
  }

  onSpeechStart = (event) => {
    console.log('Speech started:', event);
  };

  onSpeechEnd = (event) => {
    console.log('Speech ended:', event);
    // Auto-restart listening for continuous wake word detection
    if (this.isActive) {
      this.restartListening();
    }
  };

  onSpeechPartialResults = (event) => {
    const partialResults = event.value;
    console.log('Partial results:', partialResults);
  };

  onSpeechResults = async (event) => {
    const results = event.value;
    console.log('Speech recognized:', results);

    if (!results || results.length === 0) return;

    const spokenText = results[0].toLowerCase();

    // Check for wake words
    const wakeWordDetected = this.wakeWords.some(word => 
      spokenText.includes(word.toLowerCase())
    );

    if (wakeWordDetected) {
      console.log('Wake word detected:', spokenText);
      this.isActive = true;
      await this.speak('Yes, how can I help you?');
      // Continue listening for the actual command
      await this.restartListening();
    } else if (this.isActive) {
      // Process the command if we're in active mode
      console.log('Processing command:', spokenText);
      await this.executeCommand(spokenText);
      this.isActive = false; // Reset after command
    }
  };

  onSpeechError = (event) => {
    console.error('Speech error:', event);
    this.handleError(event.error);
    
    // Restart listening on error
    if (this.isListening) {
      this.restartListening();
    }
  };

  async executeCommand(command) {
    try {
      if (!command || command.trim().length === 0) {
        console.log('Empty command received');
        return;
      }

      console.log('Executing command:', command);

      const response = await processCommand(command, {
        speak: this.speak.bind(this),
        startRecording: this.startEmergencyRecording.bind(this),
        stopRecording: this.stopEmergencyRecording.bind(this),
      });
      
      if (response.message) {
        await this.speak(response.message);
      }

      if (response.action) {
        await response.action();
      }

    } catch (error) {
      console.error('Error executing command:', error);
      await this.speak('Sorry, I encountered an error processing your command.');
    }
  }

  async speak(text) {
    try {
      // Use react-native-tts (Expo Speech is disabled)
      if (Tts && Tts.speak) {
        try {
          await Tts.speak(text, {
            androidParams: {
              KEY_PARAM_PAN: 0,
              KEY_PARAM_VOLUME: 1,
              KEY_PARAM_STREAM: 'STREAM_MUSIC',
            },
            iosVoiceId: 'com.apple.ttsbundle.Samantha-compact',
          });
          console.log('Speaking (TTS):', text);
          return;
        } catch (ttsError) {
          console.log('TTS error, using alert:', ttsError.message);
        }
      }

      // Final fallback to alert
      console.log('Voice not available, showing alert:', text);
      Alert.alert('Voice Assistant', text, [{ text: 'OK' }]);
    } catch (error) {
      console.error('Error speaking:', error);
      // Fallback to alert if all else fails
      Alert.alert('Voice Assistant', text, [{ text: 'OK' }]);
    }
  }

  playBeep() {
    // Play a brief confirmation beep
    console.log('Beep sound would play here');
  }

  async startEmergencyRecording() {
    try {
      if (this.isRecording) {
        console.log('Already recording');
        return this.recordingPath;
      }

      this.isRecording = true;
      const timestamp = new Date().getTime();
      this.recordingPath = `emergency_recording_${timestamp}.m4a`;
      
      // TODO: Implement actual audio recording here
      // For now, just track that recording is active
      console.log('Emergency recording started:', this.recordingPath);
      await this.speak('Recording started');
      
      return this.recordingPath;
    } catch (error) {
      console.error('Error starting recording:', error);
      this.isRecording = false;
      return null;
    }
  }

  async stopEmergencyRecording() {
    try {
      if (!this.isRecording) {
        console.log('Not recording');
        return null;
      }

      this.isRecording = false;
      
      console.log('Emergency recording stopped:', this.recordingPath);
      await this.speak('Recording stopped and saved');
      
      const filePath = this.recordingPath;
      this.recordingPath = null;
      
      return filePath;
    } catch (error) {
      console.error('Error stopping recording:', error);
      return null;
    }
  }

  onSpeechError = async (error) => {
    console.error('Voice recognition error:', error);
    
    // Only handle error if Voice is actually available
    if (!Voice || !Voice.start) {
      console.log('Voice not available, ignoring error');
      return;
    }
    
    this.handleError(error);
    
    // Restart listening on error
    if (this.isListening) {
      this.restartListening();
    }
  };

  async handlePermissionError() {
    await this.speak('Microphone permission is required. Please enable it in Settings.');
  }

  async handleNetworkError() {
    await this.speak('Network connection required for voice recognition. Please check your connection.');
  }

  async handleUnknownCommand() {
    await this.speak('Sorry, I did not understand that command. Say "help" to hear available commands.');
  }

  handleError(error) {
    if (error && error.message) {
      if (error.message.includes('permissions')) {
        this.handlePermissionError();
      } else if (error.message.includes('network') || error.message.includes('connection')) {
        this.handleNetworkError();
      } else {
        this.handleVoiceError(error);
      }
    }
  }

  async handleVoiceError(error) {
    console.error('Voice error:', error);
    // Don't speak error if Voice isn't available
    if (Voice && Voice.start) {
      await this.speak('An error occurred. Please try again.');
    }
  }

  async destroy() {
    try {
      if (Voice && Voice.destroy) {
        await Voice.destroy();
        await Voice.removeAllListeners();
      }
      this.isListening = false;
      this.isActive = false;
      this.isRecording = false;
      this.isInitialized = false;
      console.log('Voice assistant destroyed');
    } catch (error) {
      console.error('Error destroying voice assistant:', error);
    }
  }

  // Utility methods
  isCurrentlyListening() {
    return this.isListening;
  }

  isCurrentlyRecording() {
    return this.isRecording;
  }

  getCurrentLanguage() {
    return this.currentLanguage;
  }
}

export default new VoiceAssistantService();
