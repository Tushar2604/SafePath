import { getFunctions, httpsCallable } from 'firebase/functions';
import { getAuth } from 'firebase/auth';

interface EmergencyAlertData {
    contacts: string[];
    userName: string;
    location?: string;
    emergencyId: string;
}

export const sendEmergencyAlert = async (data: EmergencyAlertData) => {
    try {
        const functions = getFunctions();
        const auth = getAuth();

        // Ensure user is authenticated
        if (!auth.currentUser) {
            throw new Error('User must be authenticated to send emergency alerts');
        }

        const sendAlert = httpsCallable(functions, 'sendEmergencyAlert');
        const result = await sendAlert(data);

        return result.data;
    } catch (error) {
        console.error('Error sending emergency alert:', error);
        throw error;
    }
}; 