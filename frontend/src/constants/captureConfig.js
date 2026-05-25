/** 공통 촬영 품질 */
export const CAPTURE_IMAGE_QUALITY = 0.8;

/** 좌우(roll) 허용 각도 기본값 */
export const DEFAULT_ROLL_THRESHOLD_DEG = 5;

/** M자 촬영 pitch 목표 기본값 */
export const DEFAULT_TARGET_PITCH_DEG = -10;

/** M자 촬영 pitch 허용 오차 기본값 */
export const DEFAULT_PITCH_TOLERANCE_DEG = 5;

export const PATTERN_CAPTURE_CONFIG = {
  crown: {
    title: '정수리 촬영',
    permissionHint: '정수리 촬영을 위해 카메라 접근을 허용해 주세요.',
    cameraFacing: 'back',
    bottomHint:
      '휴대폰을 머리 위로 올린 뒤 렌즈가 정수리를 향하도록 아래로 기울여 주세요. 원 안에 정수리 중심이 오도록 맞춘 뒤 촬영해 주세요.',
    levelConfig: {
      rollThresholdDeg: 8,
      minAbsPitchDeg: 35,
      readyHint: '정수리 촬영 각도 OK',
      adjustPitchHint: '휴대폰 렌즈가 정수리를 향하도록 위에서 아래로 조금 더 기울여 주세요.',
    },
    cropToGuide: false,
  },
  m_line: {
    title: 'M자 촬영',
    permissionHint: 'M자 라인 촬영을 위해 카메라 접근을 허용해 주세요.',
    cameraFacing: 'front',
    bottomHint:
      '폰 상단을 이마 쪽으로 기울이고 타원 안에 헤어라인을 맞춘 뒤 촬영해 주세요.',
    levelConfig: {
      rollThresholdDeg: DEFAULT_ROLL_THRESHOLD_DEG,
      targetPitchDeg: DEFAULT_TARGET_PITCH_DEG,
      pitchToleranceDeg: DEFAULT_PITCH_TOLERANCE_DEG,
      readyHint: 'M자 촬영 각도 OK',
    },
    cropToGuide: true,
  },
};
