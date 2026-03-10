import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import useAuth from '@/hooks/useAuth';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut, enableBiometric, disableBiometric, biometricAuth } = useAuth();
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Sign Out',
        onPress: async () => {
          try {
            await signOut();
            router.replace('/(auth)/login');
          } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to sign out');
          }
        },
      },
    ]);
  };

  const handleBiometricToggle = async (value: boolean) => {
    setLoading(true);
    try {
      if (value) {
        // Test biometric authentication first
        const result = await biometricAuth();
        if (result.success) {
          await enableBiometric();
          setBiometricEnabled(true);
          Alert.alert('Success', 'Biometric authentication enabled');
        } else {
          Alert.alert('Error', 'Biometric authentication failed');
        }
      } else {
        await disableBiometric();
        setBiometricEnabled(false);
        Alert.alert('Success', 'Biometric authentication disabled');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update biometric settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* User Info Header */}
      <View style={styles.headerCard}>
        <View style={styles.profileIcon}>
          <MaterialCommunityIcons name="account-circle" size={64} color="#0066cc" />
        </View>

        <Text style={styles.userName}>{user?.full_name}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>

        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{user?.role?.replace('_', ' ').toUpperCase()}</Text>
        </View>
      </View>

      {/* Basic Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Basic Information</Text>

        <View style={styles.infoItem}>
          <View style={styles.infoLabelContainer}>
            <MaterialCommunityIcons name="phone" size={20} color="#0066cc" />
            <Text style={styles.infoLabel}>Phone</Text>
          </View>
          <Text style={styles.infoValue}>{user?.phone || 'Not provided'}</Text>
        </View>

        <View style={styles.infoItem}>
          <View style={styles.infoLabelContainer}>
            <MaterialCommunityIcons name="briefcase" size={20} color="#0066cc" />
            <Text style={styles.infoLabel}>Department</Text>
          </View>
          <Text style={styles.infoValue}>{user?.department || 'Not assigned'}</Text>
        </View>

        <View style={styles.infoItem}>
          <View style={styles.infoLabelContainer}>
            <MaterialCommunityIcons name="map-marker" size={20} color="#0066cc" />
            <Text style={styles.infoLabel}>Zone</Text>
          </View>
          <Text style={styles.infoValue}>{user?.zone || 'Not assigned'}</Text>
        </View>

        <View style={styles.infoItem}>
          <View style={styles.infoLabelContainer}>
            <MaterialCommunityIcons name="calendar" size={20} color="#0066cc" />
            <Text style={styles.infoLabel}>Member Since</Text>
          </View>
          <Text style={styles.infoValue}>
            {new Date(user?.created_at || '').toLocaleDateString()}
          </Text>
        </View>
      </View>

      {/* Security Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Security Settings</Text>

        <View style={styles.settingItem}>
          <View style={styles.settingLabelContainer}>
            <MaterialCommunityIcons name="fingerprint" size={20} color="#0066cc" />
            <Text style={styles.settingLabel}>Biometric Authentication</Text>
          </View>
          <Switch
            value={biometricEnabled}
            onValueChange={handleBiometricToggle}
            disabled={loading}
            trackColor={{ false: '#ccc', true: '#0066cc' }}
            thumbColor={biometricEnabled ? '#0066cc' : '#999'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingLabelContainer}>
            <MaterialCommunityIcons name="lock" size={20} color="#0066cc" />
            <Text style={styles.settingLabel}>Password</Text>
          </View>
          <TouchableOpacity>
            <Text style={styles.changeLink}>Change</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingLabelContainer}>
            <MaterialCommunityIcons name="shield-account" size={20} color="#0066cc" />
            <Text style={styles.settingLabel}>Account Status</Text>
          </View>
          <View style={[styles.statusBadge, user?.is_active && styles.activeBadge]}>
            <Text style={styles.statusText}>{user?.is_active ? 'Active' : 'Inactive'}</Text>
          </View>
        </View>
      </View>

      {/* App Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Information</Text>

        <View style={styles.infoItem}>
          <View style={styles.infoLabelContainer}>
            <MaterialCommunityIcons name="information" size={20} color="#0066cc" />
            <Text style={styles.infoLabel}>Version</Text>
          </View>
          <Text style={styles.infoValue}>1.0.0</Text>
        </View>

        <View style={styles.infoItem}>
          <View style={styles.infoLabelContainer}>
            <MaterialCommunityIcons name="file-document" size={20} color="#0066cc" />
            <Text style={styles.infoLabel}>Build</Text>
          </View>
          <Text style={styles.infoValue}>20240101</Text>
        </View>
      </View>

      {/* Help Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Help & Support</Text>

        <TouchableOpacity style={styles.actionItem}>
          <View style={styles.actionLabelContainer}>
            <MaterialCommunityIcons name="help-circle" size={20} color="#0066cc" />
            <Text style={styles.actionLabel}>Help & FAQ</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionItem}>
          <View style={styles.actionLabelContainer}>
            <MaterialCommunityIcons name="file-document-outline" size={20} color="#0066cc" />
            <Text style={styles.actionLabel}>Privacy Policy</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionItem}>
          <View style={styles.actionLabelContainer}>
            <MaterialCommunityIcons name="file-contract" size={20} color="#0066cc" />
            <Text style={styles.actionLabel}>Terms & Conditions</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#999" />
        </TouchableOpacity>
      </View>

      {/* Sign Out Button */}
      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <>
            <MaterialCommunityIcons name="logout" size={20} color="white" />
            <Text style={styles.signOutText}>Sign Out</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    paddingBottom: 40,
  },
  headerCard: {
    backgroundColor: '#0066cc',
    paddingVertical: 30,
    alignItems: 'center',
  },
  profileIcon: {
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 12,
  },
  roleBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  roleText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 8,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  infoLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#666',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  settingLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingLabel: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  changeLink: {
    color: '#0066cc',
    fontSize: 14,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#ffe0e0',
    borderRadius: 4,
  },
  activeBadge: {
    backgroundColor: '#e0ffe0',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  actionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  actionLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  actionLabel: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  signOutButton: {
    flexDirection: 'row',
    backgroundColor: '#f44336',
    marginHorizontal: 20,
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  signOutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
