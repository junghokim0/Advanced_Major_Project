const db = require('../config/db');

exports.findByEmail = async (email) => {
  const [rows] = await db.query(
    'SELECT id, email, password, created_at FROM users WHERE email = ?',
    [email]
  );
  return rows[0];
};

exports.createUser = async ({ email, password }) => {
  const [result] = await db.execute(
    'INSERT INTO users (email, password) VALUES (?, ?)',
    [email, password]
  );

  const [rows] = await db.query(
    'SELECT id, email, created_at FROM users WHERE id = ?',
    [result.insertId]
  );

  return rows[0];
};
