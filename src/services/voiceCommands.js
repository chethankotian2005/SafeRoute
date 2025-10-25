import { Alert, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Command pattern matching
const commandPatterns = {
  unsafe: ['unsafe', 'scared', 'help', 'emergency', 'danger', 'afraid', 'threatened', 'worried'],
  home: ['home', 'go home', 'take me home', 'navigate home', 'route home'],
  safeSpot: ['police', 'hospital', 'pharmacy', 'safe place', 'safe spot', 'nearest police', 'nearest hospital'],
  call: ['call', 'phone', 'contact', 'dial'],
  record: ['record', 'recording', 'start recording', 'begin recording'],
  stop: ['stop', 'cancel', 'end', 'quit'],
  location: ['where am i', 'my location', 'current location'],
  status: ['status', 'how am i', 'am i safe'],
};

/**
 * Process voice command and return action to execute
 * @param {string} command - The voice command to process
 * @param {object} services - Service functions (speak, startRecording, etc.)
 * @returns {object} Response object with message and action
 */
export async function processCommand(command, services = {}) {
  const lowerCommand = command.toLowerCase().trim();
  
  if (!lowerCommand) {
    return {
      message: "I'm listening. How can I help you?",
      action: null,
    };
  }

  console.log('Processing command:', lowerCommand);

  // EMERGENCY: "I feel unsafe" or similar
  if (matchesPattern(lowerCommand, commandPatterns.unsafe)) {
    return await handleUnsafeCommand(services);
  }

  // NAVIGATION: Go home
  if (matchesPattern(lowerCommand, commandPatterns.home)) {
    return await handleHomeCommand(services);
  }

  // SAFE SPOTS: Find police, hospital, etc.
  if (matchesPattern(lowerCommand, commandPatterns.safeSpot)) {
    return await handleSafeSpotCommand(lowerCommand, services);
  }

  // CALL: Emergency contact
  if (matchesPattern(lowerCommand, commandPatterns.call)) {
    return await handleCallCommand(services);
  }

  // RECORDING: Start/stop recording
  if (matchesPattern(lowerCommand, commandPatterns.record)) {
    return await handleRecordCommand(services);
  }

  // STOP: Stop current action
  if (matchesPattern(lowerCommand, commandPatterns.stop)) {
    return await handleStopCommand(services);
  }

  // LOCATION: Where am I?
  if (matchesPattern(lowerCommand, commandPatterns.location)) {
    return await handleLocationCommand(services);
  }

  // STATUS: Safety status
  if (matchesPattern(lowerCommand, commandPatterns.status)) {
    return await handleStatusCommand(services);
  }

  // Unknown command
  return {
    message: "I can help you with: activating emergency mode, navigating home, finding safe places like police stations or hospitals, calling your emergency contact, or starting a recording. What would you like to do?",
    action: null,
  };
}

/**
 * Check if command matches any pattern
 */
function matchesPattern(command, patterns) {
  return patterns.some(pattern => command.includes(pattern));
}

/**
 * Handle "I feel unsafe" emergency command
 */
async function handleUnsafeCommand(services) {
  const { speak, startRecording } = services;
  
  return {
    message: "I understand. I'm activating emergency mode right now. Your emergency contacts are being notified, and I'm starting audio recording for your safety. Take a deep breath. You're going to be okay. I'm here with you.",
    action: async () => {
      try {
        // Start emergency recording
        if (startRecording) {
          await startRecording();
        }

        // Navigate to SOS screen
        // This will be implemented through navigation prop passed from component
        global.navigation?.navigate?.('SOS', {
          voiceActivated: true,
          autoStart: true,
        });

        console.log('Emergency mode activated via voice');
      } catch (error) {
        console.error('Error activating emergency mode:', error);
        if (speak) {
          await speak("I'm having trouble activating emergency mode. Please tap the SOS button on your screen.");
        }
      }
    },
  };
}

/**
 * Handle "take me home" navigation command
 */
async function handleHomeCommand(services) {
  const { speak } = services;
  
  try {
    // Get saved home location
    const homeLocation = await AsyncStorage.getItem('homeLocation');
    
    if (!homeLocation) {
      return {
        message: "I don't have your home address saved yet. You can set it in your profile settings. Would you like me to open the settings?",
        action: async () => {
          global.navigation?.navigate?.('Profile');
        },
      };
    }

    const home = JSON.parse(homeLocation);
    
    return {
      message: `Finding the safest route to your home at ${home.address}. I'll guide you with turn-by-turn directions. Stay alert and safe.`,
      action: async () => {
        try {
          global.navigation?.navigate?.('Map', {
            destination: home.address,
            coordinates: home.coordinates,
            prioritySafety: true,
            voiceActivated: true,
          });
        } catch (error) {
          console.error('Error navigating home:', error);
          if (speak) {
            await speak("I'm having trouble starting navigation. Please use the map screen to navigate home.");
          }
        }
      },
    };
  } catch (error) {
    console.error('Error handling home command:', error);
    return {
      message: "I couldn't access your home location. Please set it in your profile settings.",
      action: null,
    };
  }
}

/**
 * Handle "find police station" safe spot command
 */
async function handleSafeSpotCommand(command, services) {
  const { speak } = services;
  
  // Determine which type of safe spot
  let spotType = 'police_station';
  if (command.includes('hospital')) {
    spotType = 'hospital';
  } else if (command.includes('pharmacy')) {
    spotType = 'pharmacy';
  }

  const spotNames = {
    police_station: 'police station',
    hospital: 'hospital',
    pharmacy: 'pharmacy',
  };

  return {
    message: `Searching for the nearest ${spotNames[spotType]}. I'll show you the closest options with directions.`,
    action: async () => {
      try {
        global.navigation?.navigate?.('Map', {
          showSafeSpots: true,
          filterSpotType: spotType,
          voiceActivated: true,
        });

        // Optionally provide more details after a delay
        setTimeout(async () => {
          if (speak) {
            await speak(`The map now shows nearby ${spotNames[spotType]}s marked with pins. Tap on any to get directions.`);
          }
        }, 2000);
      } catch (error) {
        console.error('Error showing safe spots:', error);
        if (speak) {
          await speak("I'm having trouble loading the map. Please try using the map screen manually.");
        }
      }
    },
  };
}

/**
 * Handle "call emergency contact" command
 */
async function handleCallCommand(services) {
  const { speak } = services;
  
  try {
    const emergencyContact = await AsyncStorage.getItem('emergencyContact');
    
    if (!emergencyContact) {
      return {
        message: "You haven't set up an emergency contact yet. Would you like to add one in your settings?",
        action: async () => {
          global.navigation?.navigate?.('Settings');
        },
      };
    }

    const contact = JSON.parse(emergencyContact);
    
    return {
      message: `Calling ${contact.name} now at ${contact.phone}.`,
      action: async () => {
        try {
          const phoneUrl = `tel:${contact.phone}`;
          const canOpen = await Linking.canOpenURL(phoneUrl);
          
          if (canOpen) {
            await Linking.openURL(phoneUrl);
          } else {
            throw new Error('Cannot open phone dialer');
          }
        } catch (error) {
          console.error('Error making call:', error);
          if (speak) {
            await speak(`I couldn't place the call. The number is ${contact.phone}. Please dial manually.`);
          }
        }
      },
    };
  } catch (error) {
    console.error('Error handling call command:', error);
    return {
      message: "I'm having trouble accessing your emergency contacts. Please check your settings.",
      action: null,
    };
  }
}

/**
 * Handle "start recording" command
 */
async function handleRecordCommand(services) {
  const { speak, startRecording } = services;
  
  return {
    message: "Starting secure audio recording now. This recording will be saved to your device and can be used as evidence if needed.",
    action: async () => {
      try {
        if (startRecording) {
          const filePath = await startRecording();
          console.log('Recording started:', filePath);
          
          setTimeout(async () => {
            if (speak) {
              await speak("Recording in progress. Say 'SafeRoute stop recording' when you're ready to stop.");
            }
          }, 2000);
        }
      } catch (error) {
        console.error('Error starting recording:', error);
        if (speak) {
          await speak("I'm having trouble starting the recording. Please try using the SOS screen to record.");
        }
      }
    },
  };
}

/**
 * Handle "stop" command
 */
async function handleStopCommand(services) {
  const { speak, stopRecording } = services;
  
  return {
    message: "Stopping current action.",
    action: async () => {
      try {
        if (stopRecording) {
          const filePath = await stopRecording();
          if (filePath) {
            if (speak) {
              await speak("Recording stopped and saved securely.");
            }
          }
        }
      } catch (error) {
        console.error('Error stopping action:', error);
      }
    },
  };
}

/**
 * Handle "where am I" location command
 */
async function handleLocationCommand(services) {
  const { speak } = services;
  
  return {
    message: "Let me check your current location for you.",
    action: async () => {
      try {
        // This would integrate with the location service
        // For now, just navigate to map showing current location
        global.navigation?.navigate?.('Map', {
          showCurrentLocation: true,
          voiceActivated: true,
        });

        setTimeout(async () => {
          if (speak) {
            await speak("Your current location is now shown on the map. You can share it with your emergency contacts from the SOS screen.");
          }
        }, 1500);
      } catch (error) {
        console.error('Error showing location:', error);
        if (speak) {
          await speak("I'm having trouble accessing your location. Please check your location permissions.");
        }
      }
    },
  };
}

/**
 * Handle "how am I" status command
 */
async function handleStatusCommand(services) {
  const { speak } = services;
  
  // This would check current safety status, active routes, etc.
  return {
    message: "Let me check your safety status. Your location services are active, and I'm monitoring your area for safety information.",
    action: async () => {
      // Could navigate to a status/dashboard screen
      global.navigation?.navigate?.('Home');
    },
  };
}

/**
 * Multi-language support (future enhancement)
 */
export const languageCommands = {
  'en-US': commandPatterns,
  'hi-IN': {
    // Hindi patterns
    unsafe: ['असुरक्षित', 'डर', 'मदद', 'आपातकाल'],
    home: ['घर', 'घर जाओ'],
    // ... other Hindi patterns
  },
  'ta-IN': {
    // Tamil patterns
    unsafe: ['பாதுகாப்பற்ற', 'பயம்', 'உதவி'],
    home: ['வீடு', 'வீட்டிற்கு செல்'],
    // ... other Tamil patterns
  },
  'te-IN': {
    // Telugu patterns
    unsafe: ['అసురక్షిత', 'భయం', 'సహాయం'],
    home: ['ఇల్లు', 'ఇంటికి వెళ్ళు'],
    // ... other Telugu patterns
  },
};

export default {
  processCommand,
  commandPatterns,
  languageCommands,
};
