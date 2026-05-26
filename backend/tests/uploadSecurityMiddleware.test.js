const test = require('node:test');
const assert = require('node:assert/strict');

const { requireHttpsWhenEnabled } = require('../middlewares/uploadSecurityMiddleware');
const { createMockResponse } = require('./httpMocks');

const originalRequireHttps = process.env.REQUIRE_HTTPS;

test.after(() => {
  process.env.REQUIRE_HTTPS = originalRequireHttps;
});

test('requireHttpsWhenEnabled allows requests when HTTPS enforcement is disabled', () => {
  process.env.REQUIRE_HTTPS = 'false';

  const req = {
    secure: false,
    get() {
      return undefined;
    },
  };
  const res = createMockResponse();
  let nextCalled = false;

  requireHttpsWhenEnabled(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(res.body, null);
});

test('requireHttpsWhenEnabled allows proxied HTTPS requests', () => {
  process.env.REQUIRE_HTTPS = 'true';

  const req = {
    secure: false,
    get(headerName) {
      return headerName === 'x-forwarded-proto' ? 'https' : undefined;
    },
  };
  const res = createMockResponse();
  let nextCalled = false;

  requireHttpsWhenEnabled(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(res.body, null);
});

test('requireHttpsWhenEnabled rejects insecure requests when HTTPS is required', () => {
  process.env.REQUIRE_HTTPS = 'true';

  const req = {
    secure: false,
    get() {
      return undefined;
    },
  };
  const res = createMockResponse();
  let nextCalled = false;

  requireHttpsWhenEnabled(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 403);
  assert.match(res.body.error, /HTTPS 연결이 필요합니다/);
});
