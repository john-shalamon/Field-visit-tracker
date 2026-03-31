import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, Image, Platform, StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import useAuth from '@/hooks/useAuth';
import useVisits from '@/hooks/useVisits';

type Severity = 'low' | 'medium' | 'high' | 'critical';

export default function CreateVisitScreen() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { createVisit, loading } = useVisits(user?.id);

  // Visit info
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0]);
  const [visitType, setVisitType] = useState('routine');

  // Location
  const [locationLoading, setLocationLoading] = useState(false);
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [address, setAddress] = useState('');
  const [locationCaptured, setLocationCaptured] = useState(false);
  const [accuracy, setAccuracy] = useState<number | null>(null);

  // Photos
  const [photos, setPhotos] = useState<{ uri: string; timestamp: string }[]>([]);

  // Inspection
  const [showInspection, setShowInspection] = useState(false);
  const [findings, setFindings] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [severity, setSeverity] = useState<Severity>('low');
  const [inspectionType, setInspectionType] = useState('general');

  // if auth is still initializing, show indicator
  if (authLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0066cc" />
      </View>
    );
  }

  // user must be present to proceed
  if (!user) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 16, color: '#333' }}>User not authenticated</Text>
      </View>
    );
  }

  const VISIT_TYPES = [
    { value: 'routine', label: 'Routine', icon: 'calendar-check' },
    { value: 'surprise', label: 'Surprise', icon: 'lightning-bolt' },
    { value: 'follow_up', label: 'Follow-up', icon: 'refresh' },
    { value: 'complaint', label: 'Complaint', icon: 'alert-circle' },
  ];

  const INSPECTION_TYPES = ['General', 'Infrastructure', 'Service Delivery', 'Compliance', 'Safety', 'Financial'];
  const SEVERITIES: { value: Severity; label: string; color: string; icon: string }[] = [
    { value: 'low', label: 'Low', color: '#4caf50', icon: 'information' },
    { value: 'medium', label: 'Medium', color: '#ff9800', icon: 'alert' },
    { value: 'high', label: 'High', color: '#f44336', icon: 'alert-circle' },
    { value: 'critical', label: 'Critical', color: '#b71c1c', icon: 'alert-octagon' },
  ];

  useEffect(() => {
    captureLocation();
  }, []);

  const captureLocation = async () => {
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required for geo-tagging');
        setLocationLoading(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLatitude(loc.coords.latitude.toString());
      setLongitude(loc.coords.longitude.toString());
      setAccuracy(loc.coords.accuracy);
      setLocationCaptured(true);

      try {
        const [addr] = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
        if (addr) {
          setAddress([addr.street, addr.city, addr.region, addr.postalCode].filter(Boolean).join(', '));
        }
      } catch {}
    } catch (err: any) {
      Alert.alert('Location Error', err.message || 'Failed to capture location');
    }
    setLocationLoading(false);
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera permission is needed to take photos');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotos([...photos, { uri: result.assets[0].uri, timestamp: new Date().toISOString() }]);
    }
  };

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.8,
      allowsMultipleSelection: true,
      mediaTypes: 'images',
    });
    if (!result.canceled) {
      const newPhotos = result.assets.map(a => ({ uri: a.uri, timestamp: new Date().toISOString() }));
      setPhotos([...photos, ...newPhotos]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleSubmit = async (asDraft: boolean) => {
    if (!title.trim()) { Alert.alert('Error', 'Visit title is required'); return; }
    if (!locationCaptured) { Alert.alert('Error', 'Please capture GPS location first'); return; }
    if (!user?.id) { Alert.alert('Error', 'You must be logged in to submit a visit'); return; }

    try {
      await createVisit({
        title: title.trim(),
        description: description.trim() || undefined,
        location_name: address || 'Unknown Location',
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        visited_date: visitDate,
      });
      Alert.alert(
        asDraft ? 'Draft Saved' : 'Visit Submitted',
        asDraft ? 'Your visit has been saved as a draft.' : 'Your visit has been submitted for approval.',
        [{ text: 'OK', onPress: () => router.push('/(tabs)/home') }]
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save visit');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>New Field Visit</Text>
          <Text style={styles.subtitle}>Record your inspection with geo-tagging</Text>
        </View>

        {/* Visit Type */}
        <Text style={styles.sectionTitle}>Visit Type</Text>
        <View style={styles.typeRow}>
          {VISIT_TYPES.map((t) => (
            <TouchableOpacity
              key={t.value}
              style={[styles.typeChip, visitType === t.value && styles.typeChipActive]}
              onPress={() => setVisitType(t.value)}
            >
              <MaterialCommunityIcons name={t.icon as any} size={18} color={visitType === t.value ? '#0066cc' : '#999'} />
              <Text style={[styles.typeChipText, visitType === t.value && styles.typeChipTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Basic Info */}
        <Text style={styles.sectionTitle}>Visit Details</Text>
        <View style={styles.card}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Title *</Text>
            <TextInput style={styles.input} placeholder="e.g., PHC Inspection - Ward 5" placeholderTextColor="#bbb" value={title} onChangeText={setTitle} />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput style={[styles.input, styles.textArea]} placeholder="Detailed description of the visit purpose..." placeholderTextColor="#bbb" multiline numberOfLines={4} textAlignVertical="top" value={description} onChangeText={setDescription} />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Visit Date</Text>
            <View style={styles.dateInput}>
              <MaterialCommunityIcons name="calendar" size={20} color="#0066cc" />
              <TextInput style={styles.dateText} value={visitDate} onChangeText={setVisitDate} placeholder="YYYY-MM-DD" placeholderTextColor="#bbb" />
            </View>
          </View>
        </View>

        {/* GPS Location */}
        <Text style={styles.sectionTitle}>
          <MaterialCommunityIcons name="crosshairs-gps" size={16} color="#333" /> GPS Location
        </Text>
        <View style={styles.card}>
          {locationCaptured ? (
            <>
              <View style={styles.locationSuccess}>
                <MaterialCommunityIcons name="check-circle" size={24} color="#2e7d32" />
                <View style={styles.locationInfo}>
                  <Text style={styles.locationAddress}>{address || 'Location captured'}</Text>
                  <Text style={styles.locationCoords}>
                    {parseFloat(latitude).toFixed(6)}, {parseFloat(longitude).toFixed(6)}
                  </Text>
                  {accuracy && <Text style={styles.locationAccuracy}>Accuracy: ±{accuracy.toFixed(0)}m</Text>}
                </View>
              </View>
              <View style={styles.coordsGrid}>
                <View style={styles.coordBox}>
                  <Text style={styles.coordLabel}>Latitude</Text>
                  <Text style={styles.coordValue}>{parseFloat(latitude).toFixed(6)}</Text>
                </View>
                <View style={styles.coordBox}>
                  <Text style={styles.coordLabel}>Longitude</Text>
                  <Text style={styles.coordValue}>{parseFloat(longitude).toFixed(6)}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.recaptureButton} onPress={captureLocation}>
                <MaterialCommunityIcons name="refresh" size={16} color="#0066cc" />
                <Text style={styles.recaptureText}>Recapture Location</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity style={styles.captureButton} onPress={captureLocation} disabled={locationLoading}>
              {locationLoading ? (
                <>
                  <ActivityIndicator color="#0066cc" />
                  <Text style={styles.captureText}>Capturing GPS...</Text>
                </>
              ) : (
                <>
                  <MaterialCommunityIcons name="crosshairs-gps" size={32} color="#0066cc" />
                  <Text style={styles.captureText}>Tap to Capture GPS Location</Text>
                  <Text style={styles.captureSubtext}>Required for geo-tagging</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Photo Capture */}
        <Text style={styles.sectionTitle}>
          <MaterialCommunityIcons name="camera" size={16} color="#333" /> Photo Evidence
        </Text>
        <View style={styles.card}>
          <View style={styles.photoActions}>
            <TouchableOpacity style={styles.photoButton} onPress={takePhoto}>
              <MaterialCommunityIcons name="camera" size={24} color="#0066cc" />
              <Text style={styles.photoButtonText}>Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.photoButton} onPress={pickPhoto}>
              <MaterialCommunityIcons name="image-multiple" size={24} color="#7b1fa2" />
              <Text style={styles.photoButtonText}>Gallery</Text>
            </TouchableOpacity>
          </View>
          {photos.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoStrip}>
              {photos.map((p, i) => (
                <View key={i} style={styles.photoThumbWrap}>
                  <Image source={{ uri: p.uri }} style={styles.photoThumb} />
                  <TouchableOpacity style={styles.photoRemove} onPress={() => removePhoto(i)}>
                    <MaterialCommunityIcons name="close-circle" size={20} color="#d32f2f" />
                  </TouchableOpacity>
                  <Text style={styles.photoTime}>{new Date(p.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                </View>
              ))}
            </ScrollView>
          )}
          <Text style={styles.photoCount}>{photos.length} photo(s) attached</Text>
        </View>

        {/* Inspection Report Toggle */}
        <TouchableOpacity
          style={styles.inspectionToggle}
          onPress={() => setShowInspection(!showInspection)}
        >
          <View style={styles.inspectionToggleLeft}>
            <MaterialCommunityIcons name="clipboard-text" size={20} color="#0066cc" />
            <Text style={styles.inspectionToggleText}>Add Inspection Report</Text>
          </View>
          <MaterialCommunityIcons name={showInspection ? 'chevron-up' : 'chevron-down'} size={24} color="#666" />
        </TouchableOpacity>

        {showInspection && (
          <View style={styles.card}>
            <Text style={styles.label}>Inspection Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              {INSPECTION_TYPES.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.chip, inspectionType === t.toLowerCase() && styles.chipActive]}
                  onPress={() => setInspectionType(t.toLowerCase())}
                >
                  <Text style={[styles.chipText, inspectionType === t.toLowerCase() && styles.chipTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>Severity Level</Text>
            <View style={styles.severityRow}>
              {SEVERITIES.map((s) => (
                <TouchableOpacity
                  key={s.value}
                  style={[styles.severityChip, { borderColor: s.color }, severity === s.value && { backgroundColor: s.color + '20' }]}
                  onPress={() => setSeverity(s.value)}
                >
                  <MaterialCommunityIcons name={s.icon as any} size={16} color={s.color} />
                  <Text style={[styles.severityText, { color: s.color }]}>{s.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Findings *</Text>
              <TextInput style={[styles.input, styles.textArea]} placeholder="Describe your inspection findings..." placeholderTextColor="#bbb" multiline numberOfLines={4} textAlignVertical="top" value={findings} onChangeText={setFindings} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Recommendations</Text>
              <TextInput style={[styles.input, styles.textArea]} placeholder="Suggest corrective actions..." placeholderTextColor="#bbb" multiline numberOfLines={3} textAlignVertical="top" value={recommendations} onChangeText={setRecommendations} />
            </View>
          </View>
        )}

        {/* Submit Buttons */}
        <View style={styles.submitRow}>
          <TouchableOpacity
            style={styles.draftButton}
            onPress={() => handleSubmit(true)}
            disabled={loading}
          >
            <MaterialCommunityIcons name="content-save-outline" size={20} color="#666" />
            <Text style={styles.draftButtonText}>Save Draft</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.buttonDisabled]}
            onPress={() => handleSubmit(false)}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="white" /> : (
              <>
                <MaterialCommunityIcons name="send" size={20} color="white" />
                <Text style={styles.submitButtonText}>Submit Visit</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  scrollContent: { padding: 16, paddingTop: 50, paddingBottom: 30 },
  header: { marginBottom: 20 },
  title: { fontSize: 26, fontWeight: '800', color: '#1a1a1a' },
  subtitle: { fontSize: 13, color: '#999', marginTop: 2 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#333', marginBottom: 10, marginTop: 8 },
  card: { backgroundColor: 'white', borderRadius: 14, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  typeRow: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  typeChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, backgroundColor: '#f0f0f0' },
  typeChipActive: { backgroundColor: '#e3f2fd', borderWidth: 1, borderColor: '#0066cc' },
  typeChipText: { fontSize: 13, color: '#999', fontWeight: '600' },
  typeChipTextActive: { color: '#0066cc' },
  inputGroup: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 8 },
  input: { borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 10, padding: 14, fontSize: 15, color: '#333', backgroundColor: '#fafafa' },
  textArea: { height: 100, textAlignVertical: 'top' },
  dateInput: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 10, paddingHorizontal: 14, backgroundColor: '#fafafa' },
  dateText: { flex: 1, paddingVertical: 14, fontSize: 15, color: '#333' },
  locationSuccess: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 14 },
  locationInfo: { flex: 1 },
  locationAddress: { fontSize: 14, fontWeight: '600', color: '#333' },
  locationCoords: { fontSize: 12, color: '#0066cc', marginTop: 2, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  locationAccuracy: { fontSize: 11, color: '#999', marginTop: 2 },
  coordsGrid: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  coordBox: { flex: 1, backgroundColor: '#f0f7ff', borderRadius: 8, padding: 10 },
  coordLabel: { fontSize: 11, color: '#999', fontWeight: '600' },
  coordValue: { fontSize: 14, fontWeight: '700', color: '#0066cc', marginTop: 2, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  recaptureButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8 },
  recaptureText: { fontSize: 13, color: '#0066cc', fontWeight: '600' },
  captureButton: { alignItems: 'center', paddingVertical: 28, borderWidth: 2, borderStyle: 'dashed', borderColor: '#ccc', borderRadius: 10 },
  captureText: { fontSize: 15, fontWeight: '600', color: '#0066cc', marginTop: 8 },
  captureSubtext: { fontSize: 12, color: '#999', marginTop: 2 },
  photoActions: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  photoButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 10, backgroundColor: '#fafafa' },
  photoButtonText: { fontSize: 14, fontWeight: '600', color: '#333' },
  photoStrip: { marginBottom: 8 },
  photoThumbWrap: { marginRight: 10, position: 'relative' },
  photoThumb: { width: 80, height: 80, borderRadius: 8 },
  photoRemove: { position: 'absolute', top: -6, right: -6 },
  photoTime: { fontSize: 9, color: '#999', textAlign: 'center', marginTop: 2 },
  photoCount: { fontSize: 12, color: '#999', textAlign: 'center' },
  inspectionToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'white', borderRadius: 14, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  inspectionToggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  inspectionToggleText: { fontSize: 15, fontWeight: '700', color: '#333' },
  chipScroll: { marginBottom: 14 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, backgroundColor: '#f0f0f0', marginRight: 8 },
  chipActive: { backgroundColor: '#0066cc' },
  chipText: { fontSize: 12, color: '#666', fontWeight: '600' },
  chipTextActive: { color: 'white' },
  severityRow: { flexDirection: 'row', gap: 8, marginBottom: 14, flexWrap: 'wrap' },
  severityChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, borderWidth: 1.5 },
  severityText: { fontSize: 12, fontWeight: '700' },
  submitRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  draftButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14, borderRadius: 10, borderWidth: 1.5, borderColor: '#ddd', backgroundColor: 'white' },
  draftButtonText: { fontSize: 15, fontWeight: '700', color: '#666' },
  submitButton: { flex: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14, borderRadius: 10, backgroundColor: '#0066cc' },
  submitButtonText: { fontSize: 15, fontWeight: '700', color: 'white' },
  buttonDisabled: { opacity: 0.6 },
});
