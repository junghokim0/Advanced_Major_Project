const db = require('../config/db');
const { VALID_PATTERN_TYPES } = require('../utils/patternType');

exports.saveAnalysisResult = async ({ uploadId, resultStage, probability }) => {
  const [result] = await db.execute(
    'INSERT INTO analysis_histories (upload_id, result_stage, probability) VALUES (?, ?, ?)',
    [uploadId, resultStage, probability]
  );

  return result.insertId;
};

exports.getAnalysisHistoryByUserId = async (userId, patternType = null) => {
  const params = [userId];
  let patternFilter = '';

  if (patternType) {
    if (!VALID_PATTERN_TYPES.includes(patternType)) {
      const error = new Error(`Invalid patternType. Use one of: ${VALID_PATTERN_TYPES.join(', ')}`);
      error.status = 400;
      throw error;
    }
    patternFilter = ' AND u.pattern_type = ?';
    params.push(patternType);
  }

  const [rows] = await db.query(
    `SELECT 
      ah.id as analysisId,
      ah.result_stage as resultStage,
      ah.probability,
      u.pattern_type as patternType,
      CASE
        WHEN ah.result_stage = 'class-1' THEN 1
        WHEN ah.result_stage = 'class-2' THEN 2
        WHEN ah.result_stage = 'class-3' THEN 3
        WHEN ROUND(ah.probability * 100) BETWEEN 1 AND 33 THEN 1
        WHEN ROUND(ah.probability * 100) BETWEEN 34 AND 66 THEN 2
        ELSE 3
      END as category,
      ah.created_at as analyzedAt,
      u.filename,
      u.originalname,
      u.created_at as uploadedAt
    FROM analysis_histories ah
    JOIN uploads u ON ah.upload_id = u.id
    WHERE u.user_id = ?
      AND ah.created_at >= DATE_SUB(NOW(), INTERVAL 1 YEAR)
      ${patternFilter}
    ORDER BY ah.created_at DESC`,
    params
  );

  return rows;
};
