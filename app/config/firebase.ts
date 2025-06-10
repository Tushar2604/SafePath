import { Platform } from 'react-native';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, initializeFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getMessaging, Messaging } from 'firebase/messaging';
import Constants from 'expo-constants';
import { firebaseConfig } from './firebase.config';

// Initialize Firebase
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;
let messaging: Messaging | undefined;

if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);

    // Initialize Firestore with settings
    db = initializeFirestore(app, {
        experimentalForceLongPolling: true, // Required for React Native
    });

    // Initialize other services
    auth = getAuth(app);
    storage = getStorage(app);

    // Initialize messaging only on native platforms
    if (Platform.OS !== 'web') {
        messaging = getMessaging(app);
    }
} else {
    app = getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    if (Platform.OS !== 'web') {
        messaging = getMessaging(app);
    }
}

export { app, auth, db, storage, messaging };
export default app; 