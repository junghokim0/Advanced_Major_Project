const test = require('node:test');
const assert = require('node:assert/strict');

const {
  MIN_UPLOAD_BYTES,
  MAX_UPLOAD_BYTES,
  detectImageType,
  validateUploadBuffer,
} = require('../utils/uploadImageValidation');

function createJpegBuffer(size = MIN_UPLOAD_BYTES) {
  const buffer = Buffer.alloc(size, 0);
  buffer[0] = 0xff;
  buffer[1] = 0xd8;
  buffer[2] = 0xff;
  return buffer;
}

function createPngBuffer(size = MIN_UPLOAD_BYTES) {
  const buffer = Buffer.alloc(size, 0);
  buffer[0] = 0x89;
  buffer[1] = 0x50;
  buffer[2] = 0x4e;
  buffer[3] = 0x47;
  buffer[4] = 0x0d;
  buffer[5] = 0x0a;
  buffer[6] = 0x1a;
  buffer[7] = 0x0a;
  return buffer;
}

test('detectImageType identifies JPEG and PNG magic bytes', () => {
  assert.equal(detectImageType(createJpegBuffer()), 'image/jpeg');
  assert.equal(detectImageType(createPngBuffer()), 'image/png');
});

test('validateUploadBuffer rejects empty upload data', () => {
  const result = validateUploadBuffer(null, 'image/jpeg', 'sample.jpg');

  assert.equal(result.ok, false);
  assert.match(result.error, /비어 있습니다/);
});

test('validateUploadBuffer rejects .jpeg extension', () => {
  const result = validateUploadBuffer(createJpegBuffer(), 'image/jpeg', 'sample.jpeg');

  assert.equal(result.ok, false);
  assert.match(result.error, /\.jpeg 확장자/);
});

test('validateUploadBuffer rejects files smaller than minimum size', () => {
  const result = validateUploadBuffer(createJpegBuffer(MIN_UPLOAD_BYTES - 1), 'image/jpeg', 'small.jpg');

  assert.equal(result.ok, false);
  assert.match(result.error, /이미지 용량이 너무 작습니다/);
});

test('validateUploadBuffer rejects files larger than maximum size', () => {
  const result = validateUploadBuffer(
    createJpegBuffer(MAX_UPLOAD_BYTES + 1),
    'image/jpeg',
    'large.jpg'
  );

  assert.equal(result.ok, false);
  assert.match(result.error, /5MB를 초과합니다/);
});

test('validateUploadBuffer rejects unsupported file signatures', () => {
  const result = validateUploadBuffer(Buffer.alloc(MIN_UPLOAD_BYTES, 1), 'image/jpeg', 'bad.jpg');

  assert.equal(result.ok, false);
  assert.match(result.error, /jpg, png 형식/);
});

test('validateUploadBuffer rejects mismatched declared MIME type', () => {
  const result = validateUploadBuffer(createPngBuffer(), 'image/jpeg', 'sample.png');

  assert.equal(result.ok, false);
  assert.match(result.error, /형식이 일치하지 않습니다/);
});

test('validateUploadBuffer allows gallery uploads when magic bytes are valid', () => {
  const result = validateUploadBuffer(createJpegBuffer(), 'image/heic', 'sample.jpg');

  assert.equal(result.ok, true);
  assert.equal(result.detectedMime, 'image/jpeg');
});
