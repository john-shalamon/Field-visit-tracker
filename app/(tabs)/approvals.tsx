import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import useAuth from '@/hooks/useAuth';
import useVisits from '@/hooks/useVisits';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Visit } from '@/types';

export default function ApprovalsScreen() {
  const { user } = useAuth();
  const { loading, getPendingApprovals, approveVisit, rejectVisit } = useVisits();
  const [pendingVisits, setPendingVisits] = useState<Visit[]>([]);
  const [refreshing, setRefreshing] = React.useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchPendingApprovals = useCallback(async () => {
    try {
      const data = await getPendingApprovals(user?.role || '');
      setPendingVisits(data);
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
    }
  }, [getPendingApprovals, user?.role]);

  useFocusEffect(
    useCallback(() => {
      fetchPendingApprovals();
    }, [fetchPendingApprovals])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPendingApprovals();
    setRefreshing(false);
  };

  const handleApprove = async (visitId: string) => {
    if (!user?.id) return;

    Alert.alert('Approve Visit', 'Are you sure you want to approve this visit?', [
      {
        text: 'Cancel',
        onPress: () => {},
      },
      {
        text: 'Approve',
        onPress: async () => {
          setActionLoading(visitId);
          try {
            await approveVisit(visitId, user.id);
            setPendingVisits(pendingVisits.filter((v) => v.id !== visitId));
            Alert.alert('Success', 'Visit approved successfully');
          } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to approve visit');
          } finally {
            setActionLoading(null);
          }
        },
      },
    ]);
  };

  const handleReject = async (visitId: string) => {
    if (!user?.id) return;

    Alert.prompt(
      'Reject Visit',
      'Please provide a reason for rejection:',
      [
        {
          text: 'Cancel',
          onPress: () => {},
        },
        {
          text: 'Reject',
          onPress: async (reason) => {
            if (!reason.trim()) {
              Alert.alert('Error', 'Please provide a reason for rejection');
              return;
            }
            setActionLoading(visitId);
            try {
              await rejectVisit(visitId, user.id, reason);
              setPendingVisits(pendingVisits.filter((v) => v.id !== visitId));
              Alert.alert('Success', 'Visit rejected successfully');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to reject visit');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const renderApprovalCard = ({ item }: { item: Visit }) => (
    <View style={styles.approvalCard}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitle}>
          <Text style={styles.visitName} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.visitLocation}>{item.location_name}</Text>
        </View>
        <MaterialCommunityIcons
          name="clock-outline"
          size={20}
          color="#ff9800"
        />
      </View>

      <View style={styles.cardDetails}>
        <Text style={styles.detailText}>
          <Text style={styles.detailLabel}>Submitted by: </Text>
          {item.user_id}
        </Text>
        <Text style={styles.detailText}>
          <Text style={styles.detailLabel}>Date: </Text>
          {new Date(item.visited_date).toLocaleDateString()}
        </Text>
        {item.description && (
          <Text style={styles.detailText} numberOfLines={2}>
            <Text style={styles.detailLabel}>Notes: </Text>
            {item.description}
          </Text>
        )}
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.rejectButton]}
          onPress={() => handleReject(item.id)}
          disabled={actionLoading === item.id}
        >
          {actionLoading === item.id ? (
            <ActivityIndicator color="#f44336" />
          ) : (
            <>
              <MaterialCommunityIcons
                name="close-circle"
                size={18}
                color="#f44336"
              />
              <Text style={styles.rejectButtonText}>Reject</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.approveButton]}
          onPress={() => handleApprove(item.id)}
          disabled={actionLoading === item.id}
        >
          {actionLoading === item.id ? (
            <ActivityIndicator color="#4caf50" />
          ) : (
            <>
              <MaterialCommunityIcons
                name="check-circle"
                size={18}
                color="#4caf50"
              />
              <Text style={styles.approveButtonText}>Approve</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
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
        <Text style={styles.title}>Pending Approvals</Text>
        <Text style={styles.subtitle}>
          {pendingVisits.length} visit{pendingVisits.length !== 1 ? 's' : ''} awaiting approval
        </Text>
      </View>

      {pendingVisits.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons
            name="clipboard-check-outline"
            size={64}
            color="#ccc"
          />
          <Text style={styles.emptyText}>All caught up!</Text>
          <Text style={styles.emptySubtext}>
            No visits pending approval at this time
          </Text>
        </View>
      ) : (
        <FlatList
          data={pendingVisits}
          renderItem={renderApprovalCard}
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
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  approvalCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardTitle: {
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
  cardDetails: {
    backgroundColor: '#f9f9f9',
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    color: '#666',
  },
  detailLabel: {
    fontWeight: '600',
    color: '#333',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  rejectButton: {
    backgroundColor: '#ffebee',
  },
  rejectButtonText: {
    color: '#f44336',
    fontWeight: '600',
    fontSize: 14,
  },
  approveButton: {
    backgroundColor: '#e8f5e9',
  },
  approveButtonText: {
    color: '#4caf50',
    fontWeight: '600',
    fontSize: 14,
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
