import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import useAuth from '@/hooks/useAuth';
import useVisits from '@/hooks/useVisits';
import authService from '@/services/auth';
import { User, UserRole, Visit } from '@/types';

const AVAILABLE_ROLES: UserRole[] = ['field_officer', 'field_visitor', 'collector', 'hod', 'admin'];

export default function AdminScreen() {
  const router = useRouter();
  const { user, loading, isAdmin } = useAuth();
  const { getAllVisits, assignVisit } = useVisits(user?.id, user?.role);
  const [users, setUsers] = useState<User[]>([]);
  const [allVisits, setAllVisits] = useState<Visit[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (!isAdmin()) {
      Alert.alert('Access Denied', 'Admin access required.', [{ text: 'OK', onPress: () => router.replace('/(tabs)/home') }]);
      return;
    }

    fetchUsers();
    fetchAllVisits();
  }, [user]);

  const fetchUsers = async () => {
    setRefreshing(true);
    try {
      const result = await authService.getAllUsers();
      if (result.error) throw result.error;
      setUsers(result.data);
    } catch (err: any) {
      console.error('Fetch users error:', err);
      Alert.alert('Error', err.message || 'Failed to load users');
    } finally {
      setRefreshing(false);
    }
  };

  const fetchAllVisits = async () => {
    setRefreshing(true);
    try {
      const visits = await getAllVisits();
      setAllVisits(visits);
    } catch (err: any) {
      console.error('Fetch visits error:', err);
      Alert.alert('Error', err.message || 'Failed to load visits');
    } finally {
      setRefreshing(false);
    }
  };

  const handleAssignVisit = async (visitId: string, collectorId: string) => {
    if (!user) return;
    try {
      await assignVisit(visitId, collectorId, user.id, user.role);
      await fetchAllVisits();
      Alert.alert('Assigned', 'Visit assigned successfully');
    } catch (err: any) {
      console.error('Assign visit failed:', err);
      Alert.alert('Error', err.message || 'Failed to assign visit');
    }
  };


  const handleChangeRole = async (userId: string, role: UserRole) => {
    try {
      const result = await authService.updateUserRole(userId, role);
      if (result.error) throw result.error;
      setUsers((prev) => prev.map((u) => (u.id === userId ? (result.data as User) : u)));
      Alert.alert('Role Updated', `User role changed to ${role}`);
    } catch (err: any) {
      console.error('Change role error:', err);
      Alert.alert('Error', err.message || 'Failed to change role');
    }
  };

  if (!user || loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0066cc" />
      </View>
    );
  }

  if (!isAdmin()) {
    return null;
  }

  return (
    <ScrollView contentContainerStyle={styles.container} refreshControl={undefined}>
      <Text style={styles.title}>Admin Panel</Text>
      <Text style={styles.subtitle}>User Management & Role Assignment</Text>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: '#e8f5e9' }]}>
          <Text style={styles.statValue}>{users.length}</Text>
          <Text style={styles.statLabel}>Total Users</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#e3f2fd' }]}>
          <Text style={styles.statValue}>{users.filter((u) => u.role === 'field_officer').length}</Text>
          <Text style={styles.statLabel}>Officers</Text>
        </View>
      </View>

      {refreshing ? (
        <ActivityIndicator size="large" color="#0066cc" />
      ) : (
        users.map((u) => (
          <View key={u.id} style={styles.userCard}>
            <View style={styles.userHeader}>
              <Text style={styles.userName}>{u.full_name || u.email}</Text>
              <Text style={styles.userRole}>{u.role.replace('_', ' ').toUpperCase()}</Text>
            </View>
            <Text style={styles.userEmail}>{u.email}</Text>
            <View style={styles.roleRow}>
              <Text style={styles.roleChange}>Change role:</Text>
              <View style={styles.roleButtons}>
                {AVAILABLE_ROLES.map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.roleButton, u.role === r && styles.roleButtonActive]}
                    onPress={() => handleChangeRole(u.id, r)}
                  >
                    <Text style={[styles.roleButtonText, u.role === r && styles.roleButtonTextActive]}>
                      {r.replace('_', ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        ))
      )}

      <View style={styles.sectionDivider} />
      <Text style={[styles.subtitle, { marginTop: 8 }]}>Visit Assignment</Text>
      {allVisits.length === 0 ? (
        <Text style={styles.empty}>No visits available for assignment.</Text>
      ) : (
        allVisits.map((visit) => (
          <View key={visit.id} style={styles.userCard}>
            <View style={styles.userHeader}>
              <Text style={styles.userName}>{visit.title}</Text>
              <Text style={styles.userRole}>{visit.status.replace('_', ' ')}</Text>
            </View>
            <Text style={styles.userEmail}>Location: {visit.location_name}</Text>
            <Text style={styles.userEmail}>Assigned to: {visit.assigned_to || 'Unassigned'}</Text>
            <Text style={styles.userEmail}>Added by: {visit.user_id}</Text>
            <View style={styles.roleRow}>
              <Text style={styles.roleChange}>Assign to collector:</Text>
              <View style={styles.roleButtons}>
                {users
                  .filter((u) => u.role === 'collector')
                  .map((collector) => (
                    <TouchableOpacity
                      key={collector.id}
                      style={[
                        styles.roleButton,
                        visit.assigned_to === collector.id && styles.roleButtonActive,
                      ]}
                      onPress={() => handleAssignVisit(visit.id, collector.id)}
                    >
                      <Text
                        style={[
                          styles.roleButtonText,
                          visit.assigned_to === collector.id && styles.roleButtonTextActive,
                        ]}
                      >
                        {collector.full_name || collector.email}
                      </Text>
                    </TouchableOpacity>
                  ))}
              </View>
            </View>
          </View>
        ))
      )}

      <TouchableOpacity style={styles.refreshButton} onPress={() => { fetchUsers(); fetchAllVisits(); }}>
        <Text style={styles.refreshText}>Refresh Users & Visits</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#f5f7fa', paddingBottom: 30 },
  title: { fontSize: 26, fontWeight: '800', color: '#1a1a1a', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#666', marginBottom: 16 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: { flex: 1, borderRadius: 12, padding: 12, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 12, color: '#666' },
  userCard: { backgroundColor: 'white', borderRadius: 12, padding: 14, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  userHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  userName: { fontSize: 16, fontWeight: '700', color: '#333' },
  userRole: { fontSize: 12, color: '#00796b', fontWeight: '600' },
  userEmail: { fontSize: 12, color: '#666', marginBottom: 10 },
  roleRow: { flexDirection: 'column', gap: 8, marginTop: 8 },
  roleChange: { fontSize: 12, color: '#555', fontWeight: '600' },
  roleButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  roleButton: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, borderColor: '#ccc' },
  roleButtonActive: { backgroundColor: '#0066cc', borderColor: '#005bb5' },
  roleButtonText: { fontSize: 12, color: '#333' },
  roleButtonTextActive: { color: 'white' },
  sectionDivider: { height: 1, backgroundColor: '#e0e0e0', marginVertical: 12 },
  empty: { fontSize: 14, color: '#999', marginTop: 12, textAlign: 'center' },
  refreshButton: { padding: 12, borderRadius: 10, backgroundColor: '#0066cc', alignItems: 'center', marginTop: 10 },
  refreshText: { color: 'white', fontWeight: '700' },
});
