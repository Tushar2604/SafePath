import React, { useState } from 'react';
import { View, Text, StyleSheet, Button, ScrollView } from 'react-native';
import { useLocationTracking } from '../hooks/useLocationTracking';
import { useNotifications } from '../hooks/useNotifications';
import { useEmergency } from '../hooks/useEmergency';

export function LocationNotificationTest() {
    const [testResults, setTestResults] = useState<string[]>([]);

    // Location tracking
    const {
        location,
        error: locationError,
        isTracking,
        startTracking,
        stopTracking
    } = useLocationTracking();

    // Notifications
    const {
        expoPushToken,
        fcmToken,
        sendPushNotification
    } = useNotifications();

    // Emergency system (for testing location updates during emergency)
    const {
        activeEmergency,
        triggerEmergency,
        updateEmergencyStatus
    } = useEmergency();

    const addTestResult = (result: string) => {
        setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
    };

    const runLocationTest = async () => {
        try {
            addTestResult('Starting location test...');

            // Start tracking
            await startTracking();
            addTestResult('Location tracking started');

            // Wait for initial location with multiple attempts
            let attempts = 0;
            const maxAttempts = 3;

            while (attempts < maxAttempts) {
                addTestResult(`Waiting for location update (attempt ${attempts + 1}/${maxAttempts})...`);

                // Wait for 5 seconds
                await new Promise(resolve => setTimeout(resolve, 5000));

                if (location) {
                    addTestResult(`Location received: ${location.latitude}, ${location.longitude}`);
                    if (location.address) {
                        addTestResult(`Address: ${location.address}`);
                    }
                    if (location.accuracy) {
                        addTestResult(`Accuracy: ${location.accuracy.toFixed(2)} meters`);
                    }
                    addTestResult(`Timestamp: ${new Date(location.timestamp).toLocaleTimeString()}`);
                    break;
                } else {
                    attempts++;
                    if (attempts === maxAttempts) {
                        addTestResult('No location received after multiple attempts');
                        if (locationError) {
                            addTestResult(`Location error: ${locationError}`);
                        }
                    }
                }
            }

            // Stop tracking
            await stopTracking();
            addTestResult('Location tracking stopped');
        } catch (error) {
            addTestResult(`Location test error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            if (locationError) {
                addTestResult(`Location error state: ${locationError}`);
            }
        }
    };

    const runNotificationTest = async () => {
        try {
            addTestResult('Starting notification test...');

            if (!expoPushToken && !fcmToken) {
                addTestResult('No push token available. Please check notification permissions.');
                return;
            }

            addTestResult(`Expo Push Token: ${expoPushToken ? 'Available' : 'Not available'}`);
            addTestResult(`FCM Token: ${fcmToken ? 'Available' : 'Not available'}`);

            // Send test notification
            if (expoPushToken) {
                await sendPushNotification(
                    expoPushToken,
                    'Test Notification',
                    'This is a test notification from SafePath'
                );
                addTestResult('Test notification sent via Expo');
            } else if (fcmToken) {
                await sendPushNotification(
                    fcmToken,
                    'Test Notification',
                    'This is a test notification from SafePath'
                );
                addTestResult('Test notification sent via FCM');
            }
        } catch (error) {
            addTestResult(`Notification test error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    const runEmergencyLocationTest = async () => {
        try {
            addTestResult('Starting emergency location test...');

            // Start tracking if not already tracking
            if (!isTracking) {
                await startTracking();
                addTestResult('Location tracking started');
            }

            // Trigger emergency
            await triggerEmergency('SOS', 'Testing emergency location updates');
            addTestResult('Emergency triggered');

            // Wait for a few location updates
            await new Promise(resolve => setTimeout(resolve, 15000));

            if (location) {
                addTestResult(`Latest location during emergency: ${location.latitude}, ${location.longitude}`);
            }

            // Resolve emergency
            if (activeEmergency) {
                await updateEmergencyStatus(activeEmergency.id, 'Resolved');
                addTestResult('Emergency resolved');
            }

            // Stop tracking
            await stopTracking();
            addTestResult('Location tracking stopped');
        } catch (error) {
            addTestResult(`Emergency location test error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.modalTitle}>Location & Notification Tests</Text>

            <View style={styles.buttonContainer}>
                <Button
                    title="Test Location Tracking"
                    onPress={runLocationTest}
                />
                <Button
                    title="Test Notifications"
                    onPress={runNotificationTest}
                />
                <Button
                    title="Test Emergency Location"
                    onPress={runEmergencyLocationTest}
                />
            </View>

            <ScrollView style={styles.resultsContainer}>
                {testResults.map((result, index) => (
                    <Text key={index} style={styles.resultText}>{result}</Text>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    buttonContainer: {
        gap: 10,
        marginBottom: 20,
    },
    resultsContainer: {
        maxHeight: 300,
        marginBottom: 20,
        padding: 10,
        backgroundColor: '#f5f5f5',
        borderRadius: 10,
    },
    resultText: {
        fontSize: 12,
        marginBottom: 5,
        fontFamily: 'monospace',
    },
}); 