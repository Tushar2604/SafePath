import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { Shield, MapPin, Phone, Clock } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withRepeat, withTiming } from 'react-native-reanimated';

interface LocationData {
  latitude: number;
  longitude: number;
  timestamp: number;
}

export default function EmergencyScreen() {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isEmergencyActive, setIsEmergencyActive] = useState(false);
  const [emergencyStartTime, setEmergencyStartTime] = useState<Date | null>(null);
  
  const scaleValue = useSharedValue(1);
  const pulseValue = useSharedValue(1);

  useEffect(() => {
    getLocationPermission();
  }, []);

  useEffect(() => {
    if (isEmergencyActive) {
      // Start pulsing animation for emergency state
      pulseValue.value = withRepeat(
        withTiming(1.1, { duration: 1000 }),
        -1,
        true
      );
    } else {
      pulseValue.value = withTiming(1, { duration: 300 });
    }
  }, [isEmergencyActive]);

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

  const handleEmergencyPress = () => {
    scaleValue.value = withSpring(0.95, { duration: 100 }, () => {
      scaleValue.value = withSpring(1, { duration: 200 });
    });

    triggerHapticFeedback();

    if (!isEmergencyActive) {
      setIsEmergencyActive(true);
      setEmergencyStartTime(new Date());
      getCurrentLocation();
      
      // Simulate sending alerts
      Alert.alert(
        'Emergency Alert Sent',
        'Your emergency contacts have been notified with your current location.',
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert(
        'Cancel Emergency',
        'Are you sure you want to cancel the emergency alert?',
        [
          { text: 'No', style: 'cancel' },
          { 
            text: 'Yes', 
            style: 'destructive',
            onPress: () => {
              setIsEmergencyActive(false);
              setEmergencyStartTime(null);
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
                  { backgroundColor: isEmergencyActive ? colors.warning[500] : colors.primary[600] }
                ]}
                onPress={handleEmergencyPress}
                activeOpacity={0.8}
              >
                <Shield size={48} color={colors.white} strokeWidth={2.5} />
                <Text style={styles.buttonText}>
                  {isEmergencyActive ? 'CANCEL EMERGENCY' : 'EMERGENCY SOS'}
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
              <TouchableOpacity style={styles.quickActionButton}>
                <Phone size={20} color={colors.secondary[600]} />
                <Text style={styles.quickActionText}>Call 911</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: isEmergencyActive ? colors.white : colors.gray[500] }]}>
            Press and hold the emergency button to activate
          </Text>
        </View>
      </LinearGradient>
    </SafeAreaView>
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
});