import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, RefreshControl, StatusBar, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import useVisits from '@/hooks/useVisits';
import useAuth from '@/hooks/useAuth';

const { width } = Dimensions.get('window');

const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
  draft: { color: '#9e9e9e', bg: '#f5f5f5' },
  submitted: { color: '#2196f3', bg: '#e3f2fd' },
  pending_approval: { color: '#ff9800', bg: '#fff3e0' },
  approved: { color: '#4caf50', bg: '#e8f5e9' },
  rejected: { color: '#f44336', bg: '#ffebee' },
  completed: { color: '#1565c0', bg: '#e3f2fd' },
};

export default function AnalyticsScreen() {
  const { user, loading: authLoading } = useAuth();
  const { visits, loading, fetchVisits } = useVisits(user?.id);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('month');

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

  const now = new Date();
  const filteredVisits = visits.filter(v => {
    if (timeRange === 'all') return true;
    const d = new Date(v.created_at);
    if (timeRange === 'week') return (now.getTime() - d.getTime()) < 7 * 86400000;
    return (now.getTime() - d.getTime()) < 30 * 86400000;
  });

  const stats = {
    total: filteredVisits.length,
    approved: filteredVisits.filter(v => v.status === 'approved' || v.status === 'completed').length,
    pending: filteredVisits.filter(v => v.status === 'pending_approval' || v.status === 'submitted').length,
    rejected: filteredVisits.filter(v => v.status === 'rejected').length,
    drafts: filteredVisits.filter(v => v.status === 'draft').length,
  };

  const completionRate = stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0;
  const rejectionRate = stats.total > 0 ? Math.round((stats.rejected / stats.total) * 100) : 0;
  const avgPerDay = stats.total > 0 ? (stats.total / (timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : Math.max(1, Math.ceil((now.getTime() - new Date(visits[visits.length - 1]?.created_at || now).getTime()) / 86400000)))).toFixed(1) : '0';

  // Status distribution for bar chart
  const statusData = [
    { label: 'Draft', count: stats.drafts, color: '#9e9e9e' },
    { label: 'Submitted', count: filteredVisits.filter(v => v.status === 'submitted').length, color: '#2196f3' },
    { label: 'Pending', count: filteredVisits.filter(v => v.status === 'pending_approval').length, color: '#ff9800' },
    { label: 'Approved', count: stats.approved, color: '#4caf50' },
    { label: 'Rejected', count: stats.rejected, color: '#f44336' },
  ];
  const maxCount = Math.max(1, ...statusData.map(d => d.count));

  // Weekly trend (last 7 days)
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d;
  });
  const weeklyData = weekDays.map(day => {
    const dayStr = day.toISOString().split('T')[0];
    return {
      day: day.toLocaleDateString('en', { weekday: 'short' }),
      count: visits.filter(v => v.created_at.startsWith(dayStr)).length,
    };
  });
  const maxWeekly = Math.max(1, ...weeklyData.map(d => d.count));

  // Location distribution
  const locationMap: Record<string, number> = {};
  filteredVisits.forEach(v => {
    const loc = v.location_name?.split(',')[0]?.trim() || 'Unknown';
    locationMap[loc] = (locationMap[loc] || 0) + 1;
  });
  const topLocations = Object.entries(locationMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchVisits} tintColor="#0066cc" />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Analytics</Text>
          <Text style={styles.subtitle}>Performance insights & visit statistics</Text>
        </View>

        {/* Time Range */}
        <View style={styles.rangeRow}>
          {(['week', 'month', 'all'] as const).map((r) => (
            <TouchableOpacity
              key={r}
              style={[styles.rangeChip, timeRange === r && styles.rangeChipActive]}
              onPress={() => setTimeRange(r)}
            >
              <Text style={[styles.rangeText, timeRange === r && styles.rangeTextActive]}>
                {r === 'week' ? '7 Days' : r === 'month' ? '30 Days' : 'All Time'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* KPI Cards */}
        <View style={styles.kpiGrid}>
          <View style={[styles.kpiCard, { borderLeftColor: '#0066cc' }]}>
            <Text style={styles.kpiNumber}>{stats.total}</Text>
            <Text style={styles.kpiLabel}>Total Visits</Text>
            <Text style={styles.kpiSub}>{avgPerDay}/day avg</Text>
          </View>
          <View style={[styles.kpiCard, { borderLeftColor: '#4caf50' }]}>
            <Text style={styles.kpiNumber}>{completionRate}%</Text>
            <Text style={styles.kpiLabel}>Approval Rate</Text>
            <Text style={styles.kpiSub}>{stats.approved} approved</Text>
          </View>
          <View style={[styles.kpiCard, { borderLeftColor: '#ff9800' }]}>
            <Text style={styles.kpiNumber}>{stats.pending}</Text>
            <Text style={styles.kpiLabel}>Pending</Text>
            <Text style={styles.kpiSub}>Awaiting review</Text>
          </View>
          <View style={[styles.kpiCard, { borderLeftColor: '#f44336' }]}>
            <Text style={styles.kpiNumber}>{rejectionRate}%</Text>
            <Text style={styles.kpiLabel}>Rejection Rate</Text>
            <Text style={styles.kpiSub}>{stats.rejected} rejected</Text>
          </View>
        </View>

        {/* Completion Ring */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Overall Completion</Text>
          <View style={styles.ringContainer}>
            <View style={styles.ringOuter}>
              <View style={styles.ringInner}>
                <Text style={styles.ringPercent}>{completionRate}%</Text>
                <Text style={styles.ringLabel}>Complete</Text>
              </View>
            </View>
            <View style={styles.ringLegend}>
              <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#4caf50' }]} /><Text style={styles.legendText}>Approved ({stats.approved})</Text></View>
              <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#ff9800' }]} /><Text style={styles.legendText}>Pending ({stats.pending})</Text></View>
              <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#f44336' }]} /><Text style={styles.legendText}>Rejected ({stats.rejected})</Text></View>
              <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#9e9e9e' }]} /><Text style={styles.legendText}>Draft ({stats.drafts})</Text></View>
            </View>
          </View>
        </View>

        {/* Status Distribution Bar Chart */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Status Distribution</Text>
          {statusData.map((d) => (
            <View key={d.label} style={styles.barRow}>
              <Text style={styles.barLabel}>{d.label}</Text>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${(d.count / maxCount) * 100}%`, backgroundColor: d.color }]} />
              </View>
              <Text style={styles.barCount}>{d.count}</Text>
            </View>
          ))}
        </View>

        {/* Weekly Trend */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Weekly Activity</Text>
          <View style={styles.chartContainer}>
            {weeklyData.map((d, i) => (
              <View key={i} style={styles.chartCol}>
                <Text style={styles.chartCount}>{d.count}</Text>
                <View style={styles.chartBarTrack}>
                  <View style={[styles.chartBar, { height: `${(d.count / maxWeekly) * 100}%` }]} />
                </View>
                <Text style={styles.chartDay}>{d.day}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Top Locations */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Top Locations</Text>
          {topLocations.length === 0 ? (
            <Text style={styles.noData}>No location data available</Text>
          ) : (
            topLocations.map(([loc, count], i) => (
              <View key={loc} style={styles.locRow}>
                <View style={styles.locRank}>
                  <Text style={styles.locRankText}>{i + 1}</Text>
                </View>
                <View style={styles.locInfo}>
                  <Text style={styles.locName} numberOfLines={1}>{loc}</Text>
                  <View style={styles.locBarTrack}>
                    <View style={[styles.locBarFill, { width: `${(count / (topLocations[0]?.[1] || 1)) * 100}%` }]} />
                  </View>
                </View>
                <Text style={styles.locCount}>{count}</Text>
              </View>
            ))
          )}
        </View>

        {/* Summary */}
        <View style={[styles.card, { backgroundColor: '#f0f7ff', borderWidth: 1, borderColor: '#d0e3f7' }]}>
          <Text style={styles.cardTitle}>Performance Summary</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <MaterialCommunityIcons name="trending-up" size={20} color="#4caf50" />
              <Text style={styles.summaryValue}>{avgPerDay}</Text>
              <Text style={styles.summaryLabel}>Visits/Day</Text>
            </View>
            <View style={styles.summaryItem}>
              <MaterialCommunityIcons name="clock-fast" size={20} color="#ff9800" />
              <Text style={styles.summaryValue}>{stats.pending}</Text>
              <Text style={styles.summaryLabel}>In Queue</Text>
            </View>
            <View style={styles.summaryItem}>
              <MaterialCommunityIcons name="check-all" size={20} color="#0066cc" />
              <Text style={styles.summaryValue}>{completionRate}%</Text>
              <Text style={styles.summaryLabel}>Success</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  scrollContent: { padding: 16, paddingTop: 50, paddingBottom: 30 },
  header: { marginBottom: 16 },
  title: { fontSize: 26, fontWeight: '800', color: '#1a1a1a' },
  subtitle: { fontSize: 13, color: '#999', marginTop: 2 },
  rangeRow: { flexDirection: 'row', backgroundColor: '#e8ecef', borderRadius: 10, padding: 4, marginBottom: 20 },
  rangeChip: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  rangeChipActive: { backgroundColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  rangeText: { fontSize: 13, color: '#999', fontWeight: '600' },
  rangeTextActive: { color: '#0066cc' },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  kpiCard: { width: (width - 42) / 2, backgroundColor: 'white', borderRadius: 12, padding: 14, borderLeftWidth: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  kpiNumber: { fontSize: 28, fontWeight: '800', color: '#1a1a1a' },
  kpiLabel: { fontSize: 13, fontWeight: '600', color: '#666', marginTop: 2 },
  kpiSub: { fontSize: 11, color: '#999', marginTop: 2 },
  card: { backgroundColor: 'white', borderRadius: 14, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 14 },
  // Ring chart
  ringContainer: { flexDirection: 'row', alignItems: 'center' },
  ringOuter: { width: 100, height: 100, borderRadius: 50, borderWidth: 10, borderColor: '#4caf50', justifyContent: 'center', alignItems: 'center', marginRight: 20 },
  ringInner: { alignItems: 'center' },
  ringPercent: { fontSize: 22, fontWeight: '800', color: '#333' },
  ringLabel: { fontSize: 11, color: '#999' },
  ringLegend: { flex: 1, gap: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, color: '#666' },
  // Bar chart
  barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  barLabel: { width: 70, fontSize: 12, color: '#666', fontWeight: '500' },
  barTrack: { flex: 1, height: 20, backgroundColor: '#f0f0f0', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: 20, borderRadius: 4, minWidth: 4 },
  barCount: { width: 28, fontSize: 13, fontWeight: '700', color: '#333', textAlign: 'right' },
  // Weekly chart
  chartContainer: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 140 },
  chartCol: { alignItems: 'center', flex: 1, height: '100%', justifyContent: 'flex-end' },
  chartCount: { fontSize: 10, color: '#999', fontWeight: '600', marginBottom: 4 },
  chartBarTrack: { width: 20, flex: 1, backgroundColor: '#f0f0f0', borderRadius: 4, overflow: 'hidden', justifyContent: 'flex-end' },
  chartBar: { width: 20, backgroundColor: '#0066cc', borderRadius: 4, minHeight: 4 },
  chartDay: { fontSize: 10, color: '#999', marginTop: 4, fontWeight: '600' },
  // Locations
  locRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 },
  locRank: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#e3f2fd', justifyContent: 'center', alignItems: 'center' },
  locRankText: { fontSize: 11, fontWeight: '700', color: '#0066cc' },
  locInfo: { flex: 1 },
  locName: { fontSize: 13, fontWeight: '600', color: '#333', marginBottom: 4 },
  locBarTrack: { height: 6, backgroundColor: '#f0f0f0', borderRadius: 3, overflow: 'hidden' },
  locBarFill: { height: 6, backgroundColor: '#0066cc', borderRadius: 3 },
  locCount: { fontSize: 14, fontWeight: '700', color: '#333' },
  noData: { fontSize: 13, color: '#bbb', textAlign: 'center', paddingVertical: 16 },
  // Summary
  summaryGrid: { flexDirection: 'row', justifyContent: 'space-around' },
  summaryItem: { alignItems: 'center', gap: 4 },
  summaryValue: { fontSize: 20, fontWeight: '800', color: '#1a1a1a' },
  summaryLabel: { fontSize: 11, color: '#666', fontWeight: '600' },
});
