import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Shield, Mail, Lock, User, ArrowRight, AlertCircle } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useAuth } from '../contexts/AuthContext';

export function AuthTest() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const { user, signIn, signUp, logout } = useAuth();

    const handleSubmit = async () => {
        try {
            setError('');
            if (isSignUp) {
                await signUp(email, password, name);
                console.log('Sign up successful!');
            } else {
                await signIn(email, password);
                console.log('Sign in successful!');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : `${isSignUp ? 'Sign up' : 'Sign in'} failed`);
            console.error('Auth error:', err);
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            console.log('Logout successful!');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Logout failed');
            console.error('Logout error:', err);
        }
    };

    if (user) {
        return (
            <SafeAreaView style={styles.container}>
                <LinearGradient
                    colors={[colors.primary[500], colors.primary[700]]}
                    style={styles.gradient}
                >
                    <View style={styles.formContainer}>
                        <View style={styles.header}>
                            <Shield size={48} color={colors.white} strokeWidth={2.5} />
                            <Text style={styles.appName}>SafePath</Text>
                        </View>
                        <View style={styles.userInfo}>
                            <View style={styles.avatar}>
                                <User size={32} color={colors.gray[600]} />
                            </View>
                            <Text style={styles.userEmail}>{user.email}</Text>
                            <TouchableOpacity
                                style={styles.logoutButton}
                                onPress={handleLogout}
                            >
                                <Text style={styles.logoutButtonText}>Sign Out</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </LinearGradient>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient
                colors={[colors.primary[500], colors.primary[700]]}
                style={styles.gradient}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardAvoid}
                >
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                    >
                        <View style={styles.formContainer}>
                            <View style={styles.header}>
                                <Shield size={48} color={colors.white} strokeWidth={2.5} />
                                <Text style={styles.appName}>SafePath</Text>
                                <Text style={styles.tagline}>
                                    Your Emergency Response Companion
                                </Text>
                            </View>

                            <View style={styles.form}>
                                <View style={styles.formHeader}>
                                    <Text style={styles.formTitle}>
                                        {isSignUp ? 'Create Account' : 'Welcome Back'}
                                    </Text>
                                    <Text style={styles.formSubtitle}>
                                        {isSignUp
                                            ? 'Sign up to get started with SafePath'
                                            : 'Sign in to access your emergency contacts and settings'
                                        }
                                    </Text>
                                </View>

                                {error && (
                                    <View style={styles.errorContainer}>
                                        <AlertCircle size={16} color={colors.warning[500]} />
                                        <Text style={styles.errorText}>{error}</Text>
                                    </View>
                                )}

                                {isSignUp && (
                                    <View style={styles.inputContainer}>
                                        <View style={styles.inputIcon}>
                                            <User size={20} color={colors.gray[400]} />
                                        </View>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Full Name"
                                            value={name}
                                            onChangeText={setName}
                                            placeholderTextColor={colors.gray[400]}
                                            autoCapitalize="words"
                                        />
                                    </View>
                                )}

                                <View style={styles.inputContainer}>
                                    <View style={styles.inputIcon}>
                                        <Mail size={20} color={colors.gray[400]} />
                                    </View>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Email Address"
                                        value={email}
                                        onChangeText={setEmail}
                                        placeholderTextColor={colors.gray[400]}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        autoComplete="email"
                                    />
                                </View>

                                <View style={styles.inputContainer}>
                                    <View style={styles.inputIcon}>
                                        <Lock size={20} color={colors.gray[400]} />
                                    </View>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Password"
                                        value={password}
                                        onChangeText={setPassword}
                                        placeholderTextColor={colors.gray[400]}
                                        secureTextEntry
                                        autoComplete="password"
                                    />
                                </View>

                                <TouchableOpacity
                                    style={styles.submitButton}
                                    onPress={handleSubmit}
                                >
                                    <Text style={styles.submitButtonText}>
                                        {isSignUp ? 'Create Account' : 'Sign In'}
                                    </Text>
                                    <ArrowRight size={20} color={colors.white} />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.toggleButton}
                                    onPress={() => {
                                        setIsSignUp(!isSignUp);
                                        setError('');
                                    }}
                                >
                                    <Text style={styles.toggleButtonText}>
                                        {isSignUp
                                            ? 'Already have an account? Sign In'
                                            : "Don't have an account? Sign Up"
                                        }
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </LinearGradient>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradient: {
        flex: 1,
    },
    keyboardAvoid: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        padding: 24,
    },
    formContainer: {
        backgroundColor: colors.white,
        borderRadius: 24,
        padding: 24,
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 8,
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    appName: {
        fontSize: 32,
        fontFamily: 'Inter-Bold',
        color: colors.primary[600],
        marginTop: 16,
        marginBottom: 8,
    },
    tagline: {
        fontSize: 16,
        fontFamily: 'Inter-Regular',
        color: colors.gray[600],
        textAlign: 'center',
    },
    formHeader: {
        marginBottom: 24,
    },
    formTitle: {
        fontSize: 24,
        fontFamily: 'Inter-Bold',
        color: colors.gray[900],
        marginBottom: 8,
    },
    formSubtitle: {
        fontSize: 14,
        fontFamily: 'Inter-Regular',
        color: colors.gray[600],
        lineHeight: 20,
    },
    form: {
        gap: 16,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.gray[50],
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.gray[200],
    },
    inputIcon: {
        padding: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        fontFamily: 'Inter-Regular',
        color: colors.gray[900],
        paddingVertical: 12,
        paddingRight: 12,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.warning[50],
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
    },
    errorText: {
        fontSize: 14,
        fontFamily: 'Inter-Medium',
        color: colors.warning[700],
        marginLeft: 8,
        flex: 1,
    },
    submitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primary[600],
        paddingVertical: 16,
        borderRadius: 12,
        marginTop: 8,
    },
    submitButtonText: {
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
        color: colors.white,
        marginRight: 8,
    },
    toggleButton: {
        alignItems: 'center',
        paddingVertical: 16,
    },
    toggleButtonText: {
        fontSize: 14,
        fontFamily: 'Inter-Medium',
        color: colors.primary[600],
    },
    userInfo: {
        alignItems: 'center',
        padding: 24,
    },
    avatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: colors.gray[100],
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    userEmail: {
        fontSize: 16,
        fontFamily: 'Inter-Medium',
        color: colors.gray[900],
        marginBottom: 24,
    },
    logoutButton: {
        backgroundColor: colors.primary[600],
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    logoutButtonText: {
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
        color: colors.white,
    },
}); 