const db = require('../config/db');

exports.pingDatabase = async () => {
  try {
    const [rows] = await db.query('SELECT 1');
    return Array.isArray(rows);
  } catch (error) {
    console.error('Database ping failed', error);
    return false;
  }
};
