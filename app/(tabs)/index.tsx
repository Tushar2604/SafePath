import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform, Linking } from 'react-native';
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

interface LocationData {
  latitude: number;
  longitude: number;
  timestamp: number;
}

function EmergencyScreenContent() {
  const { activeEmergency, loading, error, triggerEmergency, cancelEmergency } = useEmergency();
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isEmergencyActive, setIsEmergencyActive] = useState(false);
  const [emergencyStartTime, setEmergencyStartTime] = useState<Date | null>(null);
  const [showMap, setShowMap] = useState(false);

  const scaleValue = useSharedValue(1);
  const pulseValue = useSharedValue(1);

  useEffect(() => {
    getLocationPermission();
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

  const getLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        getCurrentLocation();
      }
    } catch (error) {
      console.log('Location permission error:', error);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.log('Location error:', error);
    }
  };

  const triggerHapticFeedback = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  };

  const handleEmergencyPress = async () => {
    if (!location) {
      Alert.alert(
        'Location Required',
        'Please enable location services to use the emergency features.',
        [{ text: 'OK' }]
      );
      return;
    }

    scaleValue.value = withSpring(0.95, { duration: 100 }, () => {
      scaleValue.value = withSpring(1, { duration: 200 });
    });

    triggerHapticFeedback();

    if (!isEmergencyActive) {
      try {
        await triggerEmergency('SOS', {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.timestamp
        });
      } catch (error) {
        Alert.alert('Error', error instanceof Error ? error.message : 'Failed to trigger emergency');
      }
    } else {
      Alert.alert(
        'Cancel Emergency',
        'Are you sure you want to cancel the emergency alert?',
        [
          { text: 'No', style: 'cancel' },
          {
            text: 'Yes',
            style: 'destructive',
            onPress: async () => {
              try {
                await cancelEmergency();
              } catch (error) {
                Alert.alert('Error', error instanceof Error ? error.message : 'Failed to cancel emergency');
              }
            }
          }
        ]
      );
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

          <View style={styles.infoSection}>
            {location && (
              <View style={styles.infoCard}>
                <MapPin size={16} color={colors.secondary[600]} />
                <Text style={styles.infoText}>
                  Location: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                </Text>
              </View>
            )}

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

          {/* AI Assistant Section */}
          <View style={styles.aiAssistantSection}>
            <Text style={styles.aiAssistantTitle}>Emergency Guidance</Text>
            <EmergencyAIAssistant />
          </View>
        </View>

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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emergencyStatus: {
    marginBottom: 40,
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
    marginBottom: 40,
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
  infoSection: {
    width: '100%',
    alignItems: 'center',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 16,
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
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
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
  footer: {
    alignItems: 'center',
    paddingBottom: 20,
    paddingHorizontal: 24,
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
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  closeMapButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 4,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 1,
  },
  closeMapButtonText: {
    color: colors.gray[900],
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  aiAssistantSection: {
    width: '100%',
    marginTop: 24,
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
});