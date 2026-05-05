const healthRepository = require('../repositories/healthRepository');

exports.getHealthStatus = async () => {
  const dbStatus = await healthRepository.pingDatabase();
  return {
    status: 'ok',
    database: dbStatus ? 'connected' : 'unavailable',
  };
};
