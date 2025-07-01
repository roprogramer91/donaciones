const db = require('../data/config');

async function updateRoles(userId, roles) {
  // Si el campo en la tabla es tipo text[] (array)
  const sql = 'UPDATE usuarios SET roles = $1 WHERE id = $2';
  await db.query(sql, [roles, userId]);
  // Si es text plano: await db.query('UPDATE users SET roles = $1 WHERE id = $2', [roles.join(','), userId]);
}

// Buscar usuario por ID
async function findUserById(id) {
  const sql = 'SELECT * FROM usuarios WHERE id = $1 LIMIT 1';
  const { rows } = await db.query(sql, [id]);
  return rows.length > 0 ? rows[0] : null;
}

// Buscar si el usuario es donante (está en la tabla donantes)
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
