// En este archivo manejo las consultas a la DB sobre notificaciones
const pool = require("../config/database");
const { sendMail } = require("../services/auth/utils/mailer");

const NotificacionesModel = {
  // ----------------------------------------------------------
  // CREACION DE NOTIFICACIONES
  // ----------------------------------------------------------

  async crear(
    usuarioId,
    { tipo, mensaje, campania_id = null, meta = {}, prioridad = false }
  ) {
    const q = `
      INSERT INTO notificaciones (usuario_id, tipo, mensaje, campania_id, meta, prioridad)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const { rows } = await pool.query(q, [
      usuarioId,
      tipo,
      mensaje,
      campania_id,
      JSON.stringify(meta || {}),
      prioridad,
    ]);
    return rows[0];
  },

  async createForUsuario(usuarioId, payload) {
    return this.crear(usuarioId, payload);
  },

  async crearBatch(
    usuariosIds,
    tipo,
    mensaje,
    { campania_id = null, meta = {}, prioridad = false } = {}
  ) {
    if (!usuariosIds || usuariosIds.length === 0) return [];

    const q = `
      INSERT INTO notificaciones (usuario_id, tipo, mensaje, campania_id, meta, prioridad)
      SELECT unnest($1::int[]), $2, $3, $4, $5::jsonb, $6
      RETURNING *;
    `;
    const { rows } = await pool.query(q, [
      usuariosIds,
      tipo,
      mensaje,
      campania_id,
      JSON.stringify(meta || {}),
      prioridad,
    ]);
    return rows;
  },

  async createForDonantesByLocalidad(
    localidadId,
    { tipo, mensaje, campania_id, meta = {}, prioridad = false }
  ) {
    const q = `
      INSERT INTO notificaciones (usuario_id, tipo, mensaje, campania_id, meta, prioridad)
      SELECT usuario_id, $2, $3, $4, $5::jsonb, $6
      FROM donantes
      WHERE localidad_id = $1
      RETURNING *;
    `;
    const { rows } = await pool.query(q, [
      localidadId,
      tipo,
      mensaje,
      campania_id,
      JSON.stringify(meta || {}),
      prioridad,
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
    await this.crear(usuario_id, { tipo, mensaje, meta });
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
      INSERT INTO notificaciones_log (centro_id, tipo, mensaje, enviados, filtros, meta, campania_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7);
    `;
    await pool.query(q, [
      centroId,
      tipo,
      mensaje,
      cantidad,
      meta?.filtros || null,
      JSON.stringify(meta || {}),
      meta?.campania_id || null,
    ]);
  },

  async getLogCentro(centroId, limit = 50) {
    const q = `SELECT * FROM notificaciones_log WHERE centro_id = $1 ORDER BY created_at DESC LIMIT $2;`;
    const { rows } = await pool.query(q, [centroId, limit]);
    return rows;
  },
};

module.exports = NotificacionesModel;
