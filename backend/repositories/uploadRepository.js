const db = require('../config/db');

exports.saveUploadRecord = async ({ filename, originalname, size, mimetype, userId }) => {
  const [result] = await db.execute(
    'INSERT INTO uploads (filename, originalname, size, mimetype, user_id) VALUES (?, ?, ?, ?, ?)',
    [filename, originalname, size, mimetype, userId]
  );

  return result.insertId;
};