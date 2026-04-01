import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import useAuth from '@/hooks/useAuth';
import useVisits from '@/hooks/useVisits';
import { Visit } from '@/types';

export default function CollectorScreen() {
  const router = useRouter();
  const { user, loading, isOfficer } = useAuth();
  const { visits, loading: visitsLoading, fetchVisits, submitVisit, updateVisit } = useVisits(user?.id, user?.role);
  const [localLoading, setLocalLoading] = useState(false);
  const [assignedVisits, setAssignedVisits] = useState<Visit[]>([]);

  useEffect(() => {
    if (!user) return;
    if (!isOfficer()) {
      Alert.alert('Access Denied', 'Collector role required', [{ text: 'OK', onPress: () => router.replace('/(tabs)/home') }]);
      return;
    }
    fetchVisits();
  }, [user]);

  useEffect(() => {
    const assigned = visits.filter((v) => !v.assigned_to || v.assigned_to === user?.id);
    setAssignedVisits(assigned);
  }, [visits, user]);

  const handleAssignToMe = async (visitId: string) => {
    if (!user?.id) return;
    setLocalLoading(true);
    try {
      await updateVisit(visitId, { assigned_to: user.id, status: 'submitted' });
      await fetchVisits();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Unable to assign visit');
    } finally {
      setLocalLoading(false);
    }
  };

  const handleComplete = async (visitId: string) => {
    setLocalLoading(true);
    try {
      await updateVisit(visitId, { status: 'completed' });
      await fetchVisits();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Unable to complete visit');
    } finally {
      setLocalLoading(false);
    }
  };

  if (loading || visitsLoading) {
    return (
      <View style={{ flex:1, justifyContent:'center', alignItems:'center' }}>
        <ActivityIndicator size="large" color="#0066cc" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={{ flex:1, justifyContent:'center', alignItems:'center' }}>
        <Text>User not authenticated</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Collector Dashboard</Text>
      <Text style={styles.subtitle}>Assigned visits for your zone</Text>

      {assignedVisits.length === 0 ? (
        <Text style={styles.empty}>No assigned visits yet.</Text>
      ) : (
        assignedVisits.map((visit) => (
          <View key={visit.id} style={styles.card}>
            <Text style={styles.visitTitle}>{visit.title}</Text>
            <Text style={styles.visitText}>Status: {visit.status.replace('_', ' ')}</Text>
            <Text style={styles.visitText}>Location: {visit.location_name}</Text>
            <Text style={styles.visitText}>Visit Date: {new Date(visit.visited_date).toLocaleDateString()}</Text>
            <View style={styles.buttonRow}>
              {visit.status !== 'completed' && (
                <TouchableOpacity style={styles.actionButton} onPress={() => handleComplete(visit.id)} disabled={localLoading}>
                  <Text style={styles.actionText}>Mark Completed</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.actionButton} onPress={() => handleAssignToMe(visit.id)} disabled={localLoading || visit.assigned_to === user.id}>
                <Text style={styles.actionText}>{visit.assigned_to === user.id ? 'Assigned to You' : 'Assign to Me'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#f4f6fb', paddingBottom: 30 },
  title: { fontSize: 26, fontWeight: '800', color: '#1a1a1a', marginBottom: 4 },
  subtitle: { color: '#666', marginBottom: 16 },
  empty: { fontSize: 14, color: '#999', marginTop: 12, textAlign: 'center' },
  card: { backgroundColor: 'white', borderRadius: 14, padding: 14, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  visitTitle: { fontSize: 16, fontWeight: '700', color: '#333' },
  visitText: { fontSize: 13, color: '#666', marginTop: 4 },
  buttonRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  actionButton: { flex: 1, paddingVertical: 9, borderRadius: 8, backgroundColor: '#0066cc', alignItems: 'center' },
  actionText: { color: 'white', fontWeight: '700', fontSize: 13 },
});
