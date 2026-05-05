const analysisService = require('../services/analysisService');

exports.getHistory = async (req, res, next) => {
  try {
    const history = await analysisService.getAnalysisHistory(req.user.userId);
    res.json({ data: history });
  } catch (error) {
    next(error);
  }
};