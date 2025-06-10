import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, doc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';

export type Relationship = 'Spouse' | 'Parent' | 'Child' | 'Sibling' | 'Friend' | 'Doctor' | 'Other';

export interface EmergencyContact {
    _id: string;
    name: string;
    phone: string;
    email?: string;
    relationship: Relationship;
    isPrimary: boolean;
    notificationPreferences: {
        sms: boolean;
        email: boolean;
        call: boolean;
    };
    createdAt?: Date;
    updatedAt?: Date;
}

export function useEmergencyContacts() {
    const { user } = useAuth();
    const [contacts, setContacts] = useState<EmergencyContact[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user) {
            setContacts([]);
            setLoading(false);
            return;
        }

        const contactsRef = collection(db, 'emergencyContacts');
        const q = query(
            contactsRef,
            where('userId', '==', user.uid),
            where('isActive', '==', true)
        );

        const unsubscribe = onSnapshot(q,
            (snapshot) => {
                const contactsList = snapshot.docs.map(doc => ({
                    _id: doc.id,
                    ...doc.data()
                })) as EmergencyContact[];
                setContacts(contactsList);
                setLoading(false);
            },
            (err) => {
                console.error('Error fetching contacts:', err);
                setError('Failed to load contacts. Please try again.');
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [user]);

    const addContact = async (contactData: Omit<EmergencyContact, '_id'>) => {
        if (!user) throw new Error('User must be authenticated');

        try {
            const docRef = await addDoc(collection(db, 'emergencyContacts'), {
                ...contactData,
                userId: user.uid,
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            return docRef.id;
        } catch (err) {
            console.error('Error adding contact:', err);
            throw new Error('Failed to add contact');
        }
    };

    const updateContact = async (contactId: string, updates: Partial<EmergencyContact>) => {
        if (!user) throw new Error('User must be authenticated');

        try {
            const contactRef = doc(db, 'emergencyContacts', contactId);
            const contactDoc = await getDoc(contactRef);

            if (!contactDoc.exists()) {
                throw new Error('Contact not found');
            }

            if (contactDoc.data().userId !== user.uid) {
                throw new Error('Unauthorized to update this contact');
            }

            await updateDoc(contactRef, {
                ...updates,
                updatedAt: new Date()
            });
        } catch (err) {
            console.error('Error updating contact:', err);
            throw new Error('Failed to update contact');
        }
    };

    const deleteContact = async (contactId: string) => {
        if (!user) throw new Error('User must be authenticated');

        try {
            const contactRef = doc(db, 'emergencyContacts', contactId);
            const contactDoc = await getDoc(contactRef);

            if (!contactDoc.exists()) {
                throw new Error('Contact not found');
            }

            if (contactDoc.data().userId !== user.uid) {
                throw new Error('Unauthorized to delete this contact');
            }

            // Soft delete
            await updateDoc(contactRef, {
                isActive: false,
                updatedAt: new Date()
            });
        } catch (err) {
            console.error('Error deleting contact:', err);
            throw new Error('Failed to delete contact');
        }
    };

    const sendTestNotification = async (contactId: string) => {
        if (!user) throw new Error('User must be authenticated');

        try {
            const contactRef = doc(db, 'emergencyContacts', contactId);
            const contactDoc = await getDoc(contactRef);

            if (!contactDoc.exists()) {
                throw new Error('Contact not found');
            }

            if (contactDoc.data().userId !== user.uid) {
                throw new Error('Unauthorized to send notification to this contact');
            }

            // TODO: Implement actual notification sending
            // For now, just simulate a successful notification
            await new Promise(resolve => setTimeout(resolve, 1000));

            return true;
        } catch (err) {
            console.error('Error sending test notification:', err);
            throw new Error('Failed to send test notification');
        }
    };

    return {
        contacts,
        loading,
        error,
        addContact,
        updateContact,
        deleteContact,
        sendTestNotification
    };
} 