const test = require('node:test');
const assert = require('node:assert/strict');

const { BLUR_ERROR_CODE, parseAiBlurError } = require('../utils/aiErrorParser');

test('parseAiBlurError returns null when AI response detail is missing', () => {
  assert.equal(parseAiBlurError(new Error('network failure')), null);
});

test('parseAiBlurError converts blur response detail into an HTTP 422 error', () => {
  const error = {
    response: {
      data: {
        detail: {
          code: BLUR_ERROR_CODE,
          message: '사진이 흐립니다.',
          blurScore: 45.2,
          minRequired: 80,
        },
      },
    },
  };

  const parsed = parseAiBlurError(error);

  assert.equal(parsed.status, 422);
  assert.equal(parsed.code, BLUR_ERROR_CODE);
  assert.equal(parsed.message, '사진이 흐립니다.');
  assert.equal(parsed.blurScore, 45.2);
  assert.equal(parsed.minBlurScore, 80);
});

test('parseAiBlurError also handles JSON-string detail payloads', () => {
  const error = {
    response: {
      data: {
        detail: JSON.stringify({
          code: BLUR_ERROR_CODE,
          message: '재촬영이 필요합니다.',
          blurScore: 30,
          minRequired: 80,
        }),
      },
    },
  };

  const parsed = parseAiBlurError(error);

  assert.equal(parsed.message, '재촬영이 필요합니다.');
  assert.equal(parsed.blurScore, 30);
  assert.equal(parsed.minBlurScore, 80);
});

test('parseAiBlurError ignores non-blur AI errors', () => {
  const error = {
    response: {
      data: {
        detail: {
          code: 'OTHER_ERROR',
          message: 'unexpected',
        },
      },
    },
  };

  assert.equal(parseAiBlurError(error), null);
});
