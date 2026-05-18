import { useEffect, useState } from 'react';
import { Accelerometer } from 'expo-sensors';
import {
  PITCH_TOLERANCE_DEG,
  ROLL_THRESHOLD_DEG,
  TARGET_PITCH_DEG,
} from '../constants/captureConfig';

const toDegrees = (radians) => (radians * 180) / Math.PI;

const normalizeTiltAngle = (degrees) => {
  if (degrees > 90) return degrees - 180;
  if (degrees < -90) return degrees + 180;
  return degrees;
};

const round1 = (value) => Math.round(value * 10) / 10;

function buildPoseHint({ rollOk, pitchOk, pitch, targetPitch }) {
  if (!rollOk) {
    return '좌우로 기울이지 말고 세로로 든 상태를 유지해 주세요.';
  }
  if (!pitchOk) {
    const delta = pitch - targetPitch;
    if (delta < -PITCH_TOLERANCE_DEG) {
      return targetPitch < 0
        ? `폰 기울기를 조금 줄여 주세요 (목표 약 ${targetPitch}°).`
        : `폰 상단을 이마 쪽으로 조금 더 기울여 주세요 (목표 약 ${targetPitch}°).`;
    }
    return targetPitch < 0
      ? `폰 상단을 이마 쪽으로 조금 더 기울여 주세요 (목표 약 ${targetPitch}°).`
      : `폰 기울기를 조금 줄여 주세요 (목표 약 ${targetPitch}°).`;
  }
  return '촬영 각도 OK — 촬영 가능';
}

/**
 * 세로(portrait) 셀카 + 이마 쪽 pitch (TARGET_PITCH_DEG, 기본 -10°).
 * roll: 좌우 기울기, pitch: 앞뒤(상단을 이마 쪽으로).
 */
export function useDeviceLevel() {
  const [tilt, setTilt] = useState({ roll: 0, pitch: 0 });
  const [isLevel, setIsLevel] = useState(false);
  const [poseHint, setPoseHint] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);

  useEffect(() => {
    let subscription = null;
    let mounted = true;

    const start = async () => {
      const available = await Accelerometer.isAvailableAsync();
      if (!mounted) return;

      if (!available) {
        setIsAvailable(false);
        setIsLevel(true);
        setPoseHint('센서 없음 — 촬영 가능');
        return;
      }

      Accelerometer.setUpdateInterval(100);
      subscription = Accelerometer.addListener(({ x, y, z }) => {
        const isPortraitUpright = Math.abs(y) > 0.65;

        const roll = normalizeTiltAngle(toDegrees(Math.atan2(x, y)));
        const pitch = normalizeTiltAngle(toDegrees(Math.atan2(z, y)));

        const rollOk = Math.abs(roll) <= ROLL_THRESHOLD_DEG;
        const pitchOk =
          Math.abs(pitch - TARGET_PITCH_DEG) <= PITCH_TOLERANCE_DEG;
        const ready = isPortraitUpright && rollOk && pitchOk;

        setTilt({
          roll: round1(roll),
          pitch: round1(pitch),
        });
        setIsLevel(ready);
        setPoseHint(
          buildPoseHint({
            rollOk,
            pitchOk,
            pitch,
            targetPitch: TARGET_PITCH_DEG,
          })
        );
      });
    };

    start();

    return () => {
      mounted = false;
      subscription?.remove();
    };
  }, []);

  return {
    tilt,
    isLevel,
    poseHint,
    isAvailable,
    targetPitchDeg: TARGET_PITCH_DEG,
    pitchToleranceDeg: PITCH_TOLERANCE_DEG,
    rollThresholdDeg: ROLL_THRESHOLD_DEG,
  };
}
