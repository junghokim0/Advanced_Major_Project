const analysisRepository = require('../repositories/analysisRepository');
const { normalizePatternType } = require('../utils/patternType');

exports.getAnalysisHistory = async (userId, patternTypeInput) => {
  const patternType = patternTypeInput ? normalizePatternType(patternTypeInput) : null;
  const history = await analysisRepository.getAnalysisHistoryByUserId(userId, patternType);
  return history;
};
