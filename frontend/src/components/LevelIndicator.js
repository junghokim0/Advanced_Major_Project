import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BRAND } from '../theme/brand';

export default function LevelIndicator({
  isLevel,
  roll,
  pitch,
  poseHint,
  sensorAvailable,
  targetPitchDeg,
  pitchToleranceDeg,
  rollThresholdDeg,
}) {
  const lineColor = isLevel ? BRAND.medical600 : BRAND.red500;

  return (
    <View style={styles.wrap} pointerEvents="none">
      <View style={styles.lineRow}>
        <View style={[styles.line, { backgroundColor: lineColor }]} />
        <View style={[styles.bubble, { borderColor: lineColor }]}>
          <View style={[styles.bubbleInner, { backgroundColor: lineColor }]} />
        </View>
        <View style={[styles.line, { backgroundColor: lineColor }]} />
      </View>
      <Text style={[styles.status, { color: lineColor }]}>
        {sensorAvailable ? poseHint : '센서 없음 — 촬영 가능'}
      </Text>
      {sensorAvailable ? (
        <Text style={styles.detail}>
          좌우 {roll}° (±{rollThresholdDeg}°) · 앞뒤 {pitch}° (목표 {targetPitchDeg}° ±
          {pitchToleranceDeg}°)
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  lineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '72%',
    marginBottom: 8,
  },
  line: {
    flex: 1,
    height: 3,
    borderRadius: 2,
  },
  bubble: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    marginHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  status: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  detail: {
    marginTop: 4,
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
  },
});
