/**
 * M자 촬영 가이드 타원 (화면 비율 0~1).
 * 튜닝 시 이 파일만 수정하면 UI·추후 얼굴 overlap 로직이 동일 기준을 사용합니다.
 */
export const CROWN_GUIDE = {
  centerXRatio: 0.5,
  centerYRatio: 0.34,
  radiusXRatio: 0.26,
  radiusYRatio: 0.17,
  strokeColor: '#38bdf8',
  strokeWidth: 2,
  dimOpacity: 0.42,
  hint: '정수리 중심이 원 안에 오도록 휴대폰을 머리 위로 올려 주세요.',
};

export const M_LINE_GUIDE = {
  centerXRatio: 0.5,
  centerYRatio: 0.28,
  radiusXRatio: 0.38,
  radiusYRatio: 0.14,
  strokeColor: '#0d9488',
  strokeWidth: 2,
  dimOpacity: 0.38,
  hint: '이마와 헤어라인(M자)이 타원 안에 오도록 맞춰 주세요. 정면을 보고 턱을 살짝 내려 주세요.',
};

export function resolveGuideEllipse(guide, width, height) {
  return {
    cx: width * guide.centerXRatio,
    cy: height * guide.centerYRatio,
    rx: width * guide.radiusXRatio,
    ry: height * guide.radiusYRatio,
  };
}

/**
 * 타원 가이드의 bounding box → crop 사각형 (픽셀).
 * guideLayouts 비율을 촬영 이미지 width/height에 그대로 적용합니다.
 */
export function resolveGuideCropRect(guide, imageWidth, imageHeight) {
  const { cx, cy, rx, ry } = resolveGuideEllipse(guide, imageWidth, imageHeight);

  let originX = Math.round(cx - rx);
  let originY = Math.round(cy - ry);
  let cropWidth = Math.round(rx * 2);
  let cropHeight = Math.round(ry * 2);

  originX = Math.max(0, originX);
  originY = Math.max(0, originY);
  cropWidth = Math.min(cropWidth, imageWidth - originX);
  cropHeight = Math.min(cropHeight, imageHeight - originY);

  return { originX, originY, width: cropWidth, height: cropHeight };
}
