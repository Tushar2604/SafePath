import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { getToken } from 'firebase/messaging';
import { getMessaging } from 'firebase/messaging';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export function useNotifications() {
    const [expoPushToken, setExpoPushToken] = useState<string>('');
    const [fcmToken, setFcmToken] = useState<string>('');

    useEffect(() => {
        registerForPushNotificationsAsync();
    }, []);

    async function registerForPushNotificationsAsync() {
        let token;

        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        }

        if (Device.isDevice) {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;

            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }

            if (finalStatus !== 'granted') {
                console.log('Failed to get push token for push notification!');
                return;
            }

            try {
                // Get Expo push token
                if (Platform.OS === 'web') {
                    // For web, we need to check if VAPID key is configured
                    const vapidKey = Constants.expoConfig?.extra?.vapidPublicKey;
                    if (!vapidKey) {
                        console.warn('VAPID key not configured. Web push notifications will not work.');
                        return;
                    }
                    token = (await Notifications.getExpoPushTokenAsync({
                        projectId: Constants.expoConfig?.extra?.eas?.projectId
                    })).data;
                } else {
                    // For native platforms
                    token = (await Notifications.getExpoPushTokenAsync({
                        projectId: Constants.expoConfig?.extra?.eas?.projectId
                    })).data;
                }
                setExpoPushToken(token);

                // Get FCM token for native platforms
                if (Platform.OS !== 'web' && getMessaging()) {
                    try {
                        const fcmToken = await getToken(getMessaging());
                        setFcmToken(fcmToken);
                    } catch (error) {
                        console.error('Error getting FCM token:', error);
                    }
                }
            } catch (error) {
                console.error('Error getting push token:', error);
            }
        } else {
            console.log('Must use physical device for Push Notifications');
        }
    }

    async function sendPushNotification(expoPushToken: string, title: string, body: string, data = {}) {
        const message = {
            to: expoPushToken,
            sound: 'default',
            title,
            body,
            data,
        };

        try {
            await fetch('https://exp.host/--/api/v2/push/send', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Accept-encoding': 'gzip, deflate',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(message),
            });
        } catch (error) {
            console.error('Error sending push notification:', error);
            throw error;
        }
    }

    return {
        expoPushToken,
        fcmToken,
        sendPushNotification,
    };
} 