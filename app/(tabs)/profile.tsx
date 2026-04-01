import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Switch, Alert, StatusBar, Linking, ActivityIndicator, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import useAuth from '@/hooks/useAuth';
import authService from '@/services/auth';
import { VisitStorage, OfflineQueue } from '@/services/localStorage';
export default function ProfileScreen() {
  const router = useRouter();
  const { user, loading: authLoading, signOut, enableBiometric, disableBiometric } = useAuth();
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [offlineMode, setOfflineMode] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // check current biometric setting
  React.useEffect(() => {
    const check = async () => {
      try {
        const enabled = await authService.isBiometricEnabled();
        setBiometricEnabled(enabled);
      } catch {}
    };
    check();
  }, []);

  // Load user preferences
  React.useEffect(() => {
    const loadPrefs = async () => {
      try {
        const prefs = await VisitStorage.getUserPreferences();
        if (prefs) {
          setOfflineMode(prefs.offlineMode || false);
          setNotificationsEnabled(prefs.notificationsEnabled || true);
          setDarkMode(prefs.darkMode || false);
        }
      } catch (error) {
        console.error('Error loading preferences:', error);
      }
    };
    loadPrefs();
  }, []);

  if (authLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0066cc" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>User not authenticated</Text>
      </View>
    );
  }

  const handleBiometricToggle = async (value: boolean) => {
    try {
      if (value) {
        await enableBiometric();
      } else {
        await disableBiometric();
      }
      setBiometricEnabled(value);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to toggle biometric');
    }
  };

  const handleOfflineModeToggle = async (value: boolean) => {
    try {
      const prefs = await VisitStorage.getUserPreferences() || {};
      prefs.offlineMode = value;
      await VisitStorage.setUserPreferences(prefs);
      setOfflineMode(value);
    } catch (error) {
      console.error('Error saving offline mode:', error);
      Alert.alert('Error', 'Failed to save offline mode preference');
    }
  };

  const handleNotificationsToggle = async (value: boolean) => {
    try {
      const prefs = await VisitStorage.getUserPreferences() || {};
      prefs.notificationsEnabled = value;
      await VisitStorage.setUserPreferences(prefs);
      setNotificationsEnabled(value);
    } catch (error) {
      console.error('Error saving notifications:', error);
      Alert.alert('Error', 'Failed to save notification preference');
    }
  };

  const handleDarkModeToggle = async (value: boolean) => {
    try {
      const prefs = await VisitStorage.getUserPreferences() || {};
      prefs.darkMode = value;
      await VisitStorage.setUserPreferences(prefs);
      setDarkMode(value);
    } catch (error) {
      console.error('Error saving dark mode:', error);
      Alert.alert('Error', 'Failed to save dark mode preference');
    }
  };

  const confirmSignOut = async () => {
    if (Platform.OS === 'web') {
      return window.confirm('Sign Out\n\nAre you sure you want to sign out?');
    }

    return new Promise<boolean>((resolve) => {
      Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
        { text: 'Sign Out', style: 'destructive', onPress: () => resolve(true) },
      ]);
    });
  };

  const handleSignOut = async () => {
    try {
      const proceed = await confirmSignOut();
      if (!proceed) return;

      await signOut();
      await VisitStorage.clearVisits();
      await OfflineQueue.clearQueue();
      router.replace('/(auth)/login');
    } catch (err: any) {
      console.error('Handle sign out error:', err);
      Alert.alert('Error', err.message || 'Failed to sign out. Please try again.');
    }
  };

  const menuSections = [
    {
      title: 'Account',
      items: [
        { icon: 'account-edit', label: 'Edit Profile', color: '#0066cc', onPress: () => Alert.alert('Edit Profile', 'Profile editing will be available soon.') },
        { icon: 'lock-reset', label: 'Change Password', color: '#7b1fa2', onPress: () => router.push('/(auth)/reset-password') },
        { icon: 'cellphone-key', label: 'OTP Settings', color: '#00796b', onPress: () => Alert.alert('OTP Settings', 'Configure your OTP preferences') },
      ],
    },
    {
      title: 'Security',
      items: [
        { icon: 'fingerprint', label: 'Fingerprint Login', color: '#e64a19', toggle: true, value: biometricEnabled, onToggle: handleBiometricToggle },
        { icon: 'shield-lock', label: 'Two-Factor Auth', color: '#1565c0', onPress: () => Alert.alert('2FA', 'Two-factor authentication settings') },
        { icon: 'history', label: 'Login History', color: '#f57c00', onPress: () => Alert.alert('Login History', 'View your recent login activity') },
      ],
    },
    {
      title: 'Preferences',
      items: [
        { icon: 'bell-ring', label: 'Notifications', color: '#2e7d32', toggle: true, value: notificationsEnabled, onToggle: handleNotificationsToggle },
        { icon: 'cloud-off-outline', label: 'Offline Mode', color: '#455a64', toggle: true, value: offlineMode, onToggle: handleOfflineModeToggle },
        { icon: 'theme-light-dark', label: 'Dark Mode', color: '#333', toggle: true, value: darkMode, onToggle: handleDarkModeToggle },
      ],
    },
    {
      title: 'Data & Reports',
      items: [
        { icon: 'file-download', label: 'Export My Reports', color: '#0066cc', onPress: () => Alert.alert('Export', 'Report export feature') },
        { icon: 'database-sync', label: 'Sync Data', color: '#00796b', onPress: () => Alert.alert('Sync', 'Data synchronization in progress...') },
        { icon: 'chart-timeline-variant', label: 'My Statistics', color: '#7b1fa2', onPress: () => router.push('/(tabs)/analytics') },
      ],
    },
    {
      title: 'Support',
      items: [
        { icon: 'help-circle', label: 'Help Center', color: '#0066cc', onPress: () => Alert.alert('Help', 'Contact support for assistance') },
        { icon: 'bug', label: 'Report a Bug', color: '#d32f2f', onPress: () => Alert.alert('Bug Report', 'Bug reporting feature') },
        { icon: 'information', label: 'About App', color: '#455a64', onPress: () => Alert.alert('About', 'Field Visit Tracker v2.0\nDistrict-Level Inspection Management\n\n© 2025') },
      ],
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(user?.full_name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
              </Text>
            </View>
            <View style={styles.avatarBadge}>
              <MaterialCommunityIcons name="check-circle" size={16} color="white" />
            </View>
          </View>
          <Text style={styles.userName}>{user?.full_name || 'Officer'}</Text>
          <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
          <View style={styles.roleChip}>
            <MaterialCommunityIcons name="shield-account" size={14} color="#0066cc" />
            <Text style={styles.roleText}>{user?.role?.replace('_', ' ').toUpperCase() || 'FIELD OFFICER'}</Text>
          </View>

          <View style={styles.profileStats}>
            <View style={styles.profileStat}>
              <MaterialCommunityIcons name="phone" size={16} color="#0066cc" />
              <Text style={styles.profileStatText}>{user?.phone || 'Not set'}</Text>
            </View>
            <View style={styles.profileStatDivider} />
            <View style={styles.profileStat}>
              <MaterialCommunityIcons name="domain" size={16} color="#0066cc" />
              <Text style={styles.profileStatText}>{user?.department || 'General'}</Text>
            </View>
            <View style={styles.profileStatDivider} />
            <View style={styles.profileStat}>
              <MaterialCommunityIcons name="map" size={16} color="#0066cc" />
              <Text style={styles.profileStatText}>{user?.zone || 'All Zones'}</Text>
            </View>
          </View>
        </View>

        {/* Quick Info Cards */}
        <View style={styles.infoRow}>
          <View style={[styles.infoCard, { backgroundColor: '#e3f2fd' }]}>
            <MaterialCommunityIcons name="calendar-check" size={22} color="#0066cc" />
            <Text style={styles.infoValue}>Active</Text>
            <Text style={styles.infoLabel}>Status</Text>
          </View>
          <View style={[styles.infoCard, { backgroundColor: '#e8f5e9' }]}>
            <MaterialCommunityIcons name="shield-check" size={22} color="#2e7d32" />
            <Text style={styles.infoValue}>Verified</Text>
            <Text style={styles.infoLabel}>Account</Text>
          </View>
          <View style={[styles.infoCard, { backgroundColor: '#fff3e0' }]}>
            <MaterialCommunityIcons name="clock-outline" size={22} color="#f57c00" />
            <Text style={styles.infoValue}>{user?.created_at ? new Date(user.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'New'}</Text>
            <Text style={styles.infoLabel}>Joined</Text>
          </View>
        </View>

        {/* Menu Sections */}
        {menuSections.map((section) => (
          <View key={section.title}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.menuCard}>
              {section.items.map((item, idx) => (
                <React.Fragment key={item.label}>
                  <TouchableOpacity
                    style={styles.menuRow}
                    onPress={'onPress' in item ? item.onPress : undefined}
                    activeOpacity={item.toggle ? 1 : 0.6}
                  >
                    <View style={[styles.menuIcon, { backgroundColor: item.color + '15' }]}>
                      <MaterialCommunityIcons name={item.icon as any} size={20} color={item.color} />
                    </View>
                    <Text style={styles.menuLabel}>{item.label}</Text>
                    {item.toggle ? (
                      <Switch
                        value={item.value}
                        onValueChange={item.onToggle}
                        trackColor={{ false: '#ddd', true: '#0066cc50' }}
                        thumbColor={item.value ? '#0066cc' : '#f0f0f0'}
                      />
                    ) : (
                      <MaterialCommunityIcons name="chevron-right" size={20} color="#ccc" />
                    )}
                  </TouchableOpacity>
                  {idx < section.items.length - 1 && <View style={styles.menuDivider} />}
                </React.Fragment>
              ))}
            </View>
          </View>
        ))}

        {/* Sign Out */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <MaterialCommunityIcons name="logout" size={20} color="#d32f2f" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Field Visit Tracker v2.0</Text>
        <Text style={styles.copyright}>© 2025 District Administration</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  scrollContent: { padding: 16, paddingTop: 50, paddingBottom: 30 },
  profileCard: { backgroundColor: 'white', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 3 },
  avatarContainer: { position: 'relative', marginBottom: 12 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#0066cc', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 28, fontWeight: '800', color: 'white' },
  avatarBadge: { position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, borderRadius: 12, backgroundColor: '#2e7d32', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: 'white' },
  userName: { fontSize: 22, fontWeight: '800', color: '#1a1a1a' },
  userEmail: { fontSize: 14, color: '#999', marginTop: 2 },
  roleChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, backgroundColor: '#e3f2fd', marginTop: 8 },
  roleText: { fontSize: 11, fontWeight: '700', color: '#0066cc' },
  profileStats: { flexDirection: 'row', alignItems: 'center', marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  profileStat: { flex: 1, alignItems: 'center', gap: 4 },
  profileStatText: { fontSize: 11, color: '#666', fontWeight: '500' },
  profileStatDivider: { width: 1, height: 28, backgroundColor: '#f0f0f0' },
  infoRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  infoCard: { flex: 1, borderRadius: 12, padding: 12, alignItems: 'center', gap: 4 },
  infoValue: { fontSize: 14, fontWeight: '700', color: '#333' },
  infoLabel: { fontSize: 10, color: '#999', fontWeight: '600' },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#999', marginBottom: 8, marginTop: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  menuCard: { backgroundColor: 'white', borderRadius: 14, marginBottom: 12, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  menuRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  menuIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '500', color: '#333' },
  menuDivider: { height: 1, backgroundColor: '#f5f5f5', marginLeft: 62 },
  signOutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, borderColor: '#ffcdd2', backgroundColor: '#fff5f5', marginTop: 8 },
  signOutText: { fontSize: 16, fontWeight: '700', color: '#d32f2f' },
  version: { textAlign: 'center', fontSize: 12, color: '#bbb', marginTop: 20 },
  copyright: { textAlign: 'center', fontSize: 11, color: '#ddd', marginTop: 4, marginBottom: 10 },
});
