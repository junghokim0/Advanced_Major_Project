const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const MIN_UPLOAD_BYTES = 8 * 1024;

const ALLOWED_MIME = new Set(['image/jpeg', 'image/jpg', 'image/png']);

function detectImageType(buffer) {
  if (!buffer || buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'image/png';
  }
  return null;
}

function normalizeMime(mimetype) {
  if (!mimetype) return null;
  const lower = String(mimetype).toLowerCase();
  if (lower === 'image/jpg') return 'image/jpeg';
  return lower;
}

function rejectIfJpegExtension(filename = '') {
  const ext = String(filename).toLowerCase().match(/\.[^.]+$/)?.[0] || '';
  if (ext === '.jpeg') {
    return '.jpeg 확장자는 허용하지 않습니다. .jpg 또는 .png를 사용해 주세요.';
  }
  return null;
}

/**
 * 업로드 바이트 검수: 크기·MIME·매직 바이트(jpg/png, .jpeg 확장자 제외).
 */
function validateUploadBuffer(buffer, mimetype, filename = '') {
  if (!buffer || !Buffer.isBuffer(buffer)) {
    return { ok: false, error: '업로드 데이터가 비어 있습니다.' };
  }

  const extError = rejectIfJpegExtension(filename);
  if (extError) {
    return { ok: false, error: extError };
  }

  if (buffer.length < MIN_UPLOAD_BYTES) {
    return {
      ok: false,
      error: `이미지 용량이 너무 작습니다. (${Math.round(buffer.length / 1024)}KB, 최소 ${Math.round(MIN_UPLOAD_BYTES / 1024)}KB)`,
    };
  }

  if (buffer.length > MAX_UPLOAD_BYTES) {
    return {
      ok: false,
      error: `이미지 용량이 5MB를 초과합니다. (${Math.round(buffer.length / 1024 / 1024 * 10) / 10}MB)`,
    };
  }

  const detected = detectImageType(buffer);
  if (!detected) {
    return { ok: false, error: 'jpg, png 형식의 두피 사진만 업로드할 수 있습니다.' };
  }

  const declared = normalizeMime(mimetype);
  if (declared && ALLOWED_MIME.has(declared) && declared !== detected) {
    return {
      ok: false,
      error: '파일 확장자·형식이 일치하지 않습니다. 다시 촬영하거나 저장 형식을 확인해 주세요.',
    };
  }
  // 갤러리가 image/heic 등으로내도 매직 바이트가 JPEG/PNG면 허용

  return { ok: true, detectedMime: detected, filename };
}

module.exports = {
  MAX_UPLOAD_BYTES,
  MIN_UPLOAD_BYTES,
  validateUploadBuffer,
  detectImageType,
};
