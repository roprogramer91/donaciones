const db = require('../data/config');

// Obtener todos los donantes
const obtenerTodos = async () => {
  const result = await db.query('SELECT * FROM donantes ORDER BY id DESC');
  return result.rows;
};

// Guardar un nuevo donante
const guardar = async (nuevo) => {
  const result = await db.query(
    `INSERT INTO donantes (
      usuario_id,
      grupo_sanguineo,
      fecha_nacimiento,
      telefono,
      preferencias_notif,
      fecha_ultima_donacion,
      estado,
      provincia_id,
      localidad_id,
      barrio_id,
      dni,
      sexo
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
    RETURNING *`,
    [
      nuevo.usuario_id,                  // int, obligatorio
      nuevo.grupo_sanguineo,             // string, obligatorio
      nuevo.fecha_nacimiento || null,    // date, opcional
      nuevo.telefono || null,            // string, opcional
      nuevo.preferencias_notif || null,  // string, opcional
      nuevo.fecha_ultima_donacion || null, // date, opcional
      nuevo.estado || 'activo',          // string, default 'activo'
      nuevo.provincia_id || null,        // int, opcional
      nuevo.localidad_id || null,        // int, opcional
      nuevo.barrio_id || null,           // int, opcional
      nuevo.dni,
      nuevo.sexo                          // string, obligatorio
    ]
  );
  return result.rows[0];
};

// Buscar donante por DNI (para evitar duplicados)
const findByDni = async (dni) => {
  const sql = 'SELECT * FROM donantes WHERE dni = $1 LIMIT 1';
  const { rows } = await db.query(sql, [dni]);
  return rows.length > 0 ? rows[0] : null;
};

// Buscar donante por usuario_id (usado al loguear)
const findByUsuarioId = async (usuarioId) => {
  const sql = 'SELECT * FROM donantes WHERE usuario_id = $1 LIMIT 1';
  const { rows } = await db.query(sql, [usuarioId]);
  return rows.length > 0 ? rows[0] : null;
};

 const findByEmail = async (email) => {
  const sql = 'SELECT * FROM donantes WHERE email = $1 LIMIT 1';
  const { rows } = await db.query(sql, [email]);
  return rows.length > 0 ? rows[0] : null;
};

// Buscar donante por usuario_id y obtener donante completo con datos del usuario

const getPerfilCompletoByUsuarioId = async (usuarioId) => {
  const sql = `
    SELECT d.*, u.nombre, u.apellido, u.email,
      p.nombre AS provincia_nombre,
      l.nombre AS localidad_nombre
    FROM donantes d
    JOIN usuarios u ON d.usuario_id = u.id
    LEFT JOIN provincias p ON d.provincia_id = p.id
    LEFT JOIN localidades l ON d.localidad_id = l.id
    WHERE d.usuario_id = $1
    LIMIT 1
  `;
  const { rows } = await db.query(sql, [usuarioId]);
  return rows.length > 0 ? rows[0] : null;
};





module.exports = {
  obtenerTodos,
  guardar,
  findByDni,
  findByUsuarioId,
  findByEmail,
  getPerfilCompletoByUsuarioId
};
