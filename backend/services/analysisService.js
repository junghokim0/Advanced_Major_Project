const analysisRepository = require('../repositories/analysisRepository');

exports.getAnalysisHistory = async (userId) => {
  const history = await analysisRepository.getAnalysisHistoryByUserId(userId);
  return history;
};