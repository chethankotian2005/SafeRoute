import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Modal, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Animated 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME_COLORS } from '../utils/constants';

/**
 * Voice Command Modal
 * Shows available voice commands and provides manual command testing
 */
export function VoiceCommandModal({ visible, onClose, onTestCommand }) {
  const [selectedCommand, setSelectedCommand] = useState(null);
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const commandCategories = [
    {
      title: 'Emergency Commands',
      icon: 'alert-circle',
      color: THEME_COLORS.ALERT_RED,
      commands: [
        {
          phrase: '"Hey SafeRoute, I feel unsafe"',
          action: 'Activates SOS mode, notifies contacts, starts recording',
          testCommand: 'i feel unsafe',
        },
        {
          phrase: '"SafeRoute help me"',
          action: 'Immediate emergency activation',
          testCommand: 'help me',
        },
        {
          phrase: '"SafeRoute, start recording"',
          action: 'Begins secure audio recording',
          testCommand: 'start recording',
        },
      ],
    },
    {
      title: 'Navigation Commands',
      icon: 'navigate',
      color: THEME_COLORS.SAFETY_GREEN,
      commands: [
        {
          phrase: '"Hey SafeRoute, take me home"',
          action: 'Finds safest route to your saved home location',
          testCommand: 'take me home',
        },
        {
          phrase: '"SafeRoute, find safe route home"',
          action: 'Navigate home with safety priority',
          testCommand: 'find safe route home',
        },
        {
          phrase: '"SafeRoute, where am I?"',
          action: 'Shows your current location on map',
          testCommand: 'where am i',
        },
      ],
    },
    {
      title: 'Safety Resources',
      icon: 'shield-checkmark',
      color: THEME_COLORS.ACCENT_BLUE,
      commands: [
        {
          phrase: '"Hey SafeRoute, find nearest police station"',
          action: 'Shows nearby police stations with directions',
          testCommand: 'find nearest police station',
        },
        {
          phrase: '"SafeRoute, where\'s the nearest hospital?"',
          action: 'Displays closest hospitals on map',
          testCommand: 'nearest hospital',
        },
        {
          phrase: '"SafeRoute, find pharmacy"',
          action: 'Locates nearby pharmacies',
          testCommand: 'find pharmacy',
        },
      ],
    },
    {
      title: 'Contact Commands',
      icon: 'call',
      color: THEME_COLORS.WARNING_ORANGE,
      commands: [
        {
          phrase: '"Hey SafeRoute, call emergency contact"',
          action: 'Calls your primary emergency contact',
          testCommand: 'call emergency contact',
        },
      ],
    },
  ];

  const handleTestCommand = (command) => {
    setSelectedCommand(command);
    if (onTestCommand) {
      onTestCommand(command.testCommand);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Animated.View style={[styles.modalContent, { opacity: fadeAnim }]}>
          {/* Header */}
          <LinearGradient
            colors={[THEME_COLORS.SAFETY_GREEN, '#059669']}
            style={styles.header}
          >
            <View style={styles.headerContent}>
              <Ionicons name="mic" size={28} color="#FFFFFF" />
              <Text style={styles.headerTitle}>Voice Commands</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </LinearGradient>

          {/* Content */}
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.intro}>
              <Text style={styles.introTitle}>How to Use Voice Commands</Text>
              <Text style={styles.introText}>
                Activate the voice assistant, then say "Hey SafeRoute" or "SafeRoute help me" followed by your command.
              </Text>
            </View>

            {commandCategories.map((category, categoryIndex) => (
              <View key={categoryIndex} style={styles.category}>
                <View style={styles.categoryHeader}>
                  <View style={[styles.categoryIcon, { backgroundColor: `${category.color}20` }]}>
                    <Ionicons name={category.icon} size={22} color={category.color} />
                  </View>
                  <Text style={styles.categoryTitle}>{category.title}</Text>
                </View>

                {category.commands.map((command, commandIndex) => (
                  <View key={commandIndex} style={styles.commandCard}>
                    <View style={styles.commandContent}>
                      <Text style={styles.commandPhrase}>{command.phrase}</Text>
                      <Text style={styles.commandAction}>{command.action}</Text>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.testButton,
                        selectedCommand?.testCommand === command.testCommand && styles.testButtonActive
                      ]}
                      onPress={() => handleTestCommand(command)}
                    >
                      <Ionicons 
                        name="play-circle" 
                        size={20} 
                        color={selectedCommand?.testCommand === command.testCommand ? "#FFFFFF" : THEME_COLORS.SAFETY_GREEN} 
                      />
                      <Text style={[
                        styles.testButtonText,
                        selectedCommand?.testCommand === command.testCommand && styles.testButtonTextActive
                      ]}>
                        Test
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ))}

            {/* Tips Section */}
            <View style={styles.tipsSection}>
              <Text style={styles.tipsTitle}>💡 Tips for Best Results</Text>
              <View style={styles.tipsList}>
                <Text style={styles.tip}>• Speak clearly and at a normal pace</Text>
                <Text style={styles.tip}>• Use commands in quiet environments when possible</Text>
                <Text style={styles.tip}>• The app works with natural language variations</Text>
                <Text style={styles.tip}>• Voice commands work in multiple languages</Text>
                <Text style={styles.tip}>• Say "SafeRoute stop" to cancel any action</Text>
              </View>
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  intro: {
    backgroundColor: '#F0FDF4',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: THEME_COLORS.SAFETY_GREEN,
  },
  introTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME_COLORS.TEXT_PRIMARY,
    marginBottom: 8,
  },
  introText: {
    fontSize: 14,
    color: THEME_COLORS.TEXT_SECONDARY,
    lineHeight: 20,
  },
  category: {
    marginBottom: 24,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  categoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: THEME_COLORS.TEXT_PRIMARY,
  },
  commandCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  commandContent: {
    flex: 1,
    marginRight: 12,
  },
  commandPhrase: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME_COLORS.TEXT_PRIMARY,
    marginBottom: 4,
  },
  commandAction: {
    fontSize: 12,
    color: THEME_COLORS.TEXT_SECONDARY,
    lineHeight: 18,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: THEME_COLORS.SAFETY_GREEN,
  },
  testButtonActive: {
    backgroundColor: THEME_COLORS.SAFETY_GREEN,
    borderColor: THEME_COLORS.SAFETY_GREEN,
  },
  testButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME_COLORS.SAFETY_GREEN,
  },
  testButtonTextActive: {
    color: '#FFFFFF',
  },
  tipsSection: {
    backgroundColor: '#FFF7ED',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    borderLeftWidth: 4,
    borderLeftColor: THEME_COLORS.WARNING_ORANGE,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME_COLORS.TEXT_PRIMARY,
    marginBottom: 12,
  },
  tipsList: {
    gap: 8,
  },
  tip: {
    fontSize: 13,
    color: THEME_COLORS.TEXT_SECONDARY,
    lineHeight: 20,
  },
});

export default VoiceCommandModal;
