const test = require('node:test');
const assert = require('node:assert/strict');

const { validateLogin, validateSignup } = require('../middlewares/authValidator');
const { createMockResponse } = require('./httpMocks');

test('validateSignup rejects requests missing email or password', () => {
  const req = { body: { email: '', password: '' } };
  const res = createMockResponse();
  let nextCalled = false;

  validateSignup(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, { error: 'Email and password are required.' });
});

test('validateSignup rejects non-string credentials', () => {
  const req = { body: { email: 123, password: ['Password123!'] } };
  const res = createMockResponse();
  let nextCalled = false;

  validateSignup(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, { error: 'Email and password must be strings.' });
});

test('validateSignup passes valid payloads to the next middleware', () => {
  const req = { body: { email: 'tester@example.com', password: 'Password123!' } };
  const res = createMockResponse();
  let nextCalled = false;

  validateSignup(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(res.body, null);
});

test('validateLogin rejects requests missing credentials', () => {
  const req = { body: { email: '', password: '' } };
  const res = createMockResponse();
  let nextCalled = false;

  validateLogin(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, { error: 'Email and password are required.' });
});

test('validateLogin passes valid payloads to the next middleware', () => {
  const req = { body: { email: 'tester@example.com', password: 'Password123!' } };
  const res = createMockResponse();
  let nextCalled = false;

  validateLogin(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(res.body, null);
});
