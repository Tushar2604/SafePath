import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { colors } from '@/constants/colors';
import { RequireAuth } from '../../components/RequireAuth';
import { useEmergencyContacts, EmergencyContact, Relationship } from '../../hooks/useEmergencyContacts';
import { TextInput } from 'react-native-gesture-handler';
import { Picker } from '@react-native-picker/picker';

const RELATIONSHIPS: Relationship[] = [
    'Spouse',
    'Parent',
    'Child',
    'Sibling',
    'Friend',
    'Doctor',
    'Other'
];

export default function EditContactScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { contacts, updateContact } = useEmergencyContacts();
    const [loading, setLoading] = useState(false);
    const [contact, setContact] = useState<EmergencyContact | null>(null);
    const [formData, setFormData] = useState<Partial<EmergencyContact>>({
        name: '',
        phone: '',
        email: '',
        relationship: RELATIONSHIPS[0],
        isPrimary: false,
        notificationPreferences: {
            sms: true,
            email: false,
            call: false
        }
    });

    useEffect(() => {
        if (!id) {
            Alert.alert('Error', 'Contact ID is required');
            router.back();
            return;
        }

        const foundContact = contacts.find(c => c._id === id);
        if (!foundContact) {
            Alert.alert('Error', 'Contact not found');
            router.back();
            return;
        }

        setContact(foundContact);
        setFormData({
            name: foundContact.name,
            phone: foundContact.phone,
            email: foundContact.email || '',
            relationship: foundContact.relationship as Relationship,
            isPrimary: foundContact.isPrimary,
            notificationPreferences: foundContact.notificationPreferences
        });
    }, [id, contacts]);

    const handleSubmit = async () => {
        if (!contact) return;

        if (!formData.name?.trim()) {
            Alert.alert('Error', 'Please enter a name');
            return;
        }

        if (!formData.phone?.trim()) {
            Alert.alert('Error', 'Please enter a phone number');
            return;
        }

        // Basic phone number validation
        const phoneRegex = /^\+?[1-9]\d{1,14}$/;
        if (!phoneRegex.test(formData.phone.replace(/\D/g, ''))) {
            Alert.alert('Error', 'Please enter a valid phone number');
            return;
        }

        // Basic email validation if provided
        if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
            Alert.alert('Error', 'Please enter a valid email address');
            return;
        }

        try {
            setLoading(true);
            await updateContact(contact._id, {
                ...formData,
                phone: formData.phone.replace(/\D/g, '') // Strip non-digits
            });
            Alert.alert('Success', 'Emergency contact updated successfully', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error) {
            Alert.alert('Error', error instanceof Error ? error.message : 'Failed to update contact');
        } finally {
            setLoading(false);
        }
    };

    if (!contact) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary[600]} />
                    <Text style={styles.loadingText}>Loading contact...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <RequireAuth fallbackMessage="Please sign in to edit emergency contacts">
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <Text style={styles.backButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>Edit Emergency Contact</Text>
                    <TouchableOpacity
                        style={[styles.saveButton, loading && styles.saveButtonDisabled]}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color={colors.white} />
                        ) : (
                            <Text style={styles.saveButtonText}>Save</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    <View style={styles.form}>
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Name *</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.name}
                                onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                                placeholder="Enter full name"
                                placeholderTextColor={colors.gray[400]}
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Phone Number *</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.phone}
                                onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))}
                                placeholder="Enter phone number"
                                placeholderTextColor={colors.gray[400]}
                                keyboardType="phone-pad"
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Email (Optional)</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.email}
                                onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
                                placeholder="Enter email address"
                                placeholderTextColor={colors.gray[400]}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Relationship</Text>
                            <View style={styles.pickerContainer}>
                                <Picker
                                    selectedValue={formData.relationship}
                                    onValueChange={(value: Relationship) => setFormData(prev => ({ ...prev, relationship: value }))}
                                    style={styles.picker}
                                >
                                    {RELATIONSHIPS.map((rel) => (
                                        <Picker.Item key={rel} label={rel} value={rel} />
                                    ))}
                                </Picker>
                            </View>
                        </View>

                        <View style={styles.formGroup}>
                            <TouchableOpacity
                                style={styles.checkboxContainer}
                                onPress={() => setFormData(prev => ({ ...prev, isPrimary: !prev.isPrimary }))}
                            >
                                <View style={[styles.checkbox, formData.isPrimary && styles.checkboxChecked]}>
                                    {formData.isPrimary && (
                                        <Text style={styles.checkmark}>✓</Text>
                                    )}
                                </View>
                                <Text style={styles.checkboxLabel}>Set as Primary Contact</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.notificationSection}>
                            <Text style={styles.sectionTitle}>Notification Preferences</Text>

                            <TouchableOpacity
                                style={styles.checkboxContainer}
                                onPress={() => setFormData(prev => ({
                                    ...prev,
                                    notificationPreferences: {
                                        ...prev.notificationPreferences!,
                                        sms: !prev.notificationPreferences?.sms
                                    }
                                }))}
                            >
                                <View style={[styles.checkbox, formData.notificationPreferences?.sms && styles.checkboxChecked]}>
                                    {formData.notificationPreferences?.sms && (
                                        <Text style={styles.checkmark}>✓</Text>
                                    )}
                                </View>
                                <Text style={styles.checkboxLabel}>Send SMS Notifications</Text>
                            </TouchableOpacity>

                            {formData.email && (
                                <TouchableOpacity
                                    style={styles.checkboxContainer}
                                    onPress={() => setFormData(prev => ({
                                        ...prev,
                                        notificationPreferences: {
                                            ...prev.notificationPreferences!,
                                            email: !prev.notificationPreferences?.email
                                        }
                                    }))}
                                >
                                    <View style={[styles.checkbox, formData.notificationPreferences?.email && styles.checkboxChecked]}>
                                        {formData.notificationPreferences?.email && (
                                            <Text style={styles.checkmark}>✓</Text>
                                        )}
                                    </View>
                                    <Text style={styles.checkboxLabel}>Send Email Notifications</Text>
                                </TouchableOpacity>
                            )}

                            <TouchableOpacity
                                style={styles.checkboxContainer}
                                onPress={() => setFormData(prev => ({
                                    ...prev,
                                    notificationPreferences: {
                                        ...prev.notificationPreferences!,
                                        call: !prev.notificationPreferences?.call
                                    }
                                }))}
                            >
                                <View style={[styles.checkbox, formData.notificationPreferences?.call && styles.checkboxChecked]}>
                                    {formData.notificationPreferences?.call && (
                                        <Text style={styles.checkmark}>✓</Text>
                                    )}
                                </View>
                                <Text style={styles.checkboxLabel}>Make Emergency Calls</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </RequireAuth>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.gray[50],
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: colors.white,
        borderBottomWidth: 1,
        borderBottomColor: colors.gray[200],
    },
    backButton: {
        padding: 8,
    },
    backButtonText: {
        fontSize: 16,
        fontFamily: 'Inter-Medium',
        color: colors.gray[600],
    },
    title: {
        fontSize: 18,
        fontFamily: 'Inter-SemiBold',
        color: colors.gray[900],
    },
    saveButton: {
        backgroundColor: colors.primary[600],
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    saveButtonDisabled: {
        opacity: 0.7,
    },
    saveButtonText: {
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
        color: colors.white,
    },
    content: {
        flex: 1,
        padding: 16,
    },
    form: {
        backgroundColor: colors.white,
        borderRadius: 12,
        padding: 16,
        gap: 16,
    },
    formGroup: {
        gap: 8,
    },
    label: {
        fontSize: 14,
        fontFamily: 'Inter-Medium',
        color: colors.gray[700],
    },
    input: {
        borderWidth: 1,
        borderColor: colors.gray[300],
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        fontFamily: 'Inter-Regular',
        color: colors.gray[900],
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: colors.gray[300],
        borderRadius: 8,
        overflow: 'hidden',
    },
    picker: {
        height: 48,
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderWidth: 2,
        borderColor: colors.primary[600],
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxChecked: {
        backgroundColor: colors.primary[600],
    },
    checkmark: {
        color: colors.white,
        fontSize: 16,
        fontFamily: 'Inter-Bold',
    },
    checkboxLabel: {
        fontSize: 16,
        fontFamily: 'Inter-Regular',
        color: colors.gray[900],
    },
    notificationSection: {
        marginTop: 8,
        gap: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
        color: colors.gray[900],
        marginBottom: 8,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        fontFamily: 'Inter-Medium',
        color: colors.gray[600],
    },
}); 