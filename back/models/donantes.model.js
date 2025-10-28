// back/models/donantes.model.js
// Modelo para gestionar donantes

const db = require('../data/config');

// Obtener todos los donantes
const obtenerTodos = async () => {
  const result = await db.query(`
    SELECT d.*, u.nombre, u.apellido, u.email
    FROM donantes d
    JOIN usuarios u ON d.usuario_id = u.id
    ORDER BY d.id DESC
  `);
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
      nuevo.usuario_id,
      nuevo.grupo_sanguineo,
      nuevo.fecha_nacimiento || null,
      nuevo.telefono || null,
      nuevo.preferencias_notif || null,
      nuevo.fecha_ultima_donacion || null,
      nuevo.estado || 'activo',
      nuevo.provincia_id || null,
      nuevo.localidad_id || null,
      nuevo.barrio_id || null,
      nuevo.dni,
      nuevo.sexo
    ]
  );
  return result.rows[0];
};

// Buscar por DNI
const findByDni = async (dni) => {
  const sql = 'SELECT * FROM donantes WHERE dni = $1 LIMIT 1';
  const { rows } = await db.query(sql, [dni]);
  return rows[0] || null;
};

// Buscar por usuario_id
const findByUsuarioId = async (usuarioId) => {
  const sql = 'SELECT * FROM donantes WHERE usuario_id = $1 LIMIT 1';
  const { rows } = await db.query(sql, [usuarioId]);
  return rows[0] || null;
};

// Buscar por email
const findByEmail = async (email) => {
  const sql = `
    SELECT d.*, u.nombre, u.apellido, u.email
    FROM donantes d
    JOIN usuarios u ON d.usuario_id = u.id
    WHERE u.email = $1
    LIMIT 1
  `;
  const { rows } = await db.query(sql, [email]);
  return rows[0] || null;
};

// Perfil completo del donante
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
  return rows[0] || null;
};

//Filtrar donantes + JOIN (para Centro)
const filtrar = async (filtros) => {
  const condiciones = [];
  const valores = [];

  if (filtros.provincia) {
    condiciones.push(`d.provincia_id = $${condiciones.length + 1}`);
    valores.push(filtros.provincia);
  }
  if (filtros.localidad) {
    condiciones.push(`d.localidad_id = $${condiciones.length + 1}`);
    valores.push(filtros.localidad);
  }
  if (filtros.barrio) {
    condiciones.push(`d.barrio_id = $${condiciones.length + 1}`);
    valores.push(filtros.barrio);
  }
  if (filtros.grupo) {
    condiciones.push(`d.grupo_sanguineo = $${condiciones.length + 1}`);
    valores.push(filtros.grupo);
  }
  if (filtros.estado) {
    condiciones.push(`d.estado = $${condiciones.length + 1}`);
    valores.push(filtros.estado);
  }

  let sql = `
    SELECT d.*, u.nombre, u.apellido, u.email,
           p.nombre AS provincia_nombre,
           l.nombre AS localidad_nombre
    FROM donantes d
    JOIN usuarios u ON d.usuario_id = u.id
    LEFT JOIN provincias p ON d.provincia_id = p.id
    LEFT JOIN localidades l ON d.localidad_id = l.id
  `;

  if (condiciones.length > 0) {
    sql += ' WHERE ' + condiciones.join(' AND ');
  }

  sql += ' ORDER BY d.id DESC';

  const { rows } = await db.query(sql, valores);
  return rows;
};


// Actualizar perfil por usuario_id (campos permitidos)
const updatePerfilByUsuarioId = async (usuarioId, data) => {
  const payload = { ...data };

  // Normalizar strings vacíos a null donde aplique
  ['fecha_nacimiento', 'telefono'].forEach(k => {
    if (payload[k] === '') payload[k] = null;
  });

  // Solo estos campos se pueden editar
  const allowed = [
    'grupo_sanguineo',
    'fecha_nacimiento',
    'telefono',
    'provincia_id',
    'localidad_id',
    'barrio_id',
  ];

  const sets = [];
  const values = [];
  let i = 1;

  // Copiar únicamente campos permitidos
  for (const k of allowed) {
    if (Object.prototype.hasOwnProperty.call(payload, k) && payload[k] !== undefined) {
      let val = payload[k];
      if (['provincia_id', 'localidad_id', 'barrio_id'].includes(k) && val !== null && val !== '') {
        const n = parseInt(val, 10);
        if (!Number.isNaN(n)) val = n; else continue;
      }
      sets.push(`${k} = $${i++}`);
      values.push(val);
    }
  }

  // Si no hay nada que actualizar, devolvés el perfil actual
  if (sets.length === 0) {
    return await getPerfilCompletoByUsuarioId(usuarioId);
  }

  const sql = `UPDATE donantes SET ${sets.join(', ')} WHERE usuario_id = $${i} RETURNING *`;
  values.push(usuarioId);

  const { rows } = await db.query(sql, values);
  if (!rows[0]) return null;

  // Devolver el perfil completo con joins de nombres
  return await getPerfilCompletoByUsuarioId(usuarioId);
};


module.exports = {
  obtenerTodos,
  guardar,
  findByDni,
  findByUsuarioId,
  findByEmail,
  getPerfilCompletoByUsuarioId,
  updatePerfilByUsuarioId,
  filtrar
};

// BAJA TOTAL DEL DONANTE (y usuario)
module.exports.bajaTotalByUsuarioId = async function(usuarioId) {
  await db.query('BEGIN');
  try {
    await db.query('DELETE FROM campanias_donantes WHERE usuario_id = $1', [usuarioId]);
    await db.query('DELETE FROM donantes WHERE usuario_id = $1', [usuarioId]);
    await db.query('DELETE FROM usuarios WHERE id = $1', [usuarioId]);
    await db.query('COMMIT');
    return true;
  } catch (e) {
    await db.query('ROLLBACK');
    throw e;
  }
};
