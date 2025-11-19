// En este archivo manejo las consultas de campanias
const pool = require('../config/database');
const Notificaciones = require('./notificaciones.model');
const NOTIFICATION_TYPES = require('../constants/notificationTypes');
const { DONANTE, CENTRO } = NOTIFICATION_TYPES;
const CampaniasModel = {
  async obtenerTodas() {
    const query = `
      SELECT 
        c.centro_id,
        ch.usuario_id AS centro_usuario_id,
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
      LEFT JOIN centros_hemoterapia ch ON ch.id = c.centro_id
      ORDER BY c.id DESC;
    `;
    const { rows } = await pool.query(query);
    return rows;
  },

  async obtenerPorId(id) {
    const query = `
      SELECT 
        c.centro_id,
        ch.usuario_id AS centro_usuario_id,
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
      LEFT JOIN centros_hemoterapia ch ON ch.id = c.centro_id
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



// Aqui agrupo metodos adicionales
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

// Aqui obtengo campanias por localidad sin estado derivado
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

// Aqui inscribo al donante y creo la tabla si falta
CampaniasModel.inscribirDonante = async function (campaniaId, usuarioId) {
  const insert = await pool.query(
    `INSERT INTO campanias_donantes (campania_id, usuario_id)
     VALUES ($1, $2)
     ON CONFLICT (campania_id, usuario_id) DO UPDATE SET created_at = NOW()
     RETURNING *;`,
    [campaniaId, usuarioId]
  );

  try {
    const camp = await CampaniasModel.obtenerPorId(campaniaId);
    const centroUsuarioId = camp?.centro_usuario_id || null;

    await Notificaciones.createForUsuario(usuarioId, {
      tipo: DONANTE.INSCRIPCION_CONFIRMADA,
      mensaje: `Confirmamos tu inscripción a "${camp?.nombre || "una campaña"}".`,
      campania_id: campaniaId,
      meta: {
        campania: {
          id: campaniaId,
          nombre: camp?.nombre,
          fecha_inicio: camp?.fecha_inicio,
          localidad: camp?.localidad_nombre,
        },
      },
    });

    if (centroUsuarioId) {
      await Notificaciones.crear(centroUsuarioId, {
        tipo: CENTRO.DONANTE_INSCRIPTO,
        mensaje: `Un donante se inscribió a "${camp?.nombre || "una campaña"}".`,
        campania_id: campaniaId,
        meta: {
          donante_id: usuarioId,
          campania: { id: campaniaId, nombre: camp?.nombre },
        },
        prioridad: true,
      });
    }
  } catch (error) {
    console.error("Error generando notificaciones de inscripción:", error);
  }

  return insert.rows[0];
};
CampaniasModel.estaInscripto = async function (campaniaId, usuarioId) {
  const { rows } = await pool.query(
    'SELECT 1 FROM campanias_donantes WHERE campania_id=$1 AND usuario_id=$2 LIMIT 1',
    [campaniaId, usuarioId]
  );
  return !!rows[0];
};

CampaniasModel.listarInscripcionesPorUsuario = async function (usuarioId) {
  const { rows } = await pool.query(
    `SELECT 
        c.*,
        l.nombre AS localidad_nombre
     FROM campanias_donantes cd
     JOIN campanias c ON c.id = cd.campania_id
     LEFT JOIN localidades l ON c.localidad_id = l.id
     WHERE cd.usuario_id = $1
     ORDER BY c.fecha_inicio NULLS LAST, c.id DESC`,
    [usuarioId]
  );
  return rows;
};

CampaniasModel.cancelarInscripcion = async function (campaniaId, usuarioId) {
  const { rows } = await pool.query(
    'DELETE FROM campanias_donantes WHERE campania_id=$1 AND usuario_id=$2 RETURNING *',
    [campaniaId, usuarioId]
  );
  const deleted = rows[0] || null;

  if (deleted) {
    try {
      const camp = await CampaniasModel.obtenerPorId(campaniaId);
      const centroUsuarioId = camp?.centro_usuario_id || null;

      await Notificaciones.createForUsuario(usuarioId, {
        tipo: DONANTE.INSCRIPCION_CANCELADA,
        mensaje: `Cancelaste tu participación en "${camp?.nombre || "una campaña"}".`,
        campania_id: campaniaId,
        meta: { campania: { id: campaniaId, nombre: camp?.nombre } },
      });

      if (centroUsuarioId) {
        await Notificaciones.crear(centroUsuarioId, {
          tipo: CENTRO.DONANTE_CANCELA,
          mensaje: `Un donante canceló su inscripción en "${camp?.nombre || "una campaña"}".`,
          campania_id: campaniaId,
          meta: { donante_id: usuarioId, campania: { id: campaniaId, nombre: camp?.nombre } },
        });
      }
    } catch (error) {
      console.error("Error notificando cancelación:", error);
    }
  }

  return deleted;
};
CampaniasModel.listarInscriptosDeCampania = async function (campaniaId) {
  const { rows } = await pool.query(
    `SELECT 
        u.id AS usuario_id,
        u.nombre,
        u.apellido,
        u.email,
        d.grupo_sanguineo,
        cd.created_at AS fecha_inscripcion
     FROM campanias_donantes cd
     JOIN usuarios u ON u.id = cd.usuario_id
     LEFT JOIN donantes d ON d.usuario_id = u.id
     WHERE cd.campania_id = $1
     ORDER BY cd.created_at DESC`,
    [campaniaId]
  );
  return rows;
};




CampaniasModel.listarUsuariosInscriptosIds = async function (campaniaId) {
  const { rows } = await pool.query(
    `SELECT usuario_id FROM campanias_donantes WHERE campania_id = $1`,
    [campaniaId]
  );
  return rows.map((r) => r.usuario_id);
};

CampaniasModel.obtenerCentroUsuarioId = async function (centroId) {
  const { rows } = await pool.query(
    `SELECT usuario_id FROM centros_hemoterapia WHERE id = $1 LIMIT 1`,
    [centroId]
  );
  return rows[0]?.usuario_id || null;
};
