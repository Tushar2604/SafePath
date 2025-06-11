import React from 'react';
import { View, Text, Modal, Pressable, StyleSheet, Platform } from 'react-native';
import { colors } from '@/constants/colors';

interface EmergencyDialogProps {
    visible: boolean;
    onClose: () => void;
    onCall911: () => void;
    onAlertContacts: () => void;
}

export function EmergencyDialog({ visible, onClose, onCall911, onAlertContacts }: EmergencyDialogProps) {
    if (Platform.OS !== 'web') return null;

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.centeredView}>
                <View style={styles.modalView}>
                    <Text style={styles.modalTitle}>🚨 EMERGENCY SOS 🚨</Text>
                    <Text style={styles.modalText}>
                        This will notify your emergency contacts. Would you like to call 911 immediately?
                    </Text>

                    <View style={styles.buttonContainer}>
                        <Pressable
                            style={[styles.button, styles.call911Button]}
                            onPress={onCall911}
                        >
                            <Text style={styles.buttonText}>CALL 911 NOW</Text>
                        </Pressable>

                        <Pressable
                            style={[styles.button, styles.alertButton]}
                            onPress={onAlertContacts}
                        >
                            <Text style={styles.buttonText}>ALERT CONTACTS ONLY</Text>
                        </Pressable>

                        <Pressable
                            style={[styles.button, styles.cancelButton]}
                            onPress={onClose}
                        >
                            <Text style={styles.cancelButtonText}>CANCEL</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalView: {
        margin: 20,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        width: '90%',
        maxWidth: 400,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
        color: colors.warning[500],
    },
    modalText: {
        fontSize: 16,
        marginBottom: 24,
        textAlign: 'center',
        color: colors.gray[700],
    },
    buttonContainer: {
        width: '100%',
        gap: 12,
    },
    button: {
        borderRadius: 12,
        padding: 16,
        elevation: 2,
        width: '100%',
        alignItems: 'center',
    },
    call911Button: {
        backgroundColor: colors.warning[500],
    },
    alertButton: {
        backgroundColor: colors.primary[600],
    },
    cancelButton: {
        backgroundColor: colors.gray[100],
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    cancelButtonText: {
        color: colors.gray[700],
        fontWeight: 'bold',
        fontSize: 16,
    },
}); 