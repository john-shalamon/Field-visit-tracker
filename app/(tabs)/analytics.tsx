import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import useAuth from '@/hooks/useAuth';
import analyticsService from '@/services/analytics';
import { AnalyticsData } from '@/types';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function AnalyticsScreen() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const fetchAnalytics = async () => {
    try {
      const data = await analyticsService.getAnalyticsDashboard(user?.id);
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [user?.id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAnalytics();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
      </View>
    );
  }

  if (!analytics) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Failed to load analytics</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Analytics Dashboard</Text>
        <Text style={styles.subtitle}>Performance metrics and insights</Text>
      </View>

      {/* Key Metrics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Key Metrics</Text>

        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <View style={[styles.metricIcon, styles.iconBlue]}>
              <MaterialCommunityIcons name="file-document" size={24} color="white" />
            </View>
            <Text style={styles.metricValue}>{analytics.total_visits}</Text>
            <Text style={styles.metricLabel}>Total Visits</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={[styles.metricIcon, styles.iconGreen]}>
              <MaterialCommunityIcons name="check-circle" size={24} color="white" />
            </View>
            <Text style={styles.metricValue}>{analytics.completed_visits}</Text>
            <Text style={styles.metricLabel}>Completed</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={[styles.metricIcon, styles.iconOrange]}>
              <MaterialCommunityIcons name="clock" size={24} color="white" />
            </View>
            <Text style={styles.metricValue}>{analytics.pending_approvals}</Text>
            <Text style={styles.metricLabel}>Pending</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={[styles.metricIcon, styles.iconRed]}>
              <MaterialCommunityIcons name="alert-circle" size={24} color="white" />
            </View>
            <Text style={styles.metricValue}>{analytics.rejection_rate.toFixed(1)}%</Text>
            <Text style={styles.metricLabel}>Rejection Rate</Text>
          </View>
        </View>
      </View>

      {/* Status Distribution */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Status Distribution</Text>

        {Object.entries(analytics.visits_by_status).map(([status, count]) => (
          <View key={status} style={styles.statusItem}>
            <View style={styles.statusLabel}>
              <Text style={styles.statusText}>{status.replace(/_/g, ' ')}</Text>
              <Text style={styles.statusCount}>{count}</Text>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(100, (count / analytics.total_visits) * 100)}%`,
                    backgroundColor: getStatusColor(status),
                  },
                ]}
              />
            </View>
          </View>
        ))}
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity (Last 7 Days)</Text>

        {analytics.visits_by_date.slice(0, 7).length === 0 ? (
          <Text style={styles.noDataText}>No activity in the last 7 days</Text>
        ) : (
          analytics.visits_by_date.slice(0, 7).map((item, index) => (
            <View key={index} style={styles.activityItem}>
              <Text style={styles.activityDate}>{new Date(item.date).toLocaleDateString()}</Text>
              <View style={styles.activityBar}>
                <View style={[styles.activityDot, { height: Math.max(20, item.count * 10) }]} />
              </View>
              <Text style={styles.activityCount}>{item.count}</Text>
            </View>
          ))
        )}
      </View>

      {/* Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Summary</Text>

        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Completion Rate</Text>
          <Text style={styles.summaryValue}>
            {analytics.total_visits > 0
              ? ((analytics.completed_visits / analytics.total_visits) * 100).toFixed(1)
              : 0}
            %
          </Text>
        </View>

        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Average Visits per Day</Text>
          <Text style={styles.summaryValue}>
            {analytics.visits_by_date.length > 0
              ? (analytics.total_visits / analytics.visits_by_date.length).toFixed(1)
              : 0}
          </Text>
        </View>

        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Pending Approvals</Text>
          <Text style={styles.summaryValue}>{analytics.pending_approvals}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    draft: '#999',
    submitted: '#ff9800',
    pending_approval: '#2196f3',
    approved: '#4caf50',
    rejected: '#f44336',
    completed: '#8bc34a',
  };
  return colors[status] || '#999';
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
  },
  header: {
    backgroundColor: '#0066cc',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#ccc',
  },
  section: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 8,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  metricIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconBlue: { backgroundColor: '#0066cc' },
  iconGreen: { backgroundColor: '#4caf50' },
  iconOrange: { backgroundColor: '#ff9800' },
  iconRed: { backgroundColor: '#f44336' },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
  },
  statusItem: {
    marginBottom: 16,
  },
  statusLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  statusText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  statusCount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0066cc',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 12,
    gap: 8,
  },
  activityDate: {
    fontSize: 12,
    color: '#666',
    width: 60,
  },
  activityBar: {
    flex: 1,
    height: 40,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingVertical: 4,
  },
  activityDot: {
    width: 20,
    backgroundColor: '#0066cc',
    borderRadius: 2,
  },
  activityCount: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    width: 30,
    textAlign: 'right',
  },
  noDataText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 20,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0066cc',
  },
});
