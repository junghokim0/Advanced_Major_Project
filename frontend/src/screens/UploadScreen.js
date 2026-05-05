import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator, StyleSheet, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { uploadImage } from '../api';
import { useAnalysis } from '../context/AnalysisContext';

const COLORS = {
  medical600: '#0d9488',
  medical700: '#0f766e',
  medical50: '#f0fdfa',
  neutral50: '#fafafa',
  neutral200: '#e5e7eb',
  neutral400: '#9ca3af',
  neutral500: '#6b7280',
  neutral800: '#1f2937',
  red500: '#ef4444',
  red50: '#fef2f2',
  white: '#ffffff',
};
const RADIUS = { card: 12, button: 12, image: 12 };

export default function UploadScreen({ token, userEmail, onLogout, onOpenProgress }) {
  const [image, setImage] = useState(null);
  const [error, setError] = useState(null);
  const { uploading, setUploading, latestResult, setLatestResult } = useAnalysis();

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
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>사진 업로드</Text>
        <Text style={styles.subtitle}>Logged in as {userEmail}</Text>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionCard} onPress={pickImage} activeOpacity={0.85}>
          <Text style={styles.actionLabel}>Choose Photo</Text>
          <Text style={styles.actionHint}>갤러리에서 선택</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionCard} onPress={captureImage} activeOpacity={0.85}>
          <Text style={styles.actionLabel}>Take Photo</Text>
          <Text style={styles.actionHint}>카메라로 촬영</Text>
        </TouchableOpacity>
      </View>

      {image ? (
        <Image source={{ uri: image.uri }} style={styles.preview} />
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderTitle}>아직 선택된 이미지가 없습니다</Text>
          <Text style={styles.placeholderHint}>위 버튼으로 사진을 선택하거나 촬영해 주세요</Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.primaryButton, uploading && styles.primaryButtonDisabled]}
        onPress={handleUpload}
        disabled={uploading}
        activeOpacity={0.85}
      >
        {uploading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={COLORS.white} />
            <Text style={styles.primaryButtonText}>분석 중...</Text>
          </View>
        ) : (
          <Text style={styles.primaryButtonText}>Upload</Text>
        )}
      </TouchableOpacity>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <TouchableOpacity style={styles.outlineButton} onPress={onOpenProgress} activeOpacity={0.85}>
        <Text style={styles.outlineButtonText}>진행 결과 확인</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={onLogout} activeOpacity={0.7}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.neutral50,
  },
  container: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.neutral800,
    marginBottom: 4,
  },
  subtitle: {
    color: COLORS.neutral500,
    fontSize: 14,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.neutral200,
    borderRadius: RADIUS.card,
    paddingVertical: 18,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  actionLabel: {
    color: COLORS.medical600,
    fontWeight: '700',
    fontSize: 15,
    marginBottom: 4,
  },
  actionHint: {
    color: COLORS.neutral500,
    fontSize: 12,
  },
  preview: {
    width: '100%',
    height: 240,
    borderRadius: RADIUS.image,
    marginBottom: 16,
    backgroundColor: COLORS.neutral200,
  },
  placeholder: {
    width: '100%',
    height: 200,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.neutral200,
    borderStyle: 'dashed',
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  placeholderTitle: {
    color: COLORS.neutral800,
    fontWeight: '600',
    fontSize: 15,
    marginBottom: 6,
  },
  placeholderHint: {
    color: COLORS.neutral500,
    fontSize: 13,
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: COLORS.medical600,
    paddingVertical: 14,
    borderRadius: RADIUS.button,
    alignItems: 'center',
  },
  primaryButtonDisabled: {
    backgroundColor: COLORS.medical700,
    opacity: 0.85,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 15,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorBox: {
    marginTop: 12,
    backgroundColor: COLORS.red50,
    borderRadius: RADIUS.card,
    padding: 12,
  },
  errorText: {
    color: COLORS.red500,
    fontWeight: '600',
  },
  outlineButton: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: COLORS.medical600,
    borderRadius: RADIUS.button,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  outlineButtonText: {
    color: COLORS.medical600,
    fontWeight: '700',
  },
  logoutButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  logoutText: {
    color: COLORS.red500,
    fontWeight: '700',
  },
});
