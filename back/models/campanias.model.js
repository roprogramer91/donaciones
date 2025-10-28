const pool = require('../data/config');

// MODELO DE CAMPAÑAS
const CampaniasModel = {
  async obtenerTodas() {
    const query = `
      SELECT 
        c.centro_id,
        c.id,
        c.nombre,
        c.descripcion,
        c.imagen_url,
        c.fecha_inicio,
        c.fecha_fin,
        c.estado,
        c.localidad_id,
        c.barrio_id,
        l.provincia_id AS provincia_id,
        l.nombre AS localidad_nombre,
        b.nombre AS barrio_nombre
      FROM campanias c
      LEFT JOIN localidades l ON c.localidad_id = l.id
      LEFT JOIN barrios b ON c.barrio_id = b.id
      ORDER BY c.id DESC;
    `;
    const { rows } = await pool.query(query);
    return rows;
  },

  async obtenerPorId(id) {
    const query = `
      SELECT 
        c.centro_id,
        c.id,
        c.nombre,
        c.descripcion,
        c.imagen_url,
        c.fecha_inicio,
        c.fecha_fin,
        c.estado,
        c.localidad_id,
        c.barrio_id,
        l.provincia_id AS provincia_id,
        l.nombre AS localidad_nombre,
        b.nombre AS barrio_nombre
      FROM campanias c
      LEFT JOIN localidades l ON c.localidad_id = l.id
      LEFT JOIN barrios b ON c.barrio_id = b.id
      WHERE c.id = $1
      LIMIT 1;
    `;
    const { rows } = await pool.query(query, [id]);
    return rows[0] || null;
  },

  async crear(campania) {
    const { centro_id, nombre, descripcion, imagen_url, localidad_id, barrio_id, fecha_inicio, fecha_fin } = campania;
    const query = `
      INSERT INTO campanias (centro_id, nombre, descripcion, imagen_url, localidad_id, barrio_id, fecha_inicio, fecha_fin)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING *;
    `;
    const values = [centro_id, nombre, descripcion, imagen_url, localidad_id, barrio_id, fecha_inicio, fecha_fin];
    const { rows } = await pool.query(query, values);
    return rows[0];
  },

  async actualizar(id, data) {
    const { nombre, descripcion, imagen_url, fecha_inicio, fecha_fin, estado } = data;
    const query = `
      UPDATE campanias
      SET nombre=$1, descripcion=$2, imagen_url=$3, fecha_inicio=$4, fecha_fin=$5, estado=$6, updated_at=NOW()
      WHERE id=$7
      RETURNING *;
    `;
    const values = [nombre, descripcion, imagen_url, fecha_inicio, fecha_fin, estado, id];
    const { rows } = await pool.query(query, values);
    return rows[0];
  },

  async eliminar(id) {
    const query = `DELETE FROM campanias WHERE id=$1 RETURNING *;`;
    const { rows } = await pool.query(query, [id]);
    return rows[0];
  }
};

module.exports = CampaniasModel;



// Extra methods
CampaniasModel.obtenerPorCentro = async function (centroId) {
  const query = `
    SELECT 
      c.id,
      c.centro_id,
      c.nombre,
      c.descripcion,
      c.imagen_url,
      c.fecha_inicio,
      c.fecha_fin,
      c.estado,
      c.localidad_id,
      c.barrio_id,
      l.provincia_id AS provincia_id,
      l.nombre AS localidad_nombre,
      b.nombre AS barrio_nombre
    FROM campanias c
    LEFT JOIN localidades l ON c.localidad_id = l.id
    LEFT JOIN barrios b ON c.barrio_id = b.id
    WHERE c.centro_id = $1
    ORDER BY c.fecha_inicio NULLS LAST, c.id DESC;
  `;
  const { rows } = await pool.query(query, [centroId]);
  return rows;
};

// Campañas por localidad (sin estado calculado)
CampaniasModel.obtenerPorLocalidad = async function (localidadId) {
  const query = `
    SELECT 
      c.centro_id,
      c.id,
      c.nombre,
      c.descripcion,
      c.imagen_url,
      c.fecha_inicio,
      c.fecha_fin,
      c.estado,
      c.localidad_id,
      c.barrio_id,
      l.provincia_id AS provincia_id,
      l.nombre AS localidad_nombre,
      b.nombre AS barrio_nombre
    FROM campanias c
    LEFT JOIN localidades l ON c.localidad_id = l.id
    LEFT JOIN barrios b ON c.barrio_id = b.id
    WHERE c.localidad_id = $1
    ORDER BY c.fecha_inicio NULLS LAST, c.id DESC;
  `;
  const { rows } = await pool.query(query, [localidadId]);
  return rows;
};

// Inscribir donante a campaña (crea tabla si no existe)
CampaniasModel.inscribirDonante = async function (campaniaId, usuarioId) {
  // Crear tabla relación si no existe (idempotente)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS campanias_donantes (
      id SERIAL PRIMARY KEY,
      campania_id INTEGER REFERENCES campanias(id) ON DELETE CASCADE,
      usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE (campania_id, usuario_id)
    );
  `);

  // Insertar relación (idempotente)
  const insert = await pool.query(
    `INSERT INTO campanias_donantes (campania_id, usuario_id)
     VALUES ($1, $2)
     ON CONFLICT (campania_id, usuario_id) DO UPDATE SET created_at = NOW()
     RETURNING *;`,
    [campaniaId, usuarioId]
  );

  // Intentar notificar al centro; si no existe tabla/columna, no bloquear la inscripción
  try {
    const camp = await CampaniasModel.obtenerPorId(campaniaId);
    const centroId = camp ? camp.centro_id : null;
    if (centroId) {
      await pool.query(
        `INSERT INTO notificaciones (centro_id, tipo, mensaje)
         VALUES ($1,$2,$3);`,
        [centroId, 'inscripcion', `Usuario ${usuarioId} se inscribió en campaña ${campaniaId}`]
      );
    }
  } catch (_) {
    // noop en dev si la tabla/estructura difiere
  }

  return insert.rows[0];
};
