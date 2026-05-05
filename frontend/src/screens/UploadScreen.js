import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator, StyleSheet, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { uploadImage } from '../api';
import { useAnalysis } from '../context/AnalysisContext';

export default function UploadScreen({ token, userEmail, onLogout, onOpenProgress }) {
  const [image, setImage] = useState(null);
  const [error, setError] = useState(null);
  const { uploading, setUploading, setLatestResult } = useAnalysis();

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Media library permission is required.');
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (pickerResult.canceled) {
      return;
    }

    setImage(pickerResult.assets[0]);
    setLatestResult(null);
    setError(null);
  };

  const captureImage = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setError('Camera permission is required.');
      return;
    }

    const cameraResult = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (cameraResult.canceled) {
      return;
    }

    setImage(cameraResult.assets[0]);
    setLatestResult(null);
    setError(null);
  };

  const handleUpload = async () => {
    if (!image) {
      setError('Please choose an image first.');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const response = await uploadImage(token, image);
      setLatestResult(response);
      onOpenProgress();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Upload Image</Text>
      <Text style={styles.subtitle}>Logged in as {userEmail}</Text>
      <TouchableOpacity style={styles.button} onPress={pickImage}>
        <Text style={styles.buttonText}>Choose Photo</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={captureImage}>
        <Text style={styles.buttonText}>Take Photo</Text>
      </TouchableOpacity>

      {image ? (
        <Image source={{ uri: image.uri }} style={styles.preview} />
      ) : (
        <Text style={styles.infoText}>No image selected yet.</Text>
      )}

      <TouchableOpacity style={styles.button} onPress={handleUpload} disabled={uploading}>
        {uploading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Upload</Text>}
      </TouchableOpacity>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity style={styles.secondaryButton} onPress={onOpenProgress}>
        <Text style={styles.secondaryButtonText}>진행 결과 확인</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    color: '#6b7280',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#2563eb',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
  },
  preview: {
    width: '100%',
    height: 240,
    borderRadius: 12,
    marginTop: 12,
  },
  infoText: {
    color: '#6b7280',
    marginTop: 12,
    marginBottom: 20,
  },
  error: {
    color: '#b91c1c',
    marginVertical: 12,
  },
  secondaryButton: {
    marginTop: 20,
    backgroundColor: '#1d4ed8',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  logoutButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  logoutText: {
    color: '#ef4444',
    fontWeight: '700',
  },
});
