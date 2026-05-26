const test = require('node:test');
const assert = require('node:assert/strict');

const { signToken, verifyToken } = require('../utils/jwt');

test('signToken and verifyToken round-trip the user payload', () => {
  const token = signToken({ userId: 7, email: 'tester@example.com' });
  const payload = verifyToken(token);

  assert.equal(payload.userId, 7);
  assert.equal(payload.email, 'tester@example.com');
  assert.ok(payload.iat);
  assert.ok(payload.exp);
});

test('verifyToken rejects invalid JWT strings', () => {
  assert.throws(() => verifyToken('not-a-token'));
});
