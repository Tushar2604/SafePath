import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { User, Bell, Shield, MapPin, Phone, Settings, LogOut, ChevronRight } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { LocationNotificationTest } from '../components/LocationNotificationTest';
import { RequireAuth } from '../components/RequireAuth';
import { useAuth } from '../contexts/AuthContext';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [emergencyModeEnabled, setEmergencyModeEnabled] = useState(false);
  const [testModalVisible, setTestModalVisible] = useState(false);

  const ProfileSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );

  const SettingItem = ({
    icon,
    title,
    subtitle,
    onPress,
    rightElement
  }: {
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
  }) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingIcon}>
        {icon}
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {rightElement || <ChevronRight size={20} color={colors.gray[400]} />}
    </TouchableOpacity>
  );

  const handleLogout = async () => {
    try {
      await logout();
      console.log('Logout successful');
    } catch (error) {
      Alert.alert(
        'Logout Failed',
        error instanceof Error ? error.message : 'Failed to sign out. Please try again.'
      );
    }
  };

  return (
    <RequireAuth fallbackMessage="Please sign in to access your profile and settings">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile & Settings</Text>
          <Text style={styles.subtitle}>Manage your SafePath account</Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.profileCard}>
            <View style={styles.avatar}>
              <User size={32} color={colors.gray[600]} />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.displayName || 'User'}</Text>
              <Text style={styles.profileEmail}>{user?.email || 'No email'}</Text>
              <Text style={styles.profileStatus}>Emergency contacts: 3 active</Text>
            </View>
            <TouchableOpacity style={styles.editButton}>
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          </View>

          <ProfileSection title="Emergency Settings">
            <SettingItem
              icon={<Bell size={20} color={colors.secondary[600]} />}
              title="Emergency Notifications"
              subtitle="Get alerts when contacts need help"
              rightElement={
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                  trackColor={{ false: colors.gray[300], true: colors.secondary[200] }}
                  thumbColor={notificationsEnabled ? colors.secondary[600] : colors.gray[500]}
                />
              }
            />

            <SettingItem
              icon={<MapPin size={20} color={colors.success[600]} />}
              title="Location Services"
              subtitle="Required for emergency location sharing"
              rightElement={
                <Switch
                  value={locationEnabled}
                  onValueChange={setLocationEnabled}
                  trackColor={{ false: colors.gray[300], true: colors.success[200] }}
                  thumbColor={locationEnabled ? colors.success[600] : colors.gray[500]}
                />
              }
            />

            <SettingItem
              icon={<Shield size={20} color={colors.primary[600]} />}
              title="Emergency Mode"
              subtitle="Enhanced emergency features"
              rightElement={
                <Switch
                  value={emergencyModeEnabled}
                  onValueChange={setEmergencyModeEnabled}
                  trackColor={{ false: colors.gray[300], true: colors.primary[200] }}
                  thumbColor={emergencyModeEnabled ? colors.primary[600] : colors.gray[500]}
                />
              }
            />
          </ProfileSection>

          <ProfileSection title="Quick Actions">
            <SettingItem
              icon={<Phone size={20} color={colors.success[600]} />}
              title="Test Emergency Contacts"
              subtitle="Send a test message to your contacts"
              onPress={() => console.log('Test contacts')}
            />

            <SettingItem
              icon={<MapPin size={20} color={colors.secondary[600]} />}
              title="Update Location"
              subtitle="Refresh your current location"
              onPress={() => console.log('Update location')}
            />

            <SettingItem
              icon={<Bell size={20} color={colors.primary[600]} />}
              title="Test Location & Notifications"
              subtitle="Verify location tracking and notifications"
              onPress={() => setTestModalVisible(true)}
            />
          </ProfileSection>

          <ProfileSection title="App Settings">
            <SettingItem
              icon={<Settings size={20} color={colors.gray[600]} />}
              title="General Settings"
              subtitle="App preferences and configuration"
              onPress={() => console.log('General settings')}
            />

            <SettingItem
              icon={<Shield size={20} color={colors.gray[600]} />}
              title="Privacy & Security"
              subtitle="Data protection and privacy settings"
              onPress={() => console.log('Privacy settings')}
            />
          </ProfileSection>

          <View style={styles.dangerZone}>
            <Text style={styles.dangerZoneTitle}>Account</Text>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <LogOut size={20} color={colors.primary[600]} />
              <Text style={styles.logoutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.appInfo}>
            <Text style={styles.appInfoText}>SafePath v1.0.0</Text>
            <Text style={styles.appInfoText}>Emergency Response App</Text>
          </View>

          <Modal
            animationType="slide"
            transparent={true}
            visible={testModalVisible}
            onRequestClose={() => setTestModalVisible(false)}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <LocationNotificationTest />
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setTestModalVisible(false)}
                >
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
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
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: colors.gray[900],
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: colors.gray[600],
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 20,
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 24,
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: colors.gray[900],
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.gray[600],
    marginBottom: 4,
  },
  profileStatus: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: colors.success[600],
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gray[300],
  },
  editButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: colors.gray[700],
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: colors.gray[900],
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 8,
    elevation: 1,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: colors.gray[900],
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: colors.gray[600],
  },
  dangerZone: {
    marginTop: 8,
    marginBottom: 32,
  },
  dangerZoneTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: colors.gray[900],
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  logoutText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: colors.primary[600],
    marginLeft: 12,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 20,
  },
  appInfoText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: colors.gray[500],
    marginBottom: 2,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  closeButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: colors.primary[600],
    borderRadius: 10,
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});