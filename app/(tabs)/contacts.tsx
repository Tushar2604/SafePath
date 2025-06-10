import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { Plus, Phone, MessageCircle, CreditCard as Edit, Trash2 } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { RequireAuth } from '../components/RequireAuth';
import { useAuth } from '../contexts/AuthContext';
import { useEmergencyContacts } from '../hooks/useEmergencyContacts';
import { router } from 'expo-router';
import * as Linking from 'expo-linking';

interface EmergencyContact {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  relationship: string;
  isPrimary: boolean;
  notificationPreferences: {
    sms: boolean;
    email: boolean;
    call: boolean;
  };
}

export default function ContactsScreen() {
  const { user } = useAuth();
  const { contacts, loading, error, addContact, updateContact, deleteContact, sendTestNotification } = useEmergencyContacts();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleCallContact = (contact: EmergencyContact) => {
    Alert.alert(
      'Call Contact',
      `Would you like to call ${contact.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call',
          onPress: () => Linking.openURL(`tel:${contact.phone.replace(/\D/g, '')}`)
        }
      ]
    );
  };

  const handleMessageContact = (contact: EmergencyContact) => {
    Alert.alert(
      'Send Message',
      `Send emergency message to ${contact.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: () => Linking.openURL(`sms:${contact.phone.replace(/\D/g, '')}`)
        }
      ]
    );
  };

  const handleDeleteContact = async (contactId: string) => {
    Alert.alert(
      'Delete Contact',
      'Are you sure you want to remove this emergency contact?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsDeleting(contactId);
              await deleteContact(contactId);
              Alert.alert('Success', 'Contact deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete contact. Please try again.');
            } finally {
              setIsDeleting(null);
            }
          }
        }
      ]
    );
  };

  const handleTestNotification = async (contact: EmergencyContact) => {
    try {
      await sendTestNotification(contact._id);
      Alert.alert('Success', 'Test notification sent successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to send test notification. Please try again.');
    }
  };

  const handleAddContact = () => {
    router.push('/(tabs)/contacts/add' as any);
  };

  const handleEditContact = (contact: EmergencyContact) => {
    router.push({
      pathname: '/(tabs)/contacts/edit' as any,
      params: { id: contact._id }
    });
  };

  const ContactCard = ({ contact }: { contact: EmergencyContact }) => (
    <View style={styles.contactCard}>
      <View style={styles.contactHeader}>
        <View style={styles.contactInfo}>
          <Text style={styles.contactName}>{contact.name}</Text>
          <Text style={styles.contactRelationship}>{contact.relationship}</Text>
          <Text style={styles.contactPhone}>{contact.phone}</Text>
          {contact.email && (
            <Text style={styles.contactEmail}>{contact.email}</Text>
          )}
        </View>
        {contact.isPrimary && (
          <View style={styles.primaryBadge}>
            <Text style={styles.primaryText}>Primary</Text>
          </View>
        )}
      </View>

      <View style={styles.contactActions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.success[50] }]}
          onPress={() => handleCallContact(contact)}
        >
          <Phone size={16} color={colors.success[600]} />
          <Text style={[styles.actionText, { color: colors.success[700] }]}>Call</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.secondary[50] }]}
          onPress={() => handleMessageContact(contact)}
        >
          <MessageCircle size={16} color={colors.secondary[600]} />
          <Text style={[styles.actionText, { color: colors.secondary[700] }]}>Message</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.gray[50] }]}
          onPress={() => handleEditContact(contact)}
        >
          <Edit size={16} color={colors.gray[600]} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primary[50] }]}
          onPress={() => handleDeleteContact(contact._id)}
          disabled={isDeleting === contact._id}
        >
          {isDeleting === contact._id ? (
            <ActivityIndicator size="small" color={colors.primary[600]} />
          ) : (
            <Trash2 size={16} color={colors.primary[600]} />
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.testButton}
        onPress={() => handleTestNotification(contact)}
      >
        <Text style={styles.testButtonText}>Send Test Notification</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[600]} />
          <Text style={styles.loadingText}>Loading contacts...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => window.location.reload()}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <RequireAuth fallbackMessage="Please sign in to manage your emergency contacts">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Emergency Contacts</Text>
          <Text style={styles.subtitle}>Manage your emergency contact list</Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddContact}
          >
            <Plus size={20} color={colors.white} />
            <Text style={styles.addButtonText}>Add Emergency Contact</Text>
          </TouchableOpacity>

          <View style={styles.contactsList}>
            {contacts.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  No emergency contacts added yet. Add your first contact to get started.
                </Text>
              </View>
            ) : (
              contacts.map((contact) => (
                <ContactCard key={contact._id} contact={contact} />
              ))
            )}
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>How Emergency Contacts Work</Text>
            <View style={styles.infoItem}>
              <View style={styles.infoBullet} />
              <Text style={styles.infoText}>
                Primary contacts are notified first during emergencies
              </Text>
            </View>
            <View style={styles.infoItem}>
              <View style={styles.infoBullet} />
              <Text style={styles.infoText}>
                All contacts receive your location and emergency status
              </Text>
            </View>
            <View style={styles.infoItem}>
              <View style={styles.infoBullet} />
              <Text style={styles.infoText}>
                Messages are sent automatically when SOS is activated
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </RequireAuth>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: colors.gray[900],
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: colors.gray[600],
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[600],
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 24,
  },
  addButtonText: {
    color: colors.white,
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
  contactsList: {
    gap: 16,
  },
  contactCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  contactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: colors.gray[900],
    marginBottom: 4,
  },
  contactRelationship: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: colors.gray[600],
    marginBottom: 4,
  },
  contactPhone: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.gray[500],
  },
  primaryBadge: {
    backgroundColor: colors.success[100],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  primaryText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: colors.success[700],
  },
  contactActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
  },
  actionText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    marginLeft: 4,
  },
  infoSection: {
    marginTop: 32,
    marginBottom: 24,
    backgroundColor: colors.white,
    padding: 20,
    borderRadius: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: colors.gray[900],
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  infoBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary[600],
    marginTop: 6,
    marginRight: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.gray[600],
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: colors.gray[600],
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: colors.warning[700],
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: colors.primary[600],
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  emptyState: {
    backgroundColor: colors.gray[50],
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: colors.gray[600],
    textAlign: 'center',
  },
  contactEmail: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.gray[500],
    marginTop: 2,
  },
  testButton: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: colors.secondary[50],
    borderRadius: 8,
    alignSelf: 'center',
  },
  testButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: colors.secondary[700],
  },
});