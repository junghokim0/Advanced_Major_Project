export const IMAGE_TOO_BLURRY = 'IMAGE_TOO_BLURRY';

export function isBlurQualityError(err) {
  return err?.code === IMAGE_TOO_BLURRY;
}

export function formatBlurQualityMessage(err) {
  const score =
    err?.blurScore != null ? ` (선명도 점수 ${err.blurScore}, 기준 ${err.minBlurScore ?? 80} 이상)` : '';
  return (
    err?.message ||
    `사진이 흐려 분석할 수 없습니다.${score}\n손떨림·초점을 확인한 뒤 다시 촬영하거나 갤러리에서 다른 사진을 선택해 주세요.`
  );
}
