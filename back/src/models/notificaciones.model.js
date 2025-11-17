// En este archivo manejo las consultas a la DB sobre notificaciones
const pool = require("../config/database");
const { sendMail } = require("../services/auth/utils/mailer");

const NotificacionesModel = {
  // ----------------------------------------------------------
  // CREACION DE NOTIFICACIONES
  // ----------------------------------------------------------

  async crear(usuarioId, { tipo, mensaje, campania_id = null }) {
    const q = `
      INSERT INTO notificaciones (usuario_id, tipo, mensaje, campania_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const { rows } = await pool.query(q, [
      usuarioId,
      tipo,
      mensaje,
      campania_id,
    ]);
    return rows[0];
  },

  async crearBatch(usuariosIds, tipo, mensaje) {
    if (!usuariosIds || usuariosIds.length === 0) return [];

    const values = usuariosIds
      .map((uid) => `(${uid}, '${tipo}', '${mensaje.replace(/'/g, "''")}')`)
      .join(", ");

    const q = `
      INSERT INTO notificaciones (usuario_id, tipo, mensaje)
      VALUES ${values}
      RETURNING *;
    `;
    const { rows } = await pool.query(q);
    return rows;
  },

  async createForDonantesByLocalidad(
    localidadId,
    { tipo, mensaje, campania_id }
  ) {
    const q = `
      INSERT INTO notificaciones (usuario_id, tipo, mensaje, campania_id)
      SELECT usuario_id, $2, $3, $4
      FROM donantes
      WHERE localidad_id = $1
      RETURNING *;
    `;
    const { rows } = await pool.query(q, [
      localidadId,
      tipo,
      mensaje,
      campania_id,
    ]);
    return rows;
  },

  async enviarNotificacionIndividual({
    usuario_id,
    tipo,
    mensaje,
    email_destinatario,
    email_asunto,
  }) {
    await this.crear(usuario_id, { tipo, mensaje });
    if (email_destinatario && email_asunto) {
      await sendMail(email_destinatario, email_asunto, `<p>${mensaje}</p>`);
    }
  },

  // ----------------------------------------------------------
  // LECTURA DE NOTIFICACIONES
  // ----------------------------------------------------------

  async getForUsuario(usuarioId, limit = 50) {
    const q = `
      SELECT * FROM notificaciones
      WHERE usuario_id = $1
      ORDER BY created_at DESC
      LIMIT $2;
    `;
    const { rows } = await pool.query(q, [usuarioId, limit]);
    return rows;
  },

  // ----------------------------------------------------------
  // ACTUALIZACION DE NOTIFICACIONES
  // ----------------------------------------------------------

  async marcarLeida(notificacionId, usuarioId) {
    const q = `
      UPDATE notificaciones
      SET leida = TRUE, leida_at = NOW()
      WHERE id = $1 AND usuario_id = $2
      RETURNING *;
    `;
    const { rows } = await pool.query(q, [notificacionId, usuarioId]);
    return rows[0];
  },

  // ----------------------------------------------------------
  // LOGS DE NOTIFICACIONES (para el centro)
  // ----------------------------------------------------------

  async registrarLog(centroId, tipo, mensaje, cantidad, meta) {
    const q = `
      INSERT INTO notificaciones_log (centro_id, tipo, mensaje, cantidad_enviados, meta)
      VALUES ($1, $2, $3, $4, $5);
    `;
    await pool.query(q, [centroId, tipo, mensaje, cantidad, meta]);
  },

  async getLogCentro(centroId, limit = 50) {
    const q = `SELECT * FROM notificaciones_log WHERE centro_id = $1 ORDER BY fecha DESC LIMIT $2;`;
    const { rows } = await pool.query(q, [centroId, limit]);
    return rows;
  },
};

module.exports = NotificacionesModel;
