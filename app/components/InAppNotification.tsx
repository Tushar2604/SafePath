import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useNotification } from '../contexts/NotificationContext';

export function InAppNotification() {
    const { notification } = useNotification();

    if (!notification) return null;

    let backgroundColor = '#2563eb'; // info
    if (notification.type === 'success') backgroundColor = '#16a34a';
    if (notification.type === 'warning') backgroundColor = '#f59e42';
    if (notification.type === 'error') backgroundColor = '#dc2626';

    return (
        <View style={[styles.banner, { backgroundColor }]}>
            <Text style={styles.text}>{notification.message}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    banner: {
        position: 'absolute',
        top: 50,
        left: 20,
        right: 20,
        zIndex: 1000,
        padding: 16,
        borderRadius: 10,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    text: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});