const VALID_PATTERN_TYPES = ['crown', 'm_line'];

exports.VALID_PATTERN_TYPES = VALID_PATTERN_TYPES;

exports.normalizePatternType = (value) => {
  const normalized = String(value || 'crown').trim().toLowerCase();
  if (!VALID_PATTERN_TYPES.includes(normalized)) {
    const error = new Error(`Invalid patternType. Use one of: ${VALID_PATTERN_TYPES.join(', ')}`);
    error.status = 400;
    throw error;
  }
  return normalized;
};
