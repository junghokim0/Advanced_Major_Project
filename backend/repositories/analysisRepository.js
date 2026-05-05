const db = require('../config/db');

exports.saveAnalysisResult = async ({ uploadId, resultStage, probability }) => {
  const [result] = await db.execute(
    'INSERT INTO analysis_histories (upload_id, result_stage, probability) VALUES (?, ?, ?)',
    [uploadId, resultStage, probability]
  );

  return result.insertId;
};

exports.getAnalysisHistoryByUserId = async (userId) => {
  const [rows] = await db.query(
    `SELECT 
      ah.id as analysisId,
      ah.result_stage as resultStage,
      ah.probability,
      ah.created_at as analyzedAt,
      u.filename,
      u.originalname,
      u.created_at as uploadedAt
    FROM analysis_histories ah
    JOIN uploads u ON ah.upload_id = u.id
    WHERE u.user_id = ?
    ORDER BY ah.created_at DESC`,
    [userId]
  );

  return rows;
};