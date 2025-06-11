import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform, Linking, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { Shield, MapPin, Phone, Clock, Map } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withRepeat, withTiming } from 'react-native-reanimated';
import { RequireAuth } from '../components/RequireAuth';
import { useEmergency, type EmergencyType } from '../hooks/useEmergency';
import { EmergencyAIAssistant } from '../components/EmergencyAIAssistant';
import { EmergencyDialog } from '../components/EmergencyDialog';
import { useNotification } from '../contexts/NotificationContext';
import { useLocationTracking, type LocationData } from '../hooks/useLocationTracking';

interface EmergencyContact {
  email: string;
  name: string;
  phone?: string;
}

function EmergencyScreenContent() {
  const { activeEmergency, loading, error, triggerEmergency, cancelEmergency } = useEmergency();
  const { location, error: locationError, isTracking, startTracking, stopTracking } = useLocationTracking();
  const [isEmergencyActive, setIsEmergencyActive] = useState(false);
  const [emergencyStartTime, setEmergencyStartTime] = useState<Date | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [showEmergencyDialog, setShowEmergencyDialog] = useState(false);
  const { showNotification } = useNotification();

  const scaleValue = useSharedValue(1);
  const pulseValue = useSharedValue(1);

  useEffect(() => {
    // Start location tracking when component mounts
    startTracking();
    // Stop tracking when component unmounts
    return () => {
      stopTracking();
    };
  }, []);

  useEffect(() => {
    if (activeEmergency) {
      setIsEmergencyActive(true);
      setEmergencyStartTime(new Date(activeEmergency.createdAt));
      pulseValue.value = withRepeat(
        withTiming(1.1, { duration: 1000 }),
        -1,
        true
      );
    } else {
      setIsEmergencyActive(false);
      setEmergencyStartTime(null);
      pulseValue.value = withTiming(1, { duration: 300 });
    }
  }, [activeEmergency]);

  const handleEmergencyPress = async () => {
    console.log('Emergency button pressed, location:', location);

    if (!location) {
      console.log('No location available');
      Alert.alert(
        'Location Required',
        'Please enable location services to use the emergency features.',
        [{ text: 'OK' }]
      );
      return;
    }

    console.log('Triggering haptic feedback and animation');
    scaleValue.value = withSpring(0.95, { duration: 100 }, () => {
      scaleValue.value = withSpring(1, { duration: 200 });
    });

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }

    if (!isEmergencyActive) {
      console.log('Showing emergency dialog');
      if (Platform.OS === 'web') {
        setShowEmergencyDialog(true);
      } else {
        // Use Alert.alert for native platforms
        Alert.alert(
          '🚨 EMERGENCY SOS 🚨',
          'This will notify your emergency contacts. Would you like to call 911 immediately?',
          [
            {
              text: 'CALL 911 NOW',
              style: 'destructive',
              isPreferred: true,
              onPress: handleCall911
            },
            {
              text: 'ALERT CONTACTS ONLY',
              style: 'default',
              onPress: handleAlertContacts
            },
            {
              text: 'CANCEL',
              style: 'cancel'
            }
          ],
          { cancelable: false }
        );
      }
    } else {
      // Simplified cancel emergency flow
      try {
        await cancelEmergency();
        showNotification('Emergency cancelled successfully', 'success');
        Alert.alert(
          'Emergency Cancelled',
          'The emergency alert has been cancelled.',
          [{ text: 'OK' }]
        );
      } catch (error) {
        console.error('Cancel emergency error:', error);
        showNotification('Failed to cancel emergency', 'error');
        Alert.alert(
          'Error',
          'Failed to cancel emergency. Please try again.',
          [{ text: 'OK' }]
        );
      }
    }
  };

  const handleCall911 = async () => {
    if (!location) return;

    console.log('Selected: Call 911');
    try {
      console.log('Triggering emergency with location:', location);
      await triggerEmergency('SOS', {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy ?? 0 // Provide default value if undefined
      });
      console.log('Emergency triggered successfully');

      if (Platform.OS !== 'web') {
        console.log('Opening phone dialer for 911');
        await Linking.openURL('tel:911');
      } else {
        console.log('Web platform - showing 911 alert');
        Alert.alert(
          '🚨 CALL 911 NOW 🚨',
          'Please call 911 immediately at 911',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Emergency trigger error:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to trigger emergency');
    } finally {
      setShowEmergencyDialog(false);
    }
  };

  const handleAlertContacts = async () => {
    if (!location) return;

    console.log('Selected: Alert Contacts Only');
    try {
      // Show local notification instead of sending to Firebase
      showNotification('🚨 Emergency Alert Triggered!', 'warning');

      // Simulate emergency trigger
      await triggerEmergency('SOS', {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy ?? 0 // Provide default value if undefined
      });

      console.log('Emergency alert triggered successfully');
      Alert.alert(
        '✅ Emergency Alert Sent',
        'Your emergency alert has been triggered. Stay calm and wait for assistance.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Emergency alert error:', error);
      Alert.alert('Error', 'Failed to trigger emergency alert. Please try again.');
    } finally {
      setShowEmergencyDialog(false);
    }
  };

  const handleUpdateLocation = async () => {
    try {
      if (isTracking) {
        await stopTracking();
        showNotification('Location tracking stopped', 'info');
      } else {
        showNotification('Getting your location...', 'info');
        await startTracking();
        showNotification('Location updated successfully', 'success');
      }
    } catch (error) {
      console.error('Location update error:', error);
      showNotification('Failed to update location', 'error');
    }
  };

  const buttonAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scaleValue.value }],
    };
  });

  const pulseAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pulseValue.value }],
    };
  });

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={isEmergencyActive ? [colors.primary[500], colors.primary[700]] : [colors.white, colors.gray[50]]}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: isEmergencyActive ? colors.white : colors.gray[900] }]}>
            SafePath
          </Text>
          <Text style={[styles.subtitle, { color: isEmergencyActive ? colors.white : colors.gray[600] }]}>
            Emergency Response
          </Text>
          {error && (
            <Text style={styles.errorText}>{error}</Text>
          )}
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            {isEmergencyActive && (
              <View style={styles.emergencyStatus}>
                <View style={styles.statusCard}>
                  <Clock size={20} color={colors.primary[600]} />
                  <Text style={styles.statusText}>
                    Emergency Active Since {emergencyStartTime ? formatTime(emergencyStartTime) : ''}
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.mainSection}>
              <View style={styles.buttonContainer}>
                <Animated.View style={[buttonAnimatedStyle, pulseAnimatedStyle]}>
                  <TouchableOpacity
                    style={[
                      styles.emergencyButton,
                      {
                        backgroundColor: isEmergencyActive
                          ? colors.warning[500]
                          : loading || !location
                            ? colors.gray[400]
                            : colors.primary[600]
                      }
                    ]}
                    onPress={handleEmergencyPress}
                    activeOpacity={0.8}
                    disabled={loading || !location}
                  >
                    <Shield size={48} color={colors.white} strokeWidth={2.5} />
                    <Text style={styles.buttonText}>
                      {loading
                        ? 'PROCESSING...'
                        : isEmergencyActive
                          ? 'CANCEL EMERGENCY'
                          : 'EMERGENCY SOS'
                      }
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              </View>

              <TouchableOpacity
                style={[
                  styles.locationButton,
                  isTracking && styles.locationButtonActive
                ]}
                onPress={handleUpdateLocation}
                disabled={loading}
              >
                <MapPin size={20} color={colors.white} />
                <Text style={styles.locationButtonText}>
                  {isTracking
                    ? 'Stop Tracking'
                    : location
                      ? 'Update Location'
                      : 'Get Location'
                  }
                </Text>
              </TouchableOpacity>
            </View>

            {location && (
              <View style={styles.infoSection}>
                <View style={styles.infoCard}>
                  <MapPin size={16} color={colors.secondary[600]} />
                  <Text style={styles.infoText}>
                    Location: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                  </Text>
                </View>

                <View style={styles.quickActions}>
                  <TouchableOpacity
                    style={styles.quickActionButton}
                    onPress={() => setShowMap(true)}
                  >
                    <Map size={20} color={colors.secondary[600]} />
                    <Text style={styles.quickActionText}>View Map</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.quickActionButton}
                    onPress={() => {
                      if (Platform.OS !== 'web') {
                        Linking.openURL('tel:911');
                      }
                    }}
                  >
                    <Phone size={20} color={colors.secondary[600]} />
                    <Text style={styles.quickActionText}>Call 911</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <View style={styles.aiAssistantSection}>
              <Text style={styles.aiAssistantTitle}>Emergency Guidance</Text>
              <EmergencyAIAssistant />
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: isEmergencyActive ? colors.white : colors.gray[500] }]}>
            {loading
              ? 'Processing emergency request...'
              : !location
                ? 'Waiting for location...'
                : showMap
                  ? 'Viewing emergency services map'
                  : 'Press the emergency button to activate'
            }
          </Text>
        </View>

        <EmergencyDialog
          visible={showEmergencyDialog}
          onClose={() => setShowEmergencyDialog(false)}
          onCall911={handleCall911}
          onAlertContacts={handleAlertContacts}
        />
      </LinearGradient>
    </SafeAreaView>
  );
}

export default function EmergencyScreen() {
  return (
    <RequireAuth>
      <EmergencyScreenContent />
    </RequireAuth>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
  },
  mainSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  emergencyStatus: {
    marginBottom: 24,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    elevation: 3,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statusText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: colors.gray[700],
    marginLeft: 8,
  },
  buttonContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  emergencyButton: {
    width: 200,
    height: 200,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    marginTop: 8,
    textAlign: 'center',
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary[600],
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  locationButtonText: {
    color: colors.white,
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginLeft: 8,
  },
  infoSection: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 24,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 16,
    width: '100%',
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  infoText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.gray[700],
    marginLeft: 8,
    flex: 1,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    justifyContent: 'center',
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  quickActionText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: colors.secondary[700],
    marginLeft: 8,
  },
  aiAssistantSection: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  aiAssistantTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: colors.gray[900],
    marginBottom: 16,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  footerText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  errorText: {
    color: colors.warning[500],
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginTop: 8,
    textAlign: 'center',
  },
  locationButtonActive: {
    backgroundColor: colors.primary[600],
  },
});