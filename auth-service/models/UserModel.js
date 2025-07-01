const db = require('../config/database');

// Buscar usuario por Google ID
async function findUserByGoogleId(googleid) {
  const sql = 'SELECT * FROM usuarios WHERE googleid = $1 LIMIT 1';
  const { rows } = await db.query(sql, [googleid]);
  return rows.length > 0 ? rows[0] : null;
}

// Buscar usuario por email
async function findUserByEmail(email) {
  const sql = 'SELECT * FROM usuarios WHERE email = $1 LIMIT 1';
  const { rows } = await db.query(sql, [email]);
  return rows.length > 0 ? rows[0] : null;
}

// Crear usuario
async function createUser({ googleid, nombre, apellido, email }) {
  const sql = `
    INSERT INTO usuarios (googleid, nombre, apellido, email)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
  `;
  const { rows } = await db.query(sql, [googleid, nombre, apellido, email]);
  return rows[0];
}

module.exports = {
  findUserByGoogleId,
  findUserByEmail,
  createUser
};
