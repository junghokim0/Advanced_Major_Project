/** 좌우(roll) 허용 각도(도) */
export const ROLL_THRESHOLD_DEG = 5;

/**
 * M자 촬영: 폰 상단을 이마 쪽으로 기울인 pitch 목표(도).
 * 기기·좌표계에 따라 부호가 다를 수 있음 (현재 기준: -10).
 */
export const TARGET_PITCH_DEG = -10;

/** pitch 목표 대비 허용 오차(도) → 실질 허용 약 5°~15° */
export const PITCH_TOLERANCE_DEG = 5;

/** @deprecated ROLL_THRESHOLD_DEG 사용 */
export const LEVEL_THRESHOLD_DEG = ROLL_THRESHOLD_DEG;

export const CAPTURE_IMAGE_QUALITY = 0.8;
