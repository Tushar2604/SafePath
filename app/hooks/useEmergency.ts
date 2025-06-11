import { useState, useEffect } from 'react';

export type EmergencyType = 'SOS' | 'MEDICAL' | 'FIRE' | 'OTHER';

interface EmergencyData {
    type: EmergencyType;
    location: {
        latitude: number;
        longitude: number;
        accuracy: number;
    };
    createdAt: string;
    id: string;
}

export function useEmergency() {
    const [activeEmergency, setActiveEmergency] = useState<EmergencyData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Remove API fetch, use local storage instead
    useEffect(() => {
        const storedEmergency = localStorage.getItem('activeEmergency');
        if (storedEmergency) {
            try {
                setActiveEmergency(JSON.parse(storedEmergency));
            } catch (e) {
                console.error('Error parsing stored emergency:', e);
                localStorage.removeItem('activeEmergency');
            }
        }
    }, []);

    const triggerEmergency = async (type: EmergencyType, location: { latitude: number; longitude: number; accuracy: number }) => {
        setLoading(true);
        setError(null);
        try {
            const emergencyData: EmergencyData = {
                type,
                location,
                createdAt: new Date().toISOString(),
                id: `emergency_${Date.now()}`,
            };

            setActiveEmergency(emergencyData);
            localStorage.setItem('activeEmergency', JSON.stringify(emergencyData));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to trigger emergency');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const cancelEmergency = async () => {
        setLoading(true);
        setError(null);
        try {
            setActiveEmergency(null);
            localStorage.removeItem('activeEmergency');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to cancel emergency');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        activeEmergency,
        loading,
        error,
        triggerEmergency,
        cancelEmergency,
    };
} 