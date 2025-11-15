// En este archivo persisto y valido codigos de verificacion
const pool = require('../../../config/database');

async function createVerification(usuarioId, codigo, tipo) {
  const query = `
      INSERT INTO verificaciones_2fa (usuario_id, codigo, tipo)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
  const { rows } = await pool.query(query, [usuarioId, codigo, tipo]);
  return rows[0];
}

async function verifyCode(usuarioId, codigo) {
  const query = `
      SELECT * FROM verificaciones_2fa
      WHERE usuario_id = $1 AND codigo = $2 AND usado = FALSE AND expiracion > NOW()
      ORDER BY creado_en DESC
      LIMIT 1;
    `;
  console.log('Verificando codigo 2FA para usuario', usuarioId);
  const { rows } = await pool.query(query, [usuarioId, codigo]);
  return rows[0];
}

async function markCodeAsUsed(id) {
  const query = 'UPDATE verificaciones_2fa SET usado = TRUE WHERE id = $1';
  await pool.query(query, [id]);
}

module.exports = { createVerification, verifyCode, markCodeAsUsed };
