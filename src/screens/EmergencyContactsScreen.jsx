import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
  FlatList,
  Dimensions,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { auth } from '../config/firebaseConfig';
import { getEmergencyContacts, addEmergencyContact, deleteEmergencyContact } from '../services/firebaseService';
import { useTheme } from '../context/ThemeContext';
import { THEME_COLORS } from '../utils/constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const EmergencyContactsScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const user = auth.currentUser;

  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      setLoading(true);
      const emergencyContacts = await getEmergencyContacts(user.uid);
      setContacts(emergencyContacts || []);
    } catch (error) {
      console.error('Error loading contacts:', error);
      Alert.alert('Error', 'Failed to load emergency contacts');
    } finally {
      setLoading(false);
    }
  };

  const handleAddContact = async () => {
    if (!contactName.trim()) {
      Alert.alert('Validation', 'Please enter contact name');
      return;
    }

    if (!contactPhone.trim()) {
      Alert.alert('Validation', 'Please enter contact phone number');
      return;
    }

    try {
      setSaving(true);
      await addEmergencyContact(user.uid, {
        name: contactName.trim(),
        number: contactPhone.trim(),
      });

      // Reload contacts
      await loadContacts();

      // Clear form
      setContactName('');
      setContactPhone('');
      setModalVisible(false);

      Alert.alert('Success', 'Emergency contact added!');
    } catch (error) {
      console.error('Error adding contact:', error);
      Alert.alert('Error', 'Failed to add emergency contact');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteContact = (contactId) => {
    Alert.alert(
      'Delete Contact',
      'Are you sure you want to remove this contact?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteEmergencyContact(user.uid, contactId);
              await loadContacts();
              Alert.alert('Deleted', 'Emergency contact removed');
            } catch (error) {
              console.error('Error deleting contact:', error);
              Alert.alert('Error', 'Failed to delete contact');
            }
          },
        },
      ]
    );
  };

  const handleCallContact = (number, name) => {
    Alert.alert(
      'Call Contact',
      `Call ${name} (${number})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call',
          style: 'default',
          onPress: () => {
            const url = `tel:${number}`;
            require('react-native').Linking.openURL(url);
          },
        },
      ]
    );
  };

  const handleSendAlert = async (contactName, contactPhone) => {
    try {
      const alertMessage = `🚨 EMERGENCY ALERT! I need help immediately!\n\nFrom: SafeRoute App\n\nPlease respond or call emergency services!`;
      
      // Send via SMS directly - no confirmation
      const smsUrl = `sms:${contactPhone}?body=${encodeURIComponent(alertMessage)}`;
      
      // Send via WhatsApp as fallback
      const whatsappUrl = `https://wa.me/${contactPhone}?text=${encodeURIComponent(alertMessage)}`;
      
      // Try SMS first
      try {
        await Linking.openURL(smsUrl);
      } catch (smsError) {
        // If SMS fails, try WhatsApp
        try {
          await Linking.openURL(whatsappUrl);
        } catch (waError) {
          console.error('Both SMS and WhatsApp failed');
        }
      }
    } catch (error) {
      console.error('Error sending alert:', error);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={THEME_COLORS.PRIMARY} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <LinearGradient
        colors={[THEME_COLORS.BRAND_BLACK, '#2D2D2D']}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Emergency Contacts</Text>
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          style={styles.addButton}
        >
          <Ionicons name="add-circle" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Contacts List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {contacts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="alert-circle-outline" size={64} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.text }]}>
              No emergency contacts yet
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              Add contacts who will be notified in case of emergency
            </Text>
          </View>
        ) : (
          <View style={styles.contactsList}>
            {contacts.map((contact) => (
              <View
                key={contact.id}
                style={[styles.contactCard, { backgroundColor: colors.surface }]}
              >
                <View style={styles.contactCardContent}>
                  <View style={[styles.contactIcon, { backgroundColor: `${THEME_COLORS.ALERT_RED}20` }]}>
                    <Ionicons name="person-circle" size={32} color={THEME_COLORS.ALERT_RED} />
                  </View>
                  <View style={styles.contactInfo}>
                    <Text style={[styles.contactName, { color: colors.text }]}>
                      {contact.name}
                    </Text>
                    <Text style={[styles.contactPhone, { color: colors.textSecondary }]}>
                      {contact.number}
                    </Text>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: `${THEME_COLORS.SAFETY_GREEN}20` }]}
                    onPress={() => handleCallContact(contact.number, contact.name)}
                  >
                    <Ionicons name="call" size={18} color={THEME_COLORS.SAFETY_GREEN} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: `${THEME_COLORS.ALERT_RED}20` }]}
                    onPress={() => handleSendAlert(contact.name, contact.number)}
                  >
                    <Ionicons name="warning" size={18} color={THEME_COLORS.ALERT_RED} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: `${colors.textSecondary}20` }]}
                    onPress={() => handleDeleteContact(contact.id)}
                  >
                    <Ionicons name="trash" size={18} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Add Contact Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={28} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Add Emergency Contact</Text>
              <View style={{ width: 28 }} />
            </View>

            {/* Form */}
            <ScrollView style={styles.modalForm}>
              {/* Name Input */}
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Contact Name *</Text>
                <View style={[styles.inputContainer, { borderColor: colors.border }]}>
                  <Ionicons name="person-outline" size={20} color={colors.textSecondary} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="e.g., Mom, Brother, Friend"
                    placeholderTextColor={colors.textSecondary}
                    value={contactName}
                    onChangeText={setContactName}
                  />
                </View>
              </View>

              {/* Phone Input */}
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Phone Number *</Text>
                <View style={[styles.inputContainer, { borderColor: colors.border }]}>
                  <Ionicons name="call-outline" size={20} color={colors.textSecondary} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="e.g., +1-555-123-4567"
                    placeholderTextColor={colors.textSecondary}
                    value={contactPhone}
                    onChangeText={setContactPhone}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              {/* Info Card */}
              <View style={[styles.infoCard, { backgroundColor: `${THEME_COLORS.ACCENT_BLUE}20`, borderColor: THEME_COLORS.ACCENT_BLUE }]}>
                <Ionicons name="information-circle" size={20} color={THEME_COLORS.ACCENT_BLUE} />
                <Text style={[styles.infoText, { color: colors.text }]}>
                  These contacts will receive emergency alerts when you activate SOS and can be called directly from the app.
                </Text>
              </View>
            </ScrollView>

            {/* Modal Buttons */}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.cancelButton, { backgroundColor: colors.surface }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.addContactButton,
                  { backgroundColor: saving ? THEME_COLORS.DISABLED : THEME_COLORS.PRIMARY },
                ]}
                onPress={handleAddContact}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Ionicons name="add" size={20} color="#FFFFFF" />
                    <Text style={styles.addContactButtonText}>Add Contact</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  contactsList: {
    gap: 12,
    paddingBottom: 20,
  },
  contactCard: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  contactCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  contactPhone: {
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalForm: {
    padding: 16,
    maxHeight: '60%',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  infoCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: THEME_COLORS.PRIMARY,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME_COLORS.PRIMARY,
  },
  addContactButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  addContactButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default EmergencyContactsScreen;
