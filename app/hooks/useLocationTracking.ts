import { useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';

export interface LocationData {
    latitude: number;
    longitude: number;
    accuracy?: number;
    timestamp: number;
    address?: string;
}

export function useLocationTracking() {
    const { user } = useAuth();
    const [location, setLocation] = useState<LocationData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isTracking, setIsTracking] = useState(false);
    const locationSubscription = useRef<Location.LocationSubscription | null>(null);

    // Request location permissions
    const requestPermissions = async () => {
        try {
            const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
            if (foregroundStatus !== 'granted') {
                setError('Location permission denied');
                return false;
            }

            const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
            if (backgroundStatus !== 'granted') {
                setError('Background location permission denied');
                return false;
            }

            return true;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to request location permissions');
            return false;
        }
    };

    // Start location tracking
    const startTracking = async () => {
        if (!user) {
            setError('User must be logged in to track location');
            return;
        }

        const hasPermission = await requestPermissions();
        if (!hasPermission) {
            setError('Location permissions not granted');
            return;
        }

        try {
            // Stop any existing tracking
            if (locationSubscription.current) {
                await locationSubscription.current.remove();
                locationSubscription.current = null;
            }

            setIsTracking(true);
            setError(null); // Clear any previous errors

            // Get initial location with retry
            let initialLocation = null;
            let retryCount = 0;
            const maxRetries = 3;

            while (!initialLocation && retryCount < maxRetries) {
                try {
                    initialLocation = await Location.getCurrentPositionAsync({
                        accuracy: Location.Accuracy.High
                    });
                } catch (err) {
                    console.warn(`Failed to get initial location (attempt ${retryCount + 1}):`, err);
                    retryCount++;
                    if (retryCount < maxRetries) {
                        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
                    }
                }
            }

            if (!initialLocation) {
                throw new Error('Failed to get initial location after multiple attempts');
            }

            // Update location state
            const locationData: LocationData = {
                latitude: initialLocation.coords.latitude,
                longitude: initialLocation.coords.longitude,
                accuracy: initialLocation.coords.accuracy ?? undefined,
                timestamp: Date.now()
            };

            console.log('Initial location received:', locationData);

            // Get address for initial location
            try {
                const [address] = await Location.reverseGeocodeAsync({
                    latitude: locationData.latitude,
                    longitude: locationData.longitude
                });

                if (address) {
                    locationData.address = [
                        address.street,
                        address.city,
                        address.region,
                        address.country
                    ].filter(Boolean).join(', ');
                    console.log('Address resolved:', locationData.address);
                }
            } catch (err) {
                console.warn('Failed to get address:', err);
            }

            setLocation(locationData);

            // Start watching location
            const subscription = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.High,
                    timeInterval: 5000, // Update every 5 seconds
                    distanceInterval: 5 // Update if moved 5 meters
                },
                async (newLocation) => {
                    console.log('Location update received:', newLocation);
                    const updatedLocation: LocationData = {
                        latitude: newLocation.coords.latitude,
                        longitude: newLocation.coords.longitude,
                        accuracy: newLocation.coords.accuracy ?? undefined,
                        timestamp: Date.now()
                    };

                    // Get address for new location
                    try {
                        const [address] = await Location.reverseGeocodeAsync({
                            latitude: updatedLocation.latitude,
                            longitude: updatedLocation.longitude
                        });

                        if (address) {
                            updatedLocation.address = [
                                address.street,
                                address.city,
                                address.region,
                                address.country
                            ].filter(Boolean).join(', ');
                        }
                    } catch (err) {
                        console.warn('Failed to get address:', err);
                    }

                    console.log('Setting updated location:', updatedLocation);
                    setLocation(updatedLocation);

                    // Update location in Firestore if user is logged in
                    if (user) {
                        try {
                            await updateDoc(doc(db, 'users', user.uid), {
                                lastKnownLocation: updatedLocation,
                                locationUpdatedAt: serverTimestamp()
                            });
                            console.log('Location updated in Firestore');
                        } catch (err) {
                            console.error('Failed to update location in Firestore:', err);
                        }
                    }
                }
            );

            console.log('Location subscription started');
            locationSubscription.current = subscription;
        } catch (err) {
            console.error('Location tracking error:', err);
            setError(err instanceof Error ? err.message : 'Failed to start location tracking');
            setIsTracking(false);
            if (locationSubscription.current) {
                try {
                    await locationSubscription.current.remove();
                } catch (removeErr) {
                    console.error('Error removing subscription:', removeErr);
                }
                locationSubscription.current = null;
            }
        }
    };

    // Stop location tracking
    const stopTracking = async () => {
        try {
            if (locationSubscription.current) {
                await locationSubscription.current.remove();
                locationSubscription.current = null;
            }
            setIsTracking(false);
        } catch (err) {
            console.error('Error stopping location tracking:', err);
            setError(err instanceof Error ? err.message : 'Failed to stop location tracking');
        }
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (locationSubscription.current) {
                try {
                    locationSubscription.current.remove();
                } catch (err) {
                    console.error('Error cleaning up location subscription:', err);
                }
            }
        };
    }, []);

    return {
        location,
        error,
        isTracking,
        startTracking,
        stopTracking,
        requestPermissions
    };
} 