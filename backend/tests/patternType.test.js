const test = require('node:test');
const assert = require('node:assert/strict');

const { normalizePatternType } = require('../utils/patternType');

test('normalizePatternType defaults to crown when omitted', () => {
  assert.equal(normalizePatternType(), 'crown');
});

test('normalizePatternType trims and lowercases valid values', () => {
  assert.equal(normalizePatternType('  M_LINE  '), 'm_line');
});

test('normalizePatternType throws a 400 error for invalid values', () => {
  assert.throws(
    () => normalizePatternType('side'),
    (error) => {
      assert.equal(error.status, 400);
      assert.match(error.message, /Invalid patternType/);
      return true;
    }
  );
});
