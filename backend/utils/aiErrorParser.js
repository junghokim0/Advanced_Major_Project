const BLUR_ERROR_CODE = 'IMAGE_TOO_BLURRY';

function extractDetail(error) {
  const data = error?.response?.data;
  if (!data) return null;
  const detail = data.detail ?? data;
  if (typeof detail === 'string') {
    try {
      return JSON.parse(detail);
    } catch {
      return { message: detail };
    }
  }
  return typeof detail === 'object' ? detail : null;
}

function parseAiBlurError(error) {
  const detail = extractDetail(error);
  if (!detail || detail.code !== BLUR_ERROR_CODE) {
    return null;
  }

  const err = new Error(
    detail.message ||
      '사진이 흐려 분석할 수 없습니다. 다시 촬영하거나 다른 사진을 선택해 주세요.'
  );
  err.status = 422;
  err.code = BLUR_ERROR_CODE;
  err.blurScore = detail.blurScore;
  err.minBlurScore = detail.minRequired;
  return err;
}

module.exports = {
  BLUR_ERROR_CODE,
  parseAiBlurError,
};
