import React, { createContext, useContext, useState, useEffect } from 'react';
import {
    User,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail,
    updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string, name: string) => Promise<void>;
    logout: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    updateUserProfile: (data: { displayName?: string; photoURL?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // Get additional user data from Firestore
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                if (userDoc.exists()) {
                    // Update user profile with additional data
                    const userData = userDoc.data();
                    await updateProfile(user, {
                        displayName: userData.name || user.displayName,
                        photoURL: userData.profileImage || user.photoURL
                    });
                }
            }
            setUser(user);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const signIn = async (email: string, password: string) => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            console.error('Sign in error:', error);
            throw error;
        }
    };

    const signUp = async (email: string, password: string, name: string) => {
        try {
            const { user } = await createUserWithEmailAndPassword(auth, email, password);

            // Create user document in Firestore
            await setDoc(doc(db, 'users', user.uid), {
                name,
                email,
                createdAt: new Date().toISOString(),
                settings: {
                    notificationsEnabled: true,
                    locationEnabled: true,
                    emergencyModeEnabled: false
                }
            });

            // Update profile
            await updateProfile(user, { displayName: name });
        } catch (error) {
            console.error('Sign up error:', error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error('Logout error:', error);
            throw error;
        }
    };

    const resetPassword = async (email: string) => {
        try {
            await sendPasswordResetEmail(auth, email);
        } catch (error) {
            console.error('Password reset error:', error);
            throw error;
        }
    };

    const updateUserProfile = async (data: { displayName?: string; photoURL?: string }) => {
        if (!user) throw new Error('No user logged in');
        try {
            await updateProfile(user, data);
            // Update Firestore document
            await setDoc(doc(db, 'users', user.uid), {
                name: data.displayName,
                profileImage: data.photoURL
            }, { merge: true });
        } catch (error) {
            console.error('Profile update error:', error);
            throw error;
        }
    };

    const value = {
        user,
        loading,
        signIn,
        signUp,
        logout,
        resetPassword,
        updateUserProfile
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
} 