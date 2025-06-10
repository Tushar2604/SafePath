import Constants from 'expo-constants';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getMessaging, getToken } from 'firebase/messaging';

// Get Firebase config from Expo's configuration
const getFirebaseConfig = () => {
    const extra = Constants.expoConfig?.extra;

    if (!extra) {
        console.error('Expo config extra is undefined. Using fallback values for development.');
        // Fallback values for development
        return {
            apiKey: "AIzaSyBdzxZKOjkg6aQ8rZ_-ZqzISgI4Z1KEKlw",
            authDomain: "safepath-e928d.firebaseapp.com",
            projectId: "safepath-e928d",
            storageBucket: "safepath-e928d.appspot.com",
            messagingSenderId: "362662479011",
            appId: "1:362662479011:web:aaa0da9173fb15c4eeeb16",
            measurementId: "G-E8RLP9LPFT"
        };
    }

    // Use fallback values for development
    const config = {
        apiKey: extra.firebaseApiKey ?? "AIzaSyBdzxZKOjkg6aQ8rZ_-ZqzISgI4Z1KEKlw",
        authDomain: extra.firebaseAuthDomain ?? "safepath-e928d.firebaseapp.com",
        projectId: extra.firebaseProjectId ?? "safepath-e928d",
        storageBucket: extra.firebaseStorageBucket ?? "safepath-e928d.appspot.com",
        messagingSenderId: extra.firebaseMessagingSenderId ?? "362662479011",
        appId: extra.firebaseAppId ?? "1:362662479011:web:aaa0da9173fb15c4eeeb16",
        measurementId: extra.firebaseMeasurementId ?? "G-E8RLP9LPFT"
    };

    return config;
};

export const firebaseConfig = getFirebaseConfig(); 