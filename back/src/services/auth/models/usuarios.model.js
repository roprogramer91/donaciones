// En este archivo gestiono las consultas de usuarios para auth
const pool = require('../../../config/database');

async function createUser({ nombre, email, dni, password_hash, tipo_usuario, activo }) {
  const query = `
    INSERT INTO usuarios 
    (nombre, email, dni, password_hash, tipo_usuario, activo, created_at)
    VALUES ($1, $2, $3, $4, $5, $6, NOW())
    RETURNING id;
  `;

  const values = [
    nombre,
    email,
    dni,
    password_hash,
    tipo_usuario,
    activo
  ];

  const { rows } = await pool.query(query, values);
  return rows[0];
}

async function findUserByid(id) {
  const query = 'SELECT * FROM usuarios WHERE id = $1 AND activo = TRUE';
  const { rows } = await pool.query(query, [id]);
  console.log("Resultado completo de findUserById:", rows);
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

module.exports = { createUser, findUserByDni, findUserByid, findUserByEmail, updatePassword };
