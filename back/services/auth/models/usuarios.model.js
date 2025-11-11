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


module.exports = { findUserByDni, findUserByid };
