// En este archivo administro datos puntuales de usuarios
const db = require('../config/database');

// Aqui actualizo los roles almacenados en la tabla usuarios
async function updateRoles(userId, roles) {
  const sql = 'UPDATE usuarios SET roles = $1 WHERE id = $2';
  await db.query(sql, [roles, userId]);
}

// Aqui busco un usuario por su id
async function findUserById(id) {
  const sql = 'SELECT * FROM usuarios WHERE id = $1 LIMIT 1';
  const { rows } = await db.query(sql, [id]);
  return rows.length > 0 ? rows[0] : null;
}

// Aqui valido si existe un donante relacionado a ese usuario
async function findDonanteByUserId(usuarioId) {
  const sql = 'SELECT * FROM donantes WHERE usuario_id = $1 LIMIT 1';
  const { rows } = await db.query(sql, [usuarioId]);
  return rows.length > 0 ? rows[0] : null;
}

module.exports = {
  updateRoles,
  findUserById,
  findDonanteByUserId
};
