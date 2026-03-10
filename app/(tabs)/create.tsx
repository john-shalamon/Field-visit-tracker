import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import useAuth from '@/hooks/useAuth';
import useVisits from '@/hooks/useVisits';
import * as Location from 'expo-location';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function CreateVisitScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { createVisit, loading } = useVisits(user?.id);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [locationName, setLocationName] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState('');
  const [gettingLocation, setGettingLocation] = useState(false);

  const getLocation = async () => {
    try {
      setGettingLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required to create a visit');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setLatitude(location.coords.latitude.toString());
      setLongitude(location.coords.longitude.toString());

      // Try to get address
      try {
        const addresses = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        if (addresses.length > 0) {
          const address = addresses[0];
          setLocationName(
            `${address.street || ''} ${address.city || ''} ${address.region || ''}`.trim()
          );
        }
      } catch (err) {
        console.log('Could not get address');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to get location. Please try again.');
    } finally {
      setGettingLocation(false);
    }
  };

  const handleCreateVisit = async () => {
    setError('');

    if (!title || !locationName || !latitude || !longitude) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      await createVisit({
        title,
        description,
        location_name: locationName,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        visited_date: visitDate,
      });

      Alert.alert('Success', 'Visit created successfully!', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (err: any) {
      setError(err.message || 'Failed to create visit');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Visit Details</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Visit Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., School Inspection - ABC School"
            placeholderTextColor="#999"
            value={title}
            onChangeText={setTitle}
            editable={!loading}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Add any additional notes"
            placeholderTextColor="#999"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            editable={!loading}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Visit Date *</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#999"
            value={visitDate}
            onChangeText={setVisitDate}
            editable={!loading}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Location</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Location Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., ABC School, Main Building"
            placeholderTextColor="#999"
            value={locationName}
            onChangeText={setLocationName}
            editable={!loading}
          />
        </View>

        <TouchableOpacity
          style={[styles.locationButton, gettingLocation && styles.buttonDisabled]}
          onPress={getLocation}
          disabled={gettingLocation || loading}
        >
          {gettingLocation ? (
            <>
              <ActivityIndicator color="white" />
              <Text style={styles.locationButtonText}>Getting Location...</Text>
            </>
          ) : (
            <>
              <MaterialCommunityIcons name="map-marker" size={20} color="white" />
              <Text style={styles.locationButtonText}>Get Current Location</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.coordinatesRow}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Latitude *</Text>
            <TextInput
              style={styles.input}
              placeholder="0.0000"
              placeholderTextColor="#999"
              value={latitude}
              onChangeText={setLatitude}
              keyboardType="decimal-pad"
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Longitude *</Text>
            <TextInput
              style={styles.input}
              placeholder="0.0000"
              placeholderTextColor="#999"
              value={longitude}
              onChangeText={setLongitude}
              keyboardType="decimal-pad"
              editable={!loading}
            />
          </View>
        </View>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={20} color="#d32f2f" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.submitButton, loading && styles.buttonDisabled]}
        onPress={handleCreateVisit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <>
            <MaterialCommunityIcons name="check-circle" size={20} color="white" />
            <Text style={styles.submitButtonText}>Create Visit</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    textAlignVertical: 'top',
  },
  locationButton: {
    flexDirection: 'row',
    backgroundColor: '#0066cc',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  locationButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  coordinatesRow: {
    flexDirection: 'row',
    gap: 12,
  },
  coordinatesRow: {
    flexDirection: 'row',
    gap: 12,
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: '#4caf50',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
    flex: 1,
  },
});
