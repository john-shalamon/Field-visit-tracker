import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import useAuth from '@/hooks/useAuth';
import useVisits from '@/hooks/useVisits';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Visit } from '@/types';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { visits, loading, fetchVisits, error } = useVisits(user?.id);
  const [refreshing, setRefreshing] = React.useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchVisits();
    }, [fetchVisits])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchVisits();
    setRefreshing(false);
  };

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

  const getStatusIcon = (status: string) => {
    const icons: Record<string, string> = {
      draft: 'file-document',
      submitted: 'send',
      pending_approval: 'clock',
      approved: 'check-circle',
      rejected: 'alert-circle',
      completed: 'check-all',
    };
    return icons[status] || 'file';
  };

  const renderVisit = ({ item }: { item: Visit }) => (
    <TouchableOpacity
      style={styles.visitCard}
      onPress={() => router.push(`/visit/${item.id}`)}
    >
      <View style={styles.visitHeader}>
        <View style={styles.visitTitle}>
          <Text style={styles.visitName} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.visitLocation} numberOfLines={1}>
            {item.location_name}
          </Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) + '20' },
          ]}
        >
          <MaterialCommunityIcons
            name={getStatusIcon(item.status)}
            size={16}
            color={getStatusColor(item.status)}
          />
          <Text
            style={[
              styles.statusText,
              { color: getStatusColor(item.status) },
            ]}
          >
            {item.status.replace('_', ' ')}
          </Text>
        </View>
      </View>

      <View style={styles.visitFooter}>
        <Text style={styles.visitDate}>
          {new Date(item.visited_date).toLocaleDateString()}
        </Text>
        <MaterialCommunityIcons
          name="chevron-right"
          size={20}
          color="#0066cc"
        />
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Welcome, {user?.full_name}!</Text>
        <Text style={styles.subtitle}>
          {visits.length} visits | Role: {user?.role?.replace('_', ' ')}
        </Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{visits.length}</Text>
          <Text style={styles.statLabel}>Total Visits</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {visits.filter((v) => v.status === 'approved').length}
          </Text>
          <Text style={styles.statLabel}>Approved</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {visits.filter((v) => v.status === 'draft').length}
          </Text>
          <Text style={styles.statLabel}>Drafts</Text>
        </View>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error.message}</Text>
        </View>
      )}

      {visits.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="file-document-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No visits yet</Text>
          <Text style={styles.emptySubtext}>Create your first visit to get started</Text>
        </View>
      ) : (
        <FlatList
          data={visits}
          renderItem={renderVisit}
          keyExtractor={(item) => item.id}
          style={styles.listContainer}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#0066cc',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#ccc',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0066cc',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    marginHorizontal: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 10,
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  visitCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  visitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  visitTitle: {
    flex: 1,
  },
  visitName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  visitLocation: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  visitFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  visitDate: {
    fontSize: 12,
    color: '#999',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
});
