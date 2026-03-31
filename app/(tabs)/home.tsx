import React, { useCallback, useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl,
  Dimensions, ScrollView, StatusBar, ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import useAuth from '@/hooks/useAuth';
import useVisits from '@/hooks/useVisits';
import { Visit } from '@/types';

const { width } = Dimensions.get('window');

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: string }> = {
  draft: { color: '#666', bg: '#f0f0f0', icon: 'file-edit' },
  submitted: { color: '#0066cc', bg: '#e3f2fd', icon: 'send' },
  pending_approval: { color: '#f57c00', bg: '#fff3e0', icon: 'clock-outline' },
  approved: { color: '#2e7d32', bg: '#e8f5e9', icon: 'check-circle' },
  rejected: { color: '#d32f2f', bg: '#ffebee', icon: 'close-circle' },
  completed: { color: '#1565c0', bg: '#e3f2fd', icon: 'flag-checkered' },
};

export default function HomeScreen() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { visits, loading, fetchVisits, syncing, offlineQueueLength, syncOfflineData } = useVisits(user?.id);
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening');
  }, []);

  useFocusEffect(useCallback(() => { fetchVisits(); }, []));

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

  const stats = {
    total: visits.length,
    approved: visits.filter(v => v.status === 'approved' || v.status === 'completed').length,
    pending: visits.filter(v => v.status === 'pending_approval' || v.status === 'submitted').length,
    rejected: visits.filter(v => v.status === 'rejected').length,
    drafts: visits.filter(v => v.status === 'draft').length,
    completionRate: visits.length > 0 ? Math.round((visits.filter(v => v.status === 'completed' || v.status === 'approved').length / visits.length) * 100) : 0,
  };

  const recentVisits = [...visits].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 10);

  const quickActions = [
    { icon: 'plus-circle', label: 'New Visit', color: '#0066cc', route: '/(tabs)/create' },
    { icon: 'clipboard-check', label: 'Approvals', color: '#f57c00', route: '/(tabs)/approvals' },
    { icon: 'chart-bar', label: 'Reports', color: '#7b1fa2', route: '/(tabs)/analytics' },
    { icon: 'account', label: 'Profile', color: '#00796b', route: '/(tabs)/profile' },
  ];

  const formatDate = (d: string) => {
    const date = new Date(d);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 172800000) return 'Yesterday';
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const renderVisitItem = ({ item }: { item: Visit }) => {
    const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.draft;
    return (
      <TouchableOpacity
        style={styles.visitCard}
        onPress={() => router.push({ pathname: '/(tabs)/visit-detail', params: { id: item.id } })}
        activeOpacity={0.7}
      >
        <View style={styles.visitHeader}>
          <View style={[styles.statusDot, { backgroundColor: cfg.color }]} />
          <View style={styles.visitInfo}>
            <Text style={styles.visitTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.visitLocation} numberOfLines={1}>
              <MaterialCommunityIcons name="map-marker" size={12} color="#999" /> {item.location_name || 'No location'}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
            <MaterialCommunityIcons name={cfg.icon as any} size={12} color={cfg.color} />
            <Text style={[styles.statusText, { color: cfg.color }]}>{item.status.replace('_', ' ')}</Text>
          </View>
        </View>
        <View style={styles.visitFooter}>
          <Text style={styles.visitDate}>
            <MaterialCommunityIcons name="calendar" size={12} color="#bbb" /> {formatDate(item.created_at)}
          </Text>
          <View style={styles.geoTag}>
            <MaterialCommunityIcons name="crosshairs-gps" size={12} color="#0066cc" />
            <Text style={styles.geoText}>{item.latitude?.toFixed(4)}, {item.longitude?.toFixed(4)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f7fa" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchVisits} tintColor="#0066cc" />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting} 👋</Text>
            <Text style={styles.userName}>{user?.full_name || 'Officer'}</Text>
            <Text style={styles.roleTag}>{user?.role?.replace('_', ' ').toUpperCase() || 'FIELD OFFICER'}</Text>
          </View>
          <View style={styles.headerButtons}>
            {offlineQueueLength > 0 && (
              <TouchableOpacity
                style={[styles.syncButton, syncing && styles.syncButtonDisabled]}
                onPress={syncOfflineData}
                disabled={syncing}
              >
                <MaterialCommunityIcons
                  name={syncing ? "sync" : "sync-off"}
                  size={20}
                  color={syncing ? "#999" : "#0066cc"}
                />
                <Text style={[styles.syncText, syncing && styles.syncTextDisabled]}>
                  {syncing ? 'Syncing...' : `${offlineQueueLength} pending`}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.notifButton}
              onPress={() => router.push('/(tabs)/approvals')}
            >
              <MaterialCommunityIcons name="bell-outline" size={24} color="#333" />
              {stats.pending > 0 && (
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeText}>{stats.pending}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: '#e3f2fd' }]}>
            <MaterialCommunityIcons name="clipboard-list" size={24} color="#0066cc" />
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total Visits</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#e8f5e9' }]}>
            <MaterialCommunityIcons name="check-circle" size={24} color="#2e7d32" />
            <Text style={styles.statNumber}>{stats.approved}</Text>
            <Text style={styles.statLabel}>Approved</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#fff3e0' }]}>
            <MaterialCommunityIcons name="clock-outline" size={24} color="#f57c00" />
            <Text style={styles.statNumber}>{stats.pending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#ffebee' }]}>
            <MaterialCommunityIcons name="close-circle" size={24} color="#d32f2f" />
            <Text style={styles.statNumber}>{stats.rejected}</Text>
            <Text style={styles.statLabel}>Rejected</Text>
          </View>
        </View>

        {/* Completion Rate */}
        <View style={styles.completionCard}>
          <View style={styles.completionHeader}>
            <Text style={styles.completionTitle}>Completion Rate</Text>
            <Text style={styles.completionPercent}>{stats.completionRate}%</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${stats.completionRate}%` }]} />
          </View>
          <View style={styles.completionFooter}>
            <Text style={styles.completionSub}>{stats.approved} of {stats.total} visits completed</Text>
            <Text style={styles.completionSub}>{stats.drafts} drafts</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsRow}>
          {quickActions.map((a) => (
            <TouchableOpacity
              key={a.label}
              style={styles.actionButton}
              onPress={() => router.push(a.route as any)}
            >
              <View style={[styles.actionIcon, { backgroundColor: a.color + '15' }]}>
                <MaterialCommunityIcons name={a.icon as any} size={24} color={a.color} />
              </View>
              <Text style={styles.actionLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Visits */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Visits</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        {recentVisits.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="map-marker-plus" size={48} color="#ccc" />
            <Text style={styles.emptyTitle}>No visits yet</Text>
            <Text style={styles.emptySubtitle}>Create your first field visit to get started</Text>
            <TouchableOpacity style={styles.emptyButton} onPress={() => router.push('/(tabs)/create')}>
              <MaterialCommunityIcons name="plus" size={18} color="white" />
              <Text style={styles.emptyButtonText}>Create Visit</Text>
            </TouchableOpacity>
          </View>
        ) : (
          recentVisits.map((visit) => (
            <View key={visit.id}>{renderVisitItem({ item: visit })}</View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  scrollContent: { padding: 16, paddingTop: 50 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  headerButtons: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  syncButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f8ff', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, gap: 4 },
  syncButtonDisabled: { backgroundColor: '#f5f5f5' },
  syncText: { fontSize: 11, color: '#0066cc', fontWeight: '600' },
  syncTextDisabled: { color: '#999' },
  greeting: { fontSize: 14, color: '#999' },
  userName: { fontSize: 24, fontWeight: '800', color: '#1a1a1a', marginTop: 2 },
  roleTag: { fontSize: 11, color: '#0066cc', fontWeight: '700', marginTop: 4, backgroundColor: '#e3f2fd', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start' },
  notifButton: { padding: 8, marginTop: 4 },
  notifBadge: { position: 'absolute', top: 4, right: 4, backgroundColor: '#d32f2f', width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  notifBadgeText: { color: 'white', fontSize: 10, fontWeight: '800' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  statCard: { width: (width - 42) / 2, borderRadius: 14, padding: 14, gap: 4 },
  statNumber: { fontSize: 28, fontWeight: '800', color: '#1a1a1a' },
  statLabel: { fontSize: 12, color: '#666', fontWeight: '600' },
  completionCard: { backgroundColor: 'white', borderRadius: 14, padding: 16, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  completionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  completionTitle: { fontSize: 15, fontWeight: '700', color: '#333' },
  completionPercent: { fontSize: 18, fontWeight: '800', color: '#0066cc' },
  progressBarBg: { height: 8, backgroundColor: '#e0e0e0', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: 8, backgroundColor: '#0066cc', borderRadius: 4 },
  completionFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  completionSub: { fontSize: 11, color: '#999' },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#333', marginBottom: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  seeAll: { fontSize: 13, color: '#0066cc', fontWeight: '600' },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  actionButton: { alignItems: 'center', width: (width - 64) / 4 },
  actionIcon: { width: 52, height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  actionLabel: { fontSize: 11, color: '#666', fontWeight: '600' },
  visitCard: { backgroundColor: 'white', borderRadius: 12, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  visitHeader: { flexDirection: 'row', alignItems: 'center' },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  visitInfo: { flex: 1, marginRight: 8 },
  visitTitle: { fontSize: 15, fontWeight: '700', color: '#333' },
  visitLocation: { fontSize: 12, color: '#999', marginTop: 2 },
  statusBadge: { flexDirection: 'row', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, alignItems: 'center', gap: 4 },
  statusText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  visitFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  visitDate: { fontSize: 11, color: '#bbb' },
  geoTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  geoText: { fontSize: 10, color: '#0066cc', fontWeight: '500' },
  emptyState: { alignItems: 'center', paddingVertical: 40, backgroundColor: 'white', borderRadius: 14, marginTop: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#999', marginTop: 12 },
  emptySubtitle: { fontSize: 13, color: '#bbb', marginTop: 4, marginBottom: 16 },
  emptyButton: { flexDirection: 'row', backgroundColor: '#0066cc', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, alignItems: 'center', gap: 6 },
  emptyButtonText: { color: 'white', fontWeight: '700' },
});
