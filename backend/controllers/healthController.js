const healthService = require('../services/healthService');

exports.checkHealth = async (req, res, next) => {
  try {
    const result = await healthService.getHealthStatus();
    res.json(result);
  } catch (error) {
    next(error);
  }
};
