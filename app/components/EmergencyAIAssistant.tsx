import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    Alert,
    Pressable,
} from 'react-native';
import { colors } from '@/constants/colors';
import { MessageSquare, AlertCircle, Shield, Heart } from 'lucide-react-native';
import { api } from '../lib/api';

interface AIResponse {
    success: boolean;
    firstAidSteps: string[];
    safetyTips: string[];
    beforeHelpArrives: string[];
    error?: string;
    details?: string;
}

export function EmergencyAIAssistant() {
    const [description, setDescription] = useState('');
    const [aiResponse, setAiResponse] = useState<AIResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);

    const handleSubmit = async () => {
        if (!description.trim()) {
            setError('Please describe the emergency situation');
            return;
        }

        setIsLoading(true);
        setError(null);
        setAiResponse(null);

        try {
            console.log('Sending AI assistance request:', { description });
            const response = await api.post<AIResponse>('/emergency/ai-assist', {
                description: description.trim()
            });
            console.log('AI assistance response:', response.data);

            if (response.data.success) {
                setAiResponse(response.data);
                setError(null);
            } else {
                setError(response.data.error || 'Failed to get emergency guidance');
            }
        } catch (err: any) {
            console.error('AI assistance error:', err);
            if (err.isTimeout) {
                setError('The AI service is taking longer than expected. Please try again in a moment.');
            } else {
                setError(err.response?.data?.error || err.message || 'Failed to get emergency guidance');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.outerContainer}>
            <View style={styles.container}>
                <Pressable
                    style={styles.header}
                    onPress={() => setIsExpanded(!isExpanded)}
                >
                    <View style={styles.headerContent}>
                        <MessageSquare size={24} color="#FF3B30" />
                        <Text style={styles.title}>Emergency AI Assistant</Text>
                    </View>
                    <MessageSquare
                        size={24}
                        color="#666"
                        style={[
                            styles.chevron,
                            isExpanded && styles.chevronRotated
                        ]}
                    />
                </Pressable>

                {isExpanded && (
                    <View style={styles.expandedContent}>
                        <ScrollView
                            style={styles.scrollView}
                            contentContainerStyle={styles.scrollContent}
                            keyboardShouldPersistTaps="handled"
                            showsVerticalScrollIndicator={true}
                        >
                            <Text style={styles.description}>
                                Describe your emergency situation to get immediate guidance and first aid instructions.
                            </Text>

                            <TextInput
                                style={styles.input}
                                placeholder="Describe the emergency situation..."
                                value={description}
                                onChangeText={(text) => {
                                    setDescription(text);
                                    setError(null);
                                }}
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                                placeholderTextColor="#666"
                            />

                            {error && (
                                <View style={styles.errorContainer}>
                                    <AlertCircle size={20} color="#FF3B30" />
                                    <Text style={styles.errorText}>{error}</Text>
                                </View>
                            )}

                            <Pressable
                                style={[
                                    styles.submitButton,
                                    (!description.trim() || isLoading) && styles.submitButtonDisabled
                                ]}
                                onPress={handleSubmit}
                                disabled={!description.trim() || isLoading}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <>
                                        <MessageSquare size={20} color="#fff" />
                                        <Text style={styles.submitButtonText}>Get Emergency Guidance</Text>
                                    </>
                                )}
                            </Pressable>

                            {aiResponse && (
                                <View style={styles.responseContainer}>
                                    <View style={styles.responseSection}>
                                        <Text style={styles.responseTitle}>First Aid Steps</Text>
                                        {aiResponse.firstAidSteps.map((step, index) => (
                                            <Text key={index} style={styles.responseText}>• {step}</Text>
                                        ))}
                                    </View>

                                    <View style={styles.responseSection}>
                                        <Text style={styles.responseTitle}>Safety Tips</Text>
                                        {aiResponse.safetyTips.map((tip, index) => (
                                            <Text key={index} style={styles.responseText}>• {tip}</Text>
                                        ))}
                                    </View>

                                    <View style={styles.responseSection}>
                                        <Text style={styles.responseTitle}>Before Help Arrives</Text>
                                        {aiResponse.beforeHelpArrives.map((action, index) => (
                                            <Text key={index} style={styles.responseText}>• {action}</Text>
                                        ))}
                                    </View>
                                </View>
                            )}
                        </ScrollView>
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    outerContainer: {
        width: '100%',
        marginVertical: 8,
    },
    container: {
        backgroundColor: '#fff',
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000',
    },
    chevron: {
        transform: [{ rotate: '0deg' }],
    },
    chevronRotated: {
        transform: [{ rotate: '180deg' }],
    },
    expandedContent: {
        maxHeight: 500, // Fixed height for expanded content
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 32, // Extra padding at bottom
    },
    description: {
        fontSize: 14,
        color: '#666',
        marginBottom: 16,
        lineHeight: 20,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#000',
        backgroundColor: '#f8f8f8',
        minHeight: 100,
        marginBottom: 16,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFE5E5',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        gap: 8,
    },
    errorText: {
        color: '#FF3B30',
        fontSize: 14,
        flex: 1,
    },
    submitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FF3B30',
        padding: 16,
        borderRadius: 8,
        gap: 8,
        marginBottom: 16,
    },
    submitButtonDisabled: {
        opacity: 0.5,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    responseContainer: {
        gap: 20,
    },
    responseSection: {
        backgroundColor: '#f8f8f8',
        padding: 16,
        borderRadius: 8,
    },
    responseTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
        marginBottom: 12,
    },
    responseText: {
        fontSize: 14,
        color: '#333',
        lineHeight: 20,
        marginBottom: 8,
    },
}); 