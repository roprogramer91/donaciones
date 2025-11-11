// services/auth/models/usuarios.model.js
const pool = require('../../../data/config');

async function findUserByid(id) {
  const query = 'SELECT * FROM usuarios WHERE id = $1 AND activo = TRUE';
  const { rows } = await pool.query(query, [id]);
  console.log("🟢 Resultado completo de findUserById:", rows);
  return rows[0];
}


async function findUserByDni(dni) {
  const query = 'SELECT * FROM usuarios WHERE dni = $1 AND activo = TRUE';
  const { rows } = await pool.query(query, [dni]);

  return rows[0];
}

async function findUserByEmail(email) {
  const query = 'SELECT * FROM usuarios WHERE email = $1 LIMIT 1';
  const { rows } = await pool.query(query, [email]);
  return rows[0];
}

async function updatePassword(id, hashedPassword) {
  const query = 'UPDATE usuarios SET password_hash = $1 WHERE id = $2';
  await pool.query(query, [hashedPassword, id]);
}


module.exports = { findUserByDni, findUserByid, findUserByEmail, updatePassword };
