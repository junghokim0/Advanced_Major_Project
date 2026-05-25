import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { uploadImage } from '../api';
import BlurRetakeGuide from '../components/BlurRetakeGuide';
import { isBlurQualityError } from '../constants/uploadQuality';
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

const PATTERN_OPTIONS = [
  { value: 'crown', label: '정수리', hint: '윗면 두피 촬영' },
  { value: 'm_line', label: 'M자', hint: '이마·헤어라인 촬영' },
];

export default function UploadScreen({
  token,
  pendingCapture,
  onPendingCaptureHandled,
  onOpenCustomCamera,
}) {
  const navigation = useNavigation();
  const [image, setImage] = useState(null);
  const [patternType, setPatternType] = useState('crown');
  const [error, setError] = useState(null);
  const [blurError, setBlurError] = useState(null);
  const { uploading, setUploading, latestResult, setLatestResult } = useAnalysis();

  useEffect(() => {
    if (!pendingCapture) return;
    setImage(pendingCapture);
    if (pendingCapture.patternType) {
      setPatternType(pendingCapture.patternType);
    } else if (pendingCapture.croppedToGuide) {
      setPatternType('m_line');
    }
    setLatestResult(null);
    setError(null);
    setBlurError(null);
    onPendingCaptureHandled?.();
  }, [pendingCapture, onPendingCaptureHandled, setLatestResult]);

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
    setBlurError(null);
  };

  const captureImage = async () => {
    if (onOpenCustomCamera) {
      onOpenCustomCamera(patternType);
      return;
    }

    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setError('카메라 권한이 필요합니다.');
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
    setBlurError(null);
  };

  const handleUpload = async () => {
    if (!image) {
      setError('Please choose an image first.');
      return;
    }

    setUploading(true);
    setError(null);
    setBlurError(null);

    try {
      const uploadPatternType =
        image?.patternType || (image?.croppedToGuide ? 'm_line' : null) || patternType;
      const response = await uploadImage(token, image, uploadPatternType);
      setLatestResult(response);
      if (!response?.analysis) {
        const detail = response?.analysisError || 'AI 서버에 연결하지 못했습니다.';
        setError(`사진은 저장됐지만 분석에 실패했습니다. AI 서버(8000) 실행 후 다시 시도해 주세요.\n${detail}`);
        return;
      }
      navigation.navigate('Records');
    } catch (err) {
      if (isBlurQualityError(err)) {
        setBlurError(err);
        setError(null);
        return;
      }
      setBlurError(null);
      const msg = err?.message || '업로드에 실패했습니다.';
      setError(
        msg.includes('timed out') || msg.includes('Network')
          ? `${msg}\n백엔드(:3000)·AI(:8000) 실행과 PC·폰 같은 Wi‑Fi를 확인해 주세요.`
          : msg
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>사진 업로드</Text>
        <Text style={styles.subtitle}>사진을 선택하거나 촬영한 뒤 분석해 주세요</Text>
      </View>

      <View style={styles.patternSection}>
        <Text style={styles.patternTitle}>분석 패턴</Text>
        <View style={styles.patternRow}>
          {PATTERN_OPTIONS.map((option) => {
            const selected = patternType === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                style={[styles.patternCard, selected && styles.patternCardSelected]}
                onPress={() => setPatternType(option.value)}
                activeOpacity={0.85}
                disabled={uploading}
              >
                <Text style={[styles.patternLabel, selected && styles.patternLabelSelected]}>
                  {option.label}
                </Text>
                <Text style={[styles.patternHint, selected && styles.patternHintSelected]}>
                  {option.hint}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <Text style={styles.patternNotice}>
          {patternType === 'm_line'
            ? 'M자 촬영은 헤어라인 가이드와 자세 안내를 보며 직접 촬영합니다.'
            : '정수리 촬영은 전용 가이드 화면을 보며 직접 촬영합니다.'}
        </Text>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionCard} onPress={pickImage} activeOpacity={0.85}>
          <Text style={styles.actionLabel}>Choose Photo</Text>
          <Text style={styles.actionHint}>갤러리에서 선택</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionCard} onPress={captureImage} activeOpacity={0.85}>
          <Text style={styles.actionLabel}>Take Photo</Text>
          <Text style={styles.actionHint}>
            {patternType === 'm_line' ? 'M자 가이드 촬영' : '정수리 가이드 촬영'}
          </Text>
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

      {blurError ? (
        <BlurRetakeGuide
          error={blurError}
          onRetakePhoto={captureImage}
          onPickGallery={pickImage}
        />
      ) : null}

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <TouchableOpacity
        style={styles.outlineButton}
        onPress={() => navigation.navigate('Records')}
        activeOpacity={0.85}
      >
        <Text style={styles.outlineButtonText}>기록 탭에서 결과 보기</Text>
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
  patternSection: {
    marginBottom: 16,
  },
  patternTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.neutral800,
    marginBottom: 8,
  },
  patternRow: {
    flexDirection: 'row',
    gap: 12,
  },
  patternCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.neutral200,
    borderRadius: RADIUS.card,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  patternCardSelected: {
    borderColor: COLORS.medical600,
    backgroundColor: COLORS.medical50,
  },
  patternLabel: {
    color: COLORS.neutral800,
    fontWeight: '700',
    fontSize: 15,
    marginBottom: 4,
  },
  patternLabelSelected: {
    color: COLORS.medical700,
  },
  patternHint: {
    color: COLORS.neutral500,
    fontSize: 11,
    textAlign: 'center',
  },
  patternHintSelected: {
    color: COLORS.medical700,
  },
  patternNotice: {
    marginTop: 8,
    color: COLORS.neutral500,
    fontSize: 12,
    lineHeight: 18,
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
