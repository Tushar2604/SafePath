import { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

interface EmergencyContact {
    email: string;
    name: string;
    phone?: string;
}

export interface UserProfile extends User {
    emergencyContacts: EmergencyContact[];
}

export function useAuth() {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const auth = getAuth();
        const db = getFirestore();

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            try {
                if (firebaseUser) {
                    // Get user profile from Firestore
                    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
                    const userData = userDoc.data();

                    // Combine Firebase user with Firestore data
                    setUser({
                        ...firebaseUser,
                        emergencyContacts: userData?.emergencyContacts || []
                    } as UserProfile);
                } else {
                    setUser(null);
                }
            } catch (err) {
                console.error('Error fetching user profile:', err);
                setError('Failed to load user profile');
            } finally {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    return { user, loading, error };
} 