const db = require('../config/db');

exports.saveUploadRecord = async ({
  filename,
  originalname,
  size,
  mimetype,
  patternType,
  userId,
}) => {
  const [result] = await db.execute(
    'INSERT INTO uploads (filename, originalname, size, mimetype, pattern_type, user_id) VALUES (?, ?, ?, ?, ?, ?)',
    [filename, originalname, size, mimetype, patternType, userId]
  );

  return result.insertId;
};
