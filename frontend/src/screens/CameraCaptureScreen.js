import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CaptureGuideOverlay from '../components/CaptureGuideOverlay';
import LevelIndicator from '../components/LevelIndicator';
import { CAPTURE_IMAGE_QUALITY } from '../constants/captureConfig';
import { M_LINE_GUIDE } from '../constants/guideLayouts';
import { useDeviceLevel } from '../hooks/useDeviceLevel';
import { BRAND } from '../theme/brand';
import { cropImageToGuideRegion } from '../utils/cropGuideRegion';

export default function CameraCaptureScreen({ onCapture, onCancel }) {
  const insets = useSafeAreaInsets();
  const cameraRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [capturing, setCapturing] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [previewLayout, setPreviewLayout] = useState({ width: 0, height: 0 });
  const {
    tilt,
    isLevel,
    poseHint,
    isAvailable,
    targetPitchDeg,
    pitchToleranceDeg,
    rollThresholdDeg,
  } = useDeviceLevel();

  const canCapture = isLevel && !capturing;

  const handleCapture = async () => {
    if (!cameraRef.current || !canCapture) return;

    setCapturing(true);
    setCameraError(null);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: CAPTURE_IMAGE_QUALITY,
      });
      if (!photo?.uri || !photo.width || !photo.height) {
        throw new Error('사진을 저장하지 못했습니다.');
      }

      const cropped = await cropImageToGuideRegion(
        photo.uri,
        photo.width,
        photo.height,
        M_LINE_GUIDE
      );

      onCapture({
        uri: cropped.uri,
        width: cropped.width,
        height: cropped.height,
        type: 'image/jpeg',
        croppedToGuide: true,
        patternType: 'm_line',
      });
    } catch (err) {
      setCameraError(err.message || '촬영에 실패했습니다.');
    } finally {
      setCapturing(false);
    }
  };

  if (!permission) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={BRAND.medical600} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <Text style={styles.permissionTitle}>카메라 권한이 필요합니다</Text>
        <Text style={styles.permissionHint}>M자 라인 촬영을 위해 카메라 접근을 허용해 주세요.</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={requestPermission} activeOpacity={0.85}>
          <Text style={styles.primaryButtonText}>권한 허용</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={onCancel} activeOpacity={0.85}>
          <Text style={styles.secondaryButtonText}>돌아가기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (Platform.OS === 'web') {
    return (
      <View style={styles.centered}>
        <Text style={styles.permissionTitle}>웹에서는 커스텀 카메라를 지원하지 않습니다</Text>
        <Text style={styles.permissionHint}>Expo Go(모바일) 또는 앱 빌드에서 이용해 주세요.</Text>
        <TouchableOpacity style={styles.secondaryButton} onPress={onCancel} activeOpacity={0.85}>
          <Text style={styles.secondaryButtonText}>돌아가기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View
        style={styles.previewArea}
        onLayout={(event) => {
          const { width, height } = event.nativeEvent.layout;
          setPreviewLayout({ width, height });
        }}
      >
        <CameraView ref={cameraRef} style={styles.camera} facing="front" mode="picture" />
        {previewLayout.width > 0 && previewLayout.height > 0 ? (
          <CaptureGuideOverlay
            width={previewLayout.width}
            height={previewLayout.height}
            guide={M_LINE_GUIDE}
          />
        ) : null}
      </View>

      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={onCancel} activeOpacity={0.85}>
          <Text style={styles.backButtonText}>← 취소</Text>
        </TouchableOpacity>
        <Text style={styles.topTitle}>M자 촬영</Text>
        <View style={styles.topSpacer} />
      </View>

      <View style={[styles.overlayBottom, { paddingBottom: Math.max(insets.bottom, 16) + 12 }]}>
        <Text style={styles.hint}>
          폰 상단을 이마 쪽으로 기울이고(목표 pitch 약 -10°), 타원 안에 맞춘 뒤 촬영하면 가이드 영역만 전송됩니다.
        </Text>
        <LevelIndicator
          isLevel={isLevel}
          roll={tilt.roll}
          pitch={tilt.pitch}
          poseHint={poseHint}
          sensorAvailable={isAvailable}
          targetPitchDeg={targetPitchDeg}
          pitchToleranceDeg={pitchToleranceDeg}
          rollThresholdDeg={rollThresholdDeg}
        />
        {cameraError ? <Text style={styles.errorText}>{cameraError}</Text> : null}
        <TouchableOpacity
          style={[styles.captureButton, !canCapture && styles.captureButtonDisabled]}
          onPress={handleCapture}
          disabled={!canCapture}
          activeOpacity={0.85}
        >
          {capturing ? (
            <ActivityIndicator color={BRAND.neutral800} />
          ) : (
            <View style={styles.captureInner} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  previewArea: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  centered: {
    flex: 1,
    backgroundColor: BRAND.neutral800,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 48,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  backButton: {
    paddingVertical: 8,
    paddingRight: 12,
  },
  backButtonText: {
    color: BRAND.white,
    fontWeight: '600',
    fontSize: 16,
  },
  topTitle: {
    flex: 1,
    textAlign: 'center',
    color: BRAND.white,
    fontWeight: '700',
    fontSize: 16,
  },
  topSpacer: {
    width: 60,
  },
  overlayBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 16,
    paddingTop: 16,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
  },
  hint: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 4,
    lineHeight: 18,
  },
  permissionTitle: {
    color: BRAND.white,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  permissionHint: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  primaryButton: {
    backgroundColor: BRAND.medical600,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    marginBottom: 12,
  },
  primaryButtonText: {
    color: BRAND.white,
    fontWeight: '700',
  },
  secondaryButton: {
    paddingVertical: 10,
  },
  secondaryButtonText: {
    color: BRAND.medical600,
    fontWeight: '600',
  },
  errorText: {
    color: '#fecaca',
    fontSize: 13,
    marginBottom: 8,
    textAlign: 'center',
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: BRAND.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  captureButtonDisabled: {
    opacity: 0.45,
  },
  captureInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: BRAND.white,
  },
});
