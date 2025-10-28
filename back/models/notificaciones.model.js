const pool = require('../data/config');

const Notificaciones = {
  async getForUsuario(usuarioId, limit = 20) {
    const { rows } = await pool.query(
      `SELECT id, tipo, mensaje, campania_id, leida, created_at
       FROM notificaciones
       WHERE usuario_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [usuarioId, limit]
    );
    return rows;
  },

  async marcarLeida(id, usuarioId) {
    const { rows } = await pool.query(
      `UPDATE notificaciones SET leida = TRUE WHERE id = $1 AND usuario_id = $2 RETURNING *`,
      [id, usuarioId]
    );
    return rows[0] || null;
  },

  async createForUsuario(usuarioId, { tipo, mensaje, campania_id = null }) {
    const { rows } = await pool.query(
      `INSERT INTO notificaciones (usuario_id, tipo, mensaje, campania_id)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [usuarioId, tipo, mensaje, campania_id]
    );
    return rows[0];
  },

  async createForDonantesByLocalidad(localidadId, { tipo, mensaje, campania_id = null }) {
    // Obtener usuarios de los donantes de esa localidad
    const { rows: usuarios } = await pool.query(
      `SELECT u.id as usuario_id
       FROM donantes d JOIN usuarios u ON d.usuario_id = u.id
       WHERE d.localidad_id = $1`,
      [localidadId]
    );
    if (!usuarios.length) return 0;
    const values = [];
    const params = [];
    let i = 1;
    for (const u of usuarios) {
      params.push(`($${i++}, $${i++}, $${i++}, $${i++})`);
      values.push(u.usuario_id, tipo, mensaje, campania_id);
    }
    await pool.query(
      `INSERT INTO notificaciones (usuario_id, tipo, mensaje, campania_id)
       VALUES ${params.join(',')}`,
      values
    );
    return usuarios.length;
  }
};

module.exports = Notificaciones;

