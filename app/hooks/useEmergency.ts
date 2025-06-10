import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';

export type EmergencyType = 'SOS' | 'Medical' | 'Fire' | 'Police' | 'Natural Disaster' | 'Other';
export type EmergencyStatus = 'Active' | 'Resolved' | 'Cancelled' | 'False Alarm';

export interface EmergencyLocation {
    latitude: number;
    longitude: number;
    accuracy?: number;
    address?: string;
}

export interface EmergencyAlert {
    id: string;
    type: EmergencyType;
    status: EmergencyStatus;
    location: EmergencyLocation;
    description?: string;
    createdAt: string;
    resolvedAt?: string;
    contactsNotified: number;
}

interface UseEmergencyReturn {
    activeEmergency: EmergencyAlert | null;
    loading: boolean;
    error: string | null;
    triggerEmergency: (type: EmergencyType, location: EmergencyLocation, description?: string) => Promise<void>;
    updateEmergencyStatus: (emergencyId: string, status: EmergencyStatus) => Promise<void>;
    updateEmergencyLocation: (emergencyId: string, location: EmergencyLocation) => Promise<void>;
    cancelEmergency: () => Promise<void>;
}

export function useEmergency(): UseEmergencyReturn {
    const { user } = useAuth();
    const [activeEmergency, setActiveEmergency] = useState<EmergencyAlert | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch active emergency on mount and when user changes
    useEffect(() => {
        if (user) {
            fetchActiveEmergency();
        }
    }, [user]);

    const fetchActiveEmergency = async () => {
        try {
            const response = await api.get('/emergency/history?limit=1');
            const emergencies = response.data.emergencies;
            if (emergencies.length > 0 && emergencies[0].status === 'Active') {
                setActiveEmergency(emergencies[0]);
            } else {
                setActiveEmergency(null);
            }
        } catch (err) {
            console.error('Error fetching active emergency:', err);
            setError('Failed to fetch emergency status');
        }
    };

    const triggerEmergency = async (type: EmergencyType, location: EmergencyLocation, description?: string) => {
        if (!user) throw new Error('User must be authenticated');

        setLoading(true);
        setError(null);

        try {
            console.log('Triggering emergency with:', { type, location, description });
            const response = await api.post('/emergency/trigger', {
                type,
                location,
                description
            });
            console.log('Emergency trigger response:', response.data);

            setActiveEmergency(response.data.emergency);
        } catch (err: any) {
            console.error('Emergency trigger error details:', {
                message: err.message,
                response: err.response?.data,
                status: err.response?.status,
                headers: err.response?.headers
            });

            const message = err.response?.data?.message || err.message || 'Failed to trigger emergency';
            setError(message);
            throw new Error(message);
        } finally {
            setLoading(false);
        }
    };

    const updateEmergencyStatus = async (emergencyId: string, status: EmergencyStatus) => {
        if (!user) throw new Error('User must be authenticated');

        setLoading(true);
        setError(null);

        try {
            await api.put(`/emergency/${emergencyId}/status`, { status });
            await fetchActiveEmergency();
        } catch (err: any) {
            const message = err.response?.data?.message || 'Failed to update emergency status';
            setError(message);
            throw new Error(message);
        } finally {
            setLoading(false);
        }
    };

    const updateEmergencyLocation = async (emergencyId: string, location: EmergencyLocation) => {
        if (!user) throw new Error('User must be authenticated');

        try {
            await api.post(`/emergency/${emergencyId}/location`, location);
        } catch (err: any) {
            const message = err.response?.data?.message || 'Failed to update location';
            setError(message);
            throw new Error(message);
        }
    };

    const cancelEmergency = async () => {
        if (!activeEmergency) throw new Error('No active emergency to cancel');
        await updateEmergencyStatus(activeEmergency.id, 'Cancelled');
    };

    return {
        activeEmergency,
        loading,
        error,
        triggerEmergency,
        updateEmergencyStatus,
        updateEmergencyLocation,
        cancelEmergency
    };
} 