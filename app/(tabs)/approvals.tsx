import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Alert, TextInput, Modal, StatusBar, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import useAuth from '@/hooks/useAuth';
import useVisits from '@/hooks/useVisits';
import { Visit } from '@/types';

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: string }> = {
  submitted: { color: '#0066cc', bg: '#e3f2fd', icon: 'send' },
  pending_approval: { color: '#f57c00', bg: '#fff3e0', icon: 'clock-outline' },
  approved: { color: '#2e7d32', bg: '#e8f5e9', icon: 'check-circle' },
  rejected: { color: '#d32f2f', bg: '#ffebee', icon: 'close-circle' },
  draft: { color: '#666', bg: '#f0f0f0', icon: 'file-edit' },
  completed: { color: '#1565c0', bg: '#e3f2fd', icon: 'flag-checkered' },
};

export default function ApprovalsScreen() {
  const { user, loading: authLoading } = useAuth();
  const { visits, loading, fetchVisits, approveVisit, rejectVisit } = useVisits(user?.id);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [approveComment, setApproveComment] = useState('');
  const [showDetailModal, setShowDetailModal] = useState(false);

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

  const pendingVisits = visits.filter(v => v.status === 'submitted' || v.status === 'pending_approval');
  const approvedVisits = visits.filter(v => v.status === 'approved' || v.status === 'completed');
  const rejectedVisits = visits.filter(v => v.status === 'rejected');

  const filteredVisits = filter === 'all' ? visits :
    filter === 'pending' ? pendingVisits :
    filter === 'approved' ? approvedVisits : rejectedVisits;

  const handleApprove = (visit: Visit) => {
    setSelectedVisit(visit);
    setApproveComment('');
    setShowApproveModal(true);
  };

  const confirmApprove = async () => {
    if (!selectedVisit) return;
    try {
      await approveVisit(selectedVisit.id, user?.id || '');
      Alert.alert('Approved', 'Visit has been approved with digital signature.');
      setShowApproveModal(false);
      fetchVisits();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to approve');
    }
  };

  const handleReject = (visit: Visit) => {
    setSelectedVisit(visit);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const confirmReject = async () => {
    if (!selectedVisit) return;
    if (!rejectReason.trim()) { Alert.alert('Required', 'Please provide a reason for rejection'); return; }
    try {
      await rejectVisit(selectedVisit.id, user?.id || '', rejectReason);
      Alert.alert('Rejected', 'Visit has been rejected.');
      setShowRejectModal(false);
      fetchVisits();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to reject');
    }
  };

  const viewDetail = (visit: Visit) => {
    setSelectedVisit(visit);
    setShowDetailModal(true);
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  const FILTERS: { key: typeof filter; label: string; count: number }[] = [
    { key: 'pending', label: 'Pending', count: pendingVisits.length },
    { key: 'approved', label: 'Approved', count: approvedVisits.length },
    { key: 'rejected', label: 'Rejected', count: rejectedVisits.length },
    { key: 'all', label: 'All', count: visits.length },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchVisits} tintColor="#0066cc" />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Approvals</Text>
          <Text style={styles.subtitle}>Review and manage field visit reports</Text>
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: '#fff3e0' }]}>
            <MaterialCommunityIcons name="clock-outline" size={20} color="#f57c00" />
            <Text style={styles.summaryNum}>{pendingVisits.length}</Text>
            <Text style={styles.summaryLabel}>Pending</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#e8f5e9' }]}>
            <MaterialCommunityIcons name="check-circle" size={20} color="#2e7d32" />
            <Text style={styles.summaryNum}>{approvedVisits.length}</Text>
            <Text style={styles.summaryLabel}>Approved</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#ffebee' }]}>
            <MaterialCommunityIcons name="close-circle" size={20} color="#d32f2f" />
            <Text style={styles.summaryNum}>{rejectedVisits.length}</Text>
            <Text style={styles.summaryLabel}>Rejected</Text>
          </View>
        </View>

        {/* Filter Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
              onPress={() => setFilter(f.key)}
            >
              <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>{f.label}</Text>
              <View style={[styles.filterBadge, filter === f.key && styles.filterBadgeActive]}>
                <Text style={[styles.filterBadgeText, filter === f.key && styles.filterBadgeTextActive]}>{f.count}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Visit List */}
        {filteredVisits.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="clipboard-check-outline" size={48} color="#ccc" />
            <Text style={styles.emptyTitle}>No {filter === 'all' ? '' : filter} visits</Text>
            <Text style={styles.emptySubtitle}>
              {filter === 'pending' ? 'All caught up! No pending approvals.' : 'No visits match this filter.'}
            </Text>
          </View>
        ) : (
          filteredVisits.map((visit) => {
            const cfg = STATUS_CONFIG[visit.status] || STATUS_CONFIG.draft;
            const isPending = visit.status === 'submitted' || visit.status === 'pending_approval';
            return (
              <TouchableOpacity key={visit.id} style={styles.visitCard} onPress={() => viewDetail(visit)} activeOpacity={0.7}>
                <View style={styles.visitHeader}>
                  <View style={[styles.statusIcon, { backgroundColor: cfg.bg }]}>
                    <MaterialCommunityIcons name={cfg.icon as any} size={18} color={cfg.color} />
                  </View>
                  <View style={styles.visitInfo}>
                    <Text style={styles.visitTitle} numberOfLines={1}>{visit.title}</Text>
                    <Text style={styles.visitMeta}>
                      <MaterialCommunityIcons name="map-marker" size={12} color="#999" /> {visit.location_name || 'Unknown'}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
                    <Text style={[styles.statusText, { color: cfg.color }]}>{visit.status.replace('_', ' ')}</Text>
                  </View>
                </View>

                <View style={styles.visitDetails}>
                  <View style={styles.visitDetailItem}>
                    <MaterialCommunityIcons name="calendar" size={14} color="#999" />
                    <Text style={styles.visitDetailText}>{formatDate(visit.created_at)}</Text>
                  </View>
                  <View style={styles.visitDetailItem}>
                    <MaterialCommunityIcons name="crosshairs-gps" size={14} color="#0066cc" />
                    <Text style={styles.visitDetailText}>{visit.latitude?.toFixed(4)}, {visit.longitude?.toFixed(4)}</Text>
                  </View>
                </View>

                {isPending && (
                  <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.rejectButton} onPress={() => handleReject(visit)}>
                      <MaterialCommunityIcons name="close" size={18} color="#d32f2f" />
                      <Text style={styles.rejectText}>Reject</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.approveButton} onPress={() => handleApprove(visit)}>
                      <MaterialCommunityIcons name="check" size={18} color="white" />
                      <Text style={styles.approveText}>Approve & Sign</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {visit.status === 'approved' && (
                  <View style={styles.signatureBar}>
                    <MaterialCommunityIcons name="draw-pen" size={14} color="#2e7d32" />
                    <Text style={styles.signatureText}>Digitally signed & verified</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Approve Modal */}
      <Modal visible={showApproveModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <MaterialCommunityIcons name="check-circle" size={32} color="#2e7d32" />
              <Text style={styles.modalTitle}>Approve Visit</Text>
            </View>
            <Text style={styles.modalVisitTitle}>{selectedVisit?.title}</Text>

            <View style={styles.signatureSection}>
              <MaterialCommunityIcons name="draw-pen" size={24} color="#0066cc" />
              <View>
                <Text style={styles.signatureLabel}>Digital Signature</Text>
                <Text style={styles.signatureInfo}>Signed by: {user?.full_name || 'Officer'}</Text>
                <Text style={styles.signatureInfo}>Role: {user?.role?.replace('_', ' ') || 'Official'}</Text>
                <Text style={styles.signatureInfo}>Date: {new Date().toLocaleDateString('en-IN')}</Text>
              </View>
            </View>

            <TextInput
              style={[styles.modalInput, styles.textArea]}
              placeholder="Add comments (optional)..."
              placeholderTextColor="#bbb"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              value={approveComment}
              onChangeText={setApproveComment}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowApproveModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalApprove} onPress={confirmApprove}>
                <MaterialCommunityIcons name="check" size={18} color="white" />
                <Text style={styles.modalApproveText}>Confirm Approval</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Reject Modal */}
      <Modal visible={showRejectModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <MaterialCommunityIcons name="close-circle" size={32} color="#d32f2f" />
              <Text style={styles.modalTitle}>Reject Visit</Text>
            </View>
            <Text style={styles.modalVisitTitle}>{selectedVisit?.title}</Text>
            <Text style={styles.label}>Reason for Rejection *</Text>
            <TextInput
              style={[styles.modalInput, styles.textArea]}
              placeholder="Explain why this visit is being rejected..."
              placeholderTextColor="#bbb"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={rejectReason}
              onChangeText={setRejectReason}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowRejectModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalApprove, { backgroundColor: '#d32f2f' }]} onPress={confirmReject}>
                <MaterialCommunityIcons name="close" size={18} color="white" />
                <Text style={styles.modalApproveText}>Reject Visit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Detail Modal */}
      <Modal visible={showDetailModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '80%' }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <MaterialCommunityIcons name="file-document" size={28} color="#0066cc" />
                <Text style={styles.modalTitle}>Visit Details</Text>
              </View>

              {selectedVisit && (
                <>
                  <Text style={styles.detailTitle}>{selectedVisit.title}</Text>
                  {selectedVisit.description ? <Text style={styles.detailDesc}>{selectedVisit.description}</Text> : null}

                  <View style={styles.detailGrid}>
                    <View style={styles.detailRow}>
                      <MaterialCommunityIcons name="map-marker" size={16} color="#0066cc" />
                      <Text style={styles.detailLabel}>Location</Text>
                      <Text style={styles.detailValue}>{selectedVisit.location_name}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <MaterialCommunityIcons name="crosshairs-gps" size={16} color="#0066cc" />
                      <Text style={styles.detailLabel}>Coordinates</Text>
                      <Text style={styles.detailValue}>{selectedVisit.latitude?.toFixed(6)}, {selectedVisit.longitude?.toFixed(6)}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <MaterialCommunityIcons name="calendar" size={16} color="#0066cc" />
                      <Text style={styles.detailLabel}>Visit Date</Text>
                      <Text style={styles.detailValue}>{formatDate(selectedVisit.visited_date)}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <MaterialCommunityIcons name="flag" size={16} color={(STATUS_CONFIG[selectedVisit.status] || STATUS_CONFIG.draft).color} />
                      <Text style={styles.detailLabel}>Status</Text>
                      <Text style={[styles.detailValue, { color: (STATUS_CONFIG[selectedVisit.status] || STATUS_CONFIG.draft).color, fontWeight: '700' }]}>
                        {selectedVisit.status.replace('_', ' ').toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  {selectedVisit.status === 'approved' && (
                    <View style={styles.signatureSection}>
                      <MaterialCommunityIcons name="draw-pen" size={24} color="#2e7d32" />
                      <View>
                        <Text style={styles.signatureLabel}>Digitally Signed</Text>
                        <Text style={styles.signatureInfo}>Verified and authenticated</Text>
                      </View>
                    </View>
                  )}
                </>
              )}
            </ScrollView>
            <TouchableOpacity style={styles.closeDetailButton} onPress={() => setShowDetailModal(false)}>
              <Text style={styles.closeDetailText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  scrollContent: { padding: 16, paddingTop: 50, paddingBottom: 30 },
  header: { marginBottom: 20 },
  title: { fontSize: 26, fontWeight: '800', color: '#1a1a1a' },
  subtitle: { fontSize: 13, color: '#999', marginTop: 2 },
  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  summaryCard: { flex: 1, borderRadius: 12, padding: 12, alignItems: 'center' },
  summaryNum: { fontSize: 22, fontWeight: '800', color: '#1a1a1a', marginTop: 4 },
  summaryLabel: { fontSize: 11, color: '#666', fontWeight: '600' },
  filterRow: { marginBottom: 16 },
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: '#f0f0f0', marginRight: 8 },
  filterChipActive: { backgroundColor: '#0066cc' },
  filterText: { fontSize: 13, color: '#666', fontWeight: '600' },
  filterTextActive: { color: 'white' },
  filterBadge: { backgroundColor: '#ddd', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 },
  filterBadgeActive: { backgroundColor: 'rgba(255,255,255,0.3)' },
  filterBadgeText: { fontSize: 11, fontWeight: '700', color: '#666' },
  filterBadgeTextActive: { color: 'white' },
  emptyState: { alignItems: 'center', paddingVertical: 50, backgroundColor: 'white', borderRadius: 14 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#999', marginTop: 12 },
  emptySubtitle: { fontSize: 13, color: '#bbb', marginTop: 4 },
  visitCard: { backgroundColor: 'white', borderRadius: 14, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  visitHeader: { flexDirection: 'row', alignItems: 'center' },
  statusIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  visitInfo: { flex: 1, marginRight: 8 },
  visitTitle: { fontSize: 15, fontWeight: '700', color: '#333' },
  visitMeta: { fontSize: 12, color: '#999', marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  visitDetails: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  visitDetailItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  visitDetailText: { fontSize: 12, color: '#999' },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  rejectButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 10, borderRadius: 8, borderWidth: 1.5, borderColor: '#ffcdd2' },
  rejectText: { fontSize: 13, fontWeight: '700', color: '#d32f2f' },
  approveButton: { flex: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 10, borderRadius: 8, backgroundColor: '#2e7d32' },
  approveText: { fontSize: 13, fontWeight: '700', color: 'white' },
  signatureBar: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  signatureText: { fontSize: 12, color: '#2e7d32', fontWeight: '600' },
  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: '70%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#333' },
  modalVisitTitle: { fontSize: 15, fontWeight: '600', color: '#666', marginBottom: 16, backgroundColor: '#f5f5f5', padding: 10, borderRadius: 8 },
  label: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 8 },
  modalInput: { borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 10, padding: 14, fontSize: 15, color: '#333', backgroundColor: '#fafafa' },
  textArea: { height: 100, textAlignVertical: 'top' },
  signatureSection: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#e8f5e9', borderRadius: 10, padding: 14, marginBottom: 16 },
  signatureLabel: { fontSize: 14, fontWeight: '700', color: '#2e7d32' },
  signatureInfo: { fontSize: 12, color: '#666', marginTop: 2 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  modalCancel: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1.5, borderColor: '#ddd', alignItems: 'center' },
  modalCancelText: { fontSize: 15, fontWeight: '700', color: '#666' },
  modalApprove: { flex: 1.5, flexDirection: 'row', paddingVertical: 12, borderRadius: 10, backgroundColor: '#2e7d32', alignItems: 'center', justifyContent: 'center', gap: 4 },
  modalApproveText: { fontSize: 15, fontWeight: '700', color: 'white' },
  // Detail modal
  detailTitle: { fontSize: 18, fontWeight: '800', color: '#333', marginBottom: 4 },
  detailDesc: { fontSize: 14, color: '#666', marginBottom: 16, lineHeight: 20 },
  detailGrid: { gap: 12, marginBottom: 16 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailLabel: { fontSize: 12, color: '#999', width: 85 },
  detailValue: { flex: 1, fontSize: 13, color: '#333', fontWeight: '500' },
  closeDetailButton: { alignItems: 'center', paddingVertical: 12, borderRadius: 10, backgroundColor: '#f0f0f0', marginTop: 12 },
  closeDetailText: { fontSize: 15, fontWeight: '700', color: '#666' },
});
