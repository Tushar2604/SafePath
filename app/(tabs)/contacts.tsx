import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { Plus, Phone, MessageCircle, CreditCard as Edit, Trash2 } from 'lucide-react-native';
import { colors } from '@/constants/colors';

interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  isPrimary: boolean;
}

export default function ContactsScreen() {
  const [contacts, setContacts] = useState<EmergencyContact[]>([
    {
      id: '1',
      name: 'John Smith',
      phone: '+1 (555) 123-4567',
      relationship: 'Spouse',
      isPrimary: true,
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      phone: '+1 (555) 987-6543',
      relationship: 'Sister',
      isPrimary: false,
    },
    {
      id: '3',
      name: 'Dr. Michael Brown',
      phone: '+1 (555) 456-7890',
      relationship: 'Doctor',
      isPrimary: false,
    },
  ]);

  const handleCallContact = (contact: EmergencyContact) => {
    Alert.alert(
      'Call Contact',
      `Would you like to call ${contact.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call', onPress: () => console.log(`Calling ${contact.phone}`) }
      ]
    );
  };

  const handleMessageContact = (contact: EmergencyContact) => {
    Alert.alert(
      'Send Message',
      `Send emergency message to ${contact.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Send', onPress: () => console.log(`Messaging ${contact.phone}`) }
      ]
    );
  };

  const handleDeleteContact = (contactId: string) => {
    Alert.alert(
      'Delete Contact',
      'Are you sure you want to remove this emergency contact?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => setContacts(prev => prev.filter(c => c.id !== contactId))
        }
      ]
    );
  };

  const ContactCard = ({ contact }: { contact: EmergencyContact }) => (
    <View style={styles.contactCard}>
      <View style={styles.contactHeader}>
        <View style={styles.contactInfo}>
          <Text style={styles.contactName}>{contact.name}</Text>
          <Text style={styles.contactRelationship}>{contact.relationship}</Text>
          <Text style={styles.contactPhone}>{contact.phone}</Text>
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
          onPress={() => console.log('Edit contact')}
        >
          <Edit size={16} color={colors.gray[600]} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: colors.primary[50] }]}
          onPress={() => handleDeleteContact(contact.id)}
        >
          <Trash2 size={16} color={colors.primary[600]} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Emergency Contacts</Text>
        <Text style={styles.subtitle}>Manage your emergency contact list</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.addButton}>
          <Plus size={20} color={colors.white} />
          <Text style={styles.addButtonText}>Add Emergency Contact</Text>
        </TouchableOpacity>

        <View style={styles.contactsList}>
          {contacts.map((contact) => (
            <ContactCard key={contact.id} contact={contact} />
          ))}
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
});