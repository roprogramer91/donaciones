// back/src/models/admin.model.js
const pool = require("../config/database");

// =======================================================
// USUARIOS
// =======================================================

// Obtener todos los usuarios del sistema (donante/centro/admin)
async function obtenerUsuarios() {
  const query = `
    SELECT id, nombre, email, dni, telefono, tipo_usuario, activo, created_at
    FROM usuarios
    ORDER BY id DESC
  `;
  const { rows } = await pool.query(query);
  return rows;
}

// Obtener un usuario específico
async function obtenerUsuarioPorId(id) {
  const query = `
    SELECT id, nombre, email, dni, telefono, tipo_usuario, activo, created_at
    FROM usuarios
    WHERE id = $1
  `;
  const { rows } = await pool.query(query, [id]);
  return rows[0];
}

// Cambiar el estado (activar/desactivar)
async function cambiarEstadoUsuario(id, estado) {
  const query = `
    UPDATE usuarios
    SET activo = $1
    WHERE id = $2
    RETURNING id, activo
  `;
  const { rows } = await pool.query(query, [estado, id]);
  return rows[0];
}

// Crear un nuevo centro (usuario + registro de centro)
async function crearCentro({ nombre, direccion, telefono, email, password_hash }) {
  // 1) Creo el usuario base (rol centro)
  const userQuery = `
    INSERT INTO usuarios (email, password_hash, nombre, tipo_usuario, activo)
    VALUES ($1, $2, $3, 'centro', true)
    RETURNING id
  `;
  const userRes = await pool.query(userQuery, [email, password_hash, nombre]);
  const usuarioId = userRes.rows[0].id;

  // 2) Creo el centro referenciando usuario_id
  const centroQuery = `
    INSERT INTO centros_hemoterapia (usuario_id, nombre, direccion, telefono, email, activo)
    VALUES ($1, $2, $3, $4, $5, true)
    RETURNING *
  `;
  const { rows } = await pool.query(centroQuery, [
    usuarioId,
    nombre,
    direccion,
    telefono,
    email
  ]);

  return rows[0];
}

// Crear un nuevo admin técnico
async function crearAdminTecnico({ nombre, email, password_hash }) {
  const query = `
    INSERT INTO usuarios (nombre, email, password_hash, tipo_usuario, activo)
    VALUES ($1, $2, $3, 'admin', true)
    RETURNING id, nombre, email
  `;
  const { rows } = await pool.query(query, [nombre, email, password_hash]);
  return rows[0];
}


// =======================================================
// CENTROS
// =======================================================

async function obtenerCentros() {
  const query = `
    SELECT c.*, u.activo
    FROM centros_hemoterapia c
    LEFT JOIN usuarios u ON c.usuario_id = u.id
    ORDER BY c.id DESC
  `;
  const { rows } = await pool.query(query);
  return rows;
}

async function obtenerCentroPorId(id) {
  const query = `
    SELECT c.*, u.activo
    FROM centros_hemoterapia c
    LEFT JOIN usuarios u ON c.usuario_id = u.id
    WHERE c.id = $1
  `;
  const { rows } = await pool.query(query, [id]);
  return rows[0];
}

async function actualizarCentro(id, datos) {
  const { nombre, direccion, telefono, email } = datos;

  const query = `
    UPDATE centros_hemoterapia
    SET nombre = $1, direccion = $2, telefono = $3, email = $4
    WHERE id = $5
    RETURNING *
  `;
  const { rows } = await pool.query(query, [
    nombre,
    direccion,
    telefono,
    email,
    id
  ]);
  return rows[0];
}

async function eliminarCentro(id) {
  // Busco el usuario asociado
  const { rows } = await pool.query(
    `SELECT usuario_id FROM centros_hemoterapia WHERE id = $1`,
    [id]
  );
  const usuarioId = rows[0]?.usuario_id;

  // Borramos el centro primero
  await pool.query(`DELETE FROM centros_hemoterapia WHERE id = $1`, [id]);

  // Luego el usuario asociado (si existe)
  if (usuarioId) {
    await pool.query(`DELETE FROM usuarios WHERE id = $1`, [usuarioId]);
  }

  return { mensaje: `Centro ${id} y usuario ${usuarioId || "N/A"} eliminados` };
}


// =======================================================
// ESTADÍSTICAS
// =======================================================

async function estadisticasGenerales() {
  const query = `
    SELECT
      (SELECT COUNT(*) FROM usuarios) AS total_usuarios,
      (SELECT COUNT(*) FROM usuarios WHERE tipo_usuario = 'donante') AS total_donantes,
      (SELECT COUNT(*) FROM usuarios WHERE tipo_usuario = 'centro') AS total_centros,
      (SELECT COUNT(*) FROM campanias) AS total_campanias,
      (SELECT COUNT(*) FROM campanias_donantes) AS total_inscripciones
  `;
  const { rows } = await pool.query(query);
  return rows[0];
}


// =======================================================
// AUDITORÍA
// =======================================================

async function obtenerLogs() {
  const query = `
    SELECT *
    FROM notificaciones_log
    ORDER BY id DESC
    LIMIT 200
  `;
  const { rows } = await pool.query(query);
  return rows;
}


module.exports = {
  obtenerUsuarios,
  obtenerUsuarioPorId,
  cambiarEstadoUsuario,
  crearCentro,
  crearAdminTecnico,
  obtenerCentros,
  obtenerCentroPorId,
  actualizarCentro,
  eliminarCentro,
  estadisticasGenerales,
  obtenerLogs
};
