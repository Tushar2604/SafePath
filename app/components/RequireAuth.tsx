import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { AuthTest } from './AuthTest';
import { colors } from '@/constants/colors';

interface RequireAuthProps {
    children: React.ReactNode;
    fallbackMessage?: string;
}

export function RequireAuth({ children, fallbackMessage = 'Please sign in to access this feature' }: RequireAuthProps) {
    const { user } = useAuth();

    if (!user) {
        return (
            <View style={styles.container}>
                {fallbackMessage && (
                    <Text style={styles.message}>{fallbackMessage}</Text>
                )}
                <AuthTest />
            </View>
        );
    }

    return <>{children}</>;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.gray[50],
    },
    message: {
        fontSize: 16,
        fontFamily: 'Inter-Medium',
        color: colors.gray[700],
        textAlign: 'center',
        padding: 16,
        backgroundColor: colors.gray[100],
    },
}); 