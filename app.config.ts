import { ExpoConfig, ConfigContext } from 'expo/config';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

export default ({ config }: ConfigContext): ExpoConfig => ({
    ...config,
    name: 'SafePath',
    slug: 'safepath-emergency-app',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    userInterfaceStyle: 'automatic',
    splash: {
        image: './assets/images/splash.png',
        resizeMode: 'contain',
        backgroundColor: '#ffffff'
    },
    assetBundlePatterns: ['**/*'],
    ios: {
        supportsTablet: true,
        bundleIdentifier: 'com.safepath.emergency',
        googleServicesFile: './GoogleService-Info.plist',
        config: {
            googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY
        }
    },
    android: {
        adaptiveIcon: {
            foregroundImage: './assets/images/adaptive-icon.png',
            backgroundColor: '#ffffff'
        },
        package: 'com.safepath.emergency',
        googleServicesFile: './google-services.json',
        config: {
            googleMaps: {
                apiKey: process.env.GOOGLE_MAPS_API_KEY
            }
        }
    },
    web: {
        favicon: './assets/images/favicon.png'
    },
    plugins: [
        'expo-router',
        'expo-font',
        'expo-web-browser',
        [
            'expo-notifications',
            {
                icon: './assets/images/notification-icon.png',
                color: '#ffffff',
                sounds: ['./assets/sounds/notification.wav']
            }
        ],
        [
            'expo-location',
            {
                locationAlwaysAndWhenInUsePermission: 'Allow SafePath to use your location to find nearby emergency services and share your location during emergencies.'
            }
        ]
    ],
    experiments: {
        typedRoutes: true
    },
    extra: {
        // Firebase configuration
        firebaseApiKey: process.env.FIREBASE_API_KEY,
        firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN,
        firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
        firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET,
        firebaseMessagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
        firebaseAppId: process.env.FIREBASE_APP_ID,
        firebaseMeasurementId: process.env.FIREBASE_MEASUREMENT_ID,
        // VAPID key for web push notifications
        vapidPublicKey: process.env.VAPID_PUBLIC_KEY,
        // Google Maps API key
        googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
        // Other configuration
        eas: {
            projectId: process.env.EAS_PROJECT_ID
        }
    }
});