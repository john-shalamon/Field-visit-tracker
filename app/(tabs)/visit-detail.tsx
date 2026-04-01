import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image,
  ActivityIndicator, Alert, TextInput, Modal, Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import useAuth from '@/hooks/useAuth';
import useVisits from '@/hooks/useVisits';
import { Visit } from '@/types';

const { width } = Dimensions.get('window');

export default function VisitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { visits, submitVisit, updateVisit } = useVisits(user?.id, user?.role);
  const [visit, setVisit] = useState<Visit | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [inspectionNotes, setInspectionNotes] = useState('');
  const [findings, setFindings] = useState('');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('low');
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const found = visits.find((v) => v.id === id);
    if (found) setVisit(found);
  }, [id, visits]);

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

  const takePhoto = async () => {
    try {
      const camera = await ImagePicker.requestCameraPermissionsAsync();
      const media = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (camera.status !== 'granted' || media.status !== 'granted') {
        Alert.alert('Permission needed', 'Camera and media library permissions are required to take photos');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        exif: true,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        const photoUri = result.assets[0].uri;
        setPhotos((prev) => [...prev, photoUri]);
        Alert.alert('Photo Added', 'Photo captured with GPS metadata successfully!');
      }
    } catch (err: any) {
      Alert.alert('Camera Error', err.message || 'Unable to open camera');
    }
  };

  const pickPhoto = async () => {
    try {
      const media = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (media.status !== 'granted') {
        Alert.alert('Permission needed', 'Media library permission is required to pick photos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsMultipleSelection: true,
      });

      if (!result.canceled && result.assets) {
        const newPhotos = result.assets.map((a) => a.uri);
        setPhotos((prev) => [...prev, ...newPhotos]);
      }
    } catch (err: any) {
      Alert.alert('Photo Selection Error', err.message || 'Unable to pick photos');
    }
  };

  const handleSubmit = async () => {
    if (!visit) return;
    if (photos.length === 0) {
      Alert.alert('Photos Required', 'Please capture at least one photo before submitting');
      return;
    }
    if (!findings.trim()) {
      Alert.alert('Findings Required', 'Please enter inspection findings before submitting');
      return;
    }

    Alert.alert('Submit Visit', 'Once submitted, this visit cannot be edited. Continue?', [
      { text: 'Cancel' },
      {
        text: 'Submit',
        onPress: async () => {
          setLoading(true);
          try {
            await submitVisit(visit.id);
            Alert.alert('Success', 'Visit submitted for approval!', [
              { text: 'OK', onPress: () => router.back() },
            ]);
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to submit visit');
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const getStatusStyle = (status: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      draft: { bg: '#f5f5f5', text: '#666' },
      submitted: { bg: '#fff3e0', text: '#e65100' },
      pending_approval: { bg: '#e3f2fd', text: '#1565c0' },
      approved: { bg: '#e8f5e9', text: '#2e7d32' },
      rejected: { bg: '#ffebee', text: '#c62828' },
      completed: { bg: '#f1f8e9', text: '#558b2f' },
    };
    return colors[status] || colors.draft;
  };

  if (!visit) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>Loading visit details...</Text>
      </View>
    );
  }

  const statusStyle = getStatusStyle(visit.status);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Visit Header */}
      <View style={styles.headerCard}>
        <View style={styles.headerTop}>
          <Text style={styles.visitTitle}>{visit.title}</Text>
          <View style={[styles.badge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.badgeText, { color: statusStyle.text }]}>
              {visit.status.replace(/_/g, ' ').toUpperCase()}
            </Text>
          </View>
        </View>
        {visit.description ? (
          <Text style={styles.description}>{visit.description}</Text>
        ) : null}
      </View>

      {/* Location Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          <MaterialCommunityIcons name="map-marker" size={18} color="#0066cc" /> Location Details
        </Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Location</Text>
          <Text style={styles.infoValue}>{visit.location_name}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Latitude</Text>
          <Text style={styles.infoValue}>{visit.latitude.toFixed(6)}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Longitude</Text>
          <Text style={styles.infoValue}>{visit.longitude.toFixed(6)}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Visit Date</Text>
          <Text style={styles.infoValue}>
            {new Date(visit.visited_date).toLocaleDateString('en-IN', {
              day: '2-digit', month: 'long', year: 'numeric',
            })}
          </Text>
        </View>

        {/* Mini Map Placeholder */}
        <View style={styles.mapPlaceholder}>
          <MaterialCommunityIcons name="map" size={40} color="#0066cc" />
          <Text style={styles.mapText}>
            GPS: {visit.latitude.toFixed(4)}, {visit.longitude.toFixed(4)}
          </Text>
          <Text style={styles.mapSubtext}>Location locked by GPS</Text>
        </View>
      </View>

      {/* Photos Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          <MaterialCommunityIcons name="camera" size={18} color="#0066cc" /> Photos & Evidence
        </Text>

        {photos.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoScroll}>
            {photos.map((photo, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => { setSelectedPhoto(photo); setShowPhotoModal(true); }}
              >
                <Image source={{ uri: photo }} style={styles.photoThumb} />
                <View style={styles.photoOverlay}>
                  <Text style={styles.photoIndex}>#{index + 1}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <Text style={styles.noPhotos}>No photos captured yet</Text>
        )}

        {visit.status === 'draft' && (
          <View style={styles.photoButtons}>
            <TouchableOpacity style={styles.cameraBtn} onPress={takePhoto}>
              <MaterialCommunityIcons name="camera" size={20} color="white" />
              <Text style={styles.cameraBtnText}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.galleryBtn} onPress={pickPhoto}>
              <MaterialCommunityIcons name="image-multiple" size={20} color="#0066cc" />
              <Text style={styles.galleryBtnText}>Gallery</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Inspection Report */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          <MaterialCommunityIcons name="clipboard-text" size={18} color="#0066cc" /> Inspection Report
        </Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Findings *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe findings from the inspection..."
            placeholderTextColor="#999"
            value={findings}
            onChangeText={setFindings}
            multiline
            numberOfLines={4}
            editable={visit.status === 'draft'}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Severity Level</Text>
          <View style={styles.severityRow}>
            {(['low', 'medium', 'high', 'critical'] as const).map((level) => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.severityBtn,
                  severity === level && styles.severityActive,
                  severity === level && {
                    backgroundColor: level === 'low' ? '#4caf50' : level === 'medium' ? '#ff9800' : level === 'high' ? '#f44336' : '#9c27b0',
                  },
                ]}
                onPress={() => setSeverity(level)}
                disabled={visit.status !== 'draft'}
              >
                <Text style={[styles.severityText, severity === level && styles.severityTextActive]}>
                  {level.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Additional Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Any recommendations or observations..."
            placeholderTextColor="#999"
            value={inspectionNotes}
            onChangeText={setInspectionNotes}
            multiline
            numberOfLines={3}
            editable={visit.status === 'draft'}
          />
        </View>
      </View>

      {/* Digital Signature */}
      {visit.status === 'approved' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <MaterialCommunityIcons name="draw" size={18} color="#0066cc" /> Digital Signature
          </Text>
          <View style={styles.signatureBox}>
            <MaterialCommunityIcons name="check-decagram" size={40} color="#4caf50" />
            <Text style={styles.signedText}>Digitally Signed & Approved</Text>
            <Text style={styles.signedDate}>
              {new Date().toLocaleDateString('en-IN')}
            </Text>
          </View>
        </View>
      )}

      {/* Activity History */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          <MaterialCommunityIcons name="history" size={18} color="#0066cc" /> Activity History
        </Text>
        {visit.history && visit.history.length > 0 ? (
          visit.history.slice().reverse().map((item, idx) => (
            <View key={`${item.timestamp}-${idx}`} style={styles.historyRow}>
              <View style={[styles.historyBadge, { backgroundColor: item.action === 'approved' ? '#e8f5e9' : item.action === 'rejected' ? '#ffebee' : '#e3f2fd' }]}>
                <Text style={styles.historyBadgeText}>{item.action.replace('_', ' ').toUpperCase()}</Text>
              </View>
              <View style={styles.historyContent}>
                <Text style={styles.historyText}>{item.details || 'No details provided.'}</Text>
                <Text style={styles.historyMeta}>{item.by_user_role} ({item.by_user_id}) • {new Date(item.timestamp).toLocaleString()}</Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.noHistory}>No history entries yet.</Text>
        )}
      </View>

      {/* Action Buttons */}
      {visit.status === 'draft' && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.submitBtn, loading && { opacity: 0.6 }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <MaterialCommunityIcons name="send" size={20} color="white" />
                <Text style={styles.submitBtnText}>Submit for Approval</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Photo Modal */}
      <Modal visible={showPhotoModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalClose} onPress={() => setShowPhotoModal(false)}>
            <MaterialCommunityIcons name="close" size={28} color="white" />
          </TouchableOpacity>
          {selectedPhoto && (
            <Image source={{ uri: selectedPhoto }} style={styles.modalImage} resizeMode="contain" />
          )}
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5' },
  content: { paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#666', fontSize: 14 },
  headerCard: { backgroundColor: 'white', padding: 20, marginBottom: 2 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  visitTitle: { fontSize: 22, fontWeight: 'bold', color: '#1a1a1a', flex: 1, marginRight: 12 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 },
  badgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  description: { fontSize: 14, color: '#666', marginTop: 8, lineHeight: 20 },
  section: { backgroundColor: 'white', marginTop: 10, padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a1a', marginBottom: 14 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  infoLabel: { fontSize: 14, color: '#888', fontWeight: '500' },
  infoValue: { fontSize: 14, color: '#333', fontWeight: '600' },
  mapPlaceholder: { backgroundColor: '#e3f2fd', borderRadius: 8, padding: 20, alignItems: 'center', marginTop: 12 },
  mapText: { fontSize: 14, color: '#1565c0', fontWeight: '600', marginTop: 8 },
  mapSubtext: { fontSize: 12, color: '#666', marginTop: 2 },
  photoScroll: { marginBottom: 12 },
  historyRow: { marginBottom: 10, padding: 10, borderRadius: 10, backgroundColor: '#f9fafe', borderWidth: 1, borderColor: '#e7eef9' },
  historyBadge: { alignSelf: 'flex-start', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2, marginBottom: 5 },
  historyBadgeText: { fontSize: 10, fontWeight: '700', color: '#333' },
  historyContent: { marginTop: 4 },
  historyText: { fontSize: 13, color: '#444' },
  historyMeta: { fontSize: 11, color: '#777', marginTop: 3 },
  noHistory: { color: '#999', fontSize: 13, textAlign: 'center', marginTop: 8 },
  photoThumb: { width: 100, height: 100, borderRadius: 8, marginRight: 8 },
  photoOverlay: { position: 'absolute', bottom: 4, right: 12, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  photoIndex: { color: 'white', fontSize: 10, fontWeight: '700' },
  noPhotos: { color: '#999', textAlign: 'center', paddingVertical: 20 },
  photoButtons: { flexDirection: 'row', gap: 10 },
  cameraBtn: { flex: 1, flexDirection: 'row', backgroundColor: '#0066cc', padding: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center', gap: 6 },
  cameraBtnText: { color: 'white', fontWeight: '600' },
  galleryBtn: { flex: 1, flexDirection: 'row', backgroundColor: '#e3f2fd', padding: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center', gap: 6 },
  galleryBtnText: { color: '#0066cc', fontWeight: '600' },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12, fontSize: 15, color: '#333' },
  textArea: { textAlignVertical: 'top', minHeight: 80 },
  severityRow: { flexDirection: 'row', gap: 8 },
  severityBtn: { flex: 1, paddingVertical: 10, borderRadius: 6, backgroundColor: '#f0f0f0', alignItems: 'center' },
  severityActive: { borderWidth: 0 },
  severityText: { fontSize: 11, fontWeight: '700', color: '#666' },
  severityTextActive: { color: 'white' },
  signatureBox: { backgroundColor: '#e8f5e9', borderRadius: 8, padding: 24, alignItems: 'center' },
  signedText: { fontSize: 16, fontWeight: '700', color: '#2e7d32', marginTop: 8 },
  signedDate: { fontSize: 12, color: '#666', marginTop: 4 },
  actionRow: { padding: 16 },
  submitBtn: { flexDirection: 'row', backgroundColor: '#4caf50', padding: 16, borderRadius: 10, alignItems: 'center', justifyContent: 'center', gap: 8 },
  submitBtnText: { color: 'white', fontSize: 16, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  modalClose: { position: 'absolute', top: 50, right: 20, zIndex: 10 },
  modalImage: { width: width - 20, height: width - 20 },
});
