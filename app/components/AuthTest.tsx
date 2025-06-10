import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet } from 'react-native';
import { useAuth } from '../contexts/AuthContext';


export function AuthTest() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const { user, signIn, signUp, logout } = useAuth();

    const handleSignUp = async () => {
        try {
            setError('');
            await signUp(email, password, name);
            console.log('Sign up successful!');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Sign up failed');
            console.error('Sign up error:', err);
        }
    };

    const handleSignIn = async () => {
        try {
            setError('');
            await signIn(email, password);
            console.log('Sign in successful!');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Sign in failed');
            console.error('Sign in error:', err);
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

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Auth Test</Text>

            {user ? (
                <View>
                    <Text style={styles.status}>Logged in as: {user.email}</Text>
                    <Button title="Logout" onPress={handleLogout} />
                </View>
            ) : (
                <View>
                    <TextInput
                        style={styles.input}
                        placeholder="Name"
                        value={name}
                        onChangeText={setName}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Email"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Password"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />
                    {error ? <Text style={styles.error}>{error}</Text> : null}
                    <View style={styles.buttonContainer}>
                        <Button title="Sign Up" onPress={handleSignUp} />
                        <Button title="Sign In" onPress={handleSignIn} />
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        maxWidth: 400,
        width: '100%',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        padding: 10,
        marginBottom: 10,
        borderRadius: 5,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 10,
    },
    error: {
        color: 'red',
        marginBottom: 10,
    },
    status: {
        marginBottom: 10,
        textAlign: 'center',
    },
}); 