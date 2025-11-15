// En este archivo administro las notificaciones dinamicas
const pool = require('../config/database');

let schema;
async function loadSchema() {
  if (schema) return schema;
  const q = `SELECT column_name FROM information_schema.columns WHERE table_name='notificaciones'`;
  const { rows } = await pool.query(q);
  const cols = rows.map(r => r.column_name);
  schema = {
    hasUsuario: cols.includes('usuario_id'),
    hasDonante: cols.includes('donante_id'),
    hasCampania: cols.includes('campania_id'),
    hasCampaña: cols.includes('campaña_id'),
    hasLeida: cols.includes('leida'),
    hasCreatedAt: cols.includes('created_at'),
    hasFechaEnvio: cols.includes('fecha_envio'),
    hasTipo: cols.includes('tipo'),
    hasEstado: cols.includes('estado')
  };
  return schema;
}

const Notificaciones = {
  async getForUsuario(usuarioId, limit = 20) {
    const s = await loadSchema();
    if (s.hasUsuario) {
      const { rows } = await pool.query(
        `SELECT id,
                ${s.hasTipo ? 'tipo' : `COALESCE(estado,'aviso') as tipo`},
                mensaje,
                ${s.hasCampania ? 'campania_id' : (s.hasCampaña ? '"campaña_id" as campania_id' : 'NULL::int as campania_id')},
                ${s.hasLeida ? 'leida' : `CASE WHEN ${s.hasEstado ? "estado='leida'" : 'FALSE'} THEN TRUE ELSE FALSE END as leida`},
                ${s.hasCreatedAt ? 'created_at' : (s.hasFechaEnvio ? 'fecha_envio as created_at' : 'NOW() as created_at')}
         FROM notificaciones
         WHERE usuario_id = $1
         ORDER BY ${s.hasCreatedAt ? 'created_at' : (s.hasFechaEnvio ? 'fecha_envio' : 'id')} DESC
         LIMIT $2`,
        [usuarioId, limit]
      );
      return rows;
    } else if (s.hasDonante) {
      const { rows } = await pool.query(
        `SELECT n.id,
                ${s.hasTipo ? 'n.tipo' : `COALESCE(n.estado,'aviso') as tipo`},
                n.mensaje,
                ${s.hasCampania ? 'n.campania_id' : (s.hasCampaña ? 'n."campaña_id" as campania_id' : 'NULL::int as campania_id')},
                ${s.hasLeida ? 'n.leida' : `CASE WHEN ${s.hasEstado ? "n.estado='leida'" : 'FALSE'} THEN TRUE ELSE FALSE END as leida`},
                ${s.hasCreatedAt ? 'n.created_at' : (s.hasFechaEnvio ? 'n.fecha_envio as created_at' : 'NOW() as created_at')}
         FROM notificaciones n
         JOIN donantes d ON d.id = n.donante_id
         WHERE d.usuario_id = $1
         ORDER BY ${s.hasCreatedAt ? 'n.created_at' : (s.hasFechaEnvio ? 'n.fecha_envio' : 'n.id')} DESC
         LIMIT $2`,
        [usuarioId, limit]
      );
      return rows;
    } else {
      return [];
    }
  },

  async marcarLeida(id, usuarioId) {
    const s = await loadSchema();
    if (s.hasUsuario && s.hasLeida) {
      const { rows } = await pool.query(
        `UPDATE notificaciones SET leida = TRUE WHERE id = $1 AND usuario_id = $2 RETURNING *`,
        [id, usuarioId]
      );
      return rows[0] || null;
    } else if (s.hasDonante) {
      // Aqui hago el fallback seteando estado='leida'
      const { rows } = await pool.query(
        `UPDATE notificaciones n SET estado = 'leida'
         FROM donantes d
         WHERE n.id = $1 AND n.donante_id = d.id AND d.usuario_id = $2
         RETURNING n.*`,
        [id, usuarioId]
      );
      return rows[0] || null;
    }
    return null;
  },

  async createForUsuario(usuarioId, { tipo, mensaje, campania_id = null }) {
    const s = await loadSchema();
    if (s.hasUsuario) {
      const { rows } = await pool.query(
        `INSERT INTO notificaciones (usuario_id, ${s.hasTipo ? 'tipo' : 'estado'}, mensaje, ${s.hasCampania ? 'campania_id' : (s.hasCampaña ? '"campaña_id"' : 'campania_id')})
         VALUES ($1,$2,$3,$4) RETURNING *`,
        [usuarioId, tipo || 'aviso', mensaje, campania_id]
      );
      return rows[0];
    } else if (s.hasDonante) {
      // Aqui mapeo el usuario con su donante
      const { rows: drows } = await pool.query('SELECT id FROM donantes WHERE usuario_id = $1 LIMIT 1', [usuarioId]);
      const donanteId = drows[0] ? drows[0].id : null;
      if (!donanteId) return null;
      const colCamp = s.hasCampania ? 'campania_id' : (s.hasCampaña ? '"campaña_id"' : null);
      const cols = ['donante_id', s.hasTipo ? 'tipo' : 'estado', 'mensaje'];
      const vals = [donanteId, tipo || 'aviso', mensaje];
      if (colCamp) { cols.push(colCamp); vals.push(campania_id); }
      const params = vals.map((_,i)=>`$${i+1}`).join(',');
      const { rows } = await pool.query(`INSERT INTO notificaciones (${cols.join(',')}) VALUES (${params}) RETURNING *`, vals);
      return rows[0];
    }
    return null;
  },

  async createForDonantesByLocalidad(localidadId, { tipo, mensaje, campania_id = null }) {
    const s = await loadSchema();
    if (s.hasUsuario) {
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
        values.push(u.usuario_id, tipo || 'aviso', mensaje, campania_id);
      }
      await pool.query(
        `INSERT INTO notificaciones (usuario_id, ${s.hasTipo ? 'tipo' : 'estado'}, mensaje, ${s.hasCampania ? 'campania_id' : (s.hasCampaña ? '"campaña_id"' : 'campania_id')})
         VALUES ${params.join(',')}`,
        values
      );
      return usuarios.length;
    } else if (s.hasDonante) {
      // Aqui inserto usando el donante_id
      const { rows: dons } = await pool.query(
        `SELECT id FROM donantes WHERE localidad_id = $1`,
        [localidadId]
      );
      if (!dons.length) return 0;
      const colCamp = s.hasCampania ? 'campania_id' : (s.hasCampaña ? '"campaña_id"' : null);
      let sql = `INSERT INTO notificaciones (donante_id, ${s.hasTipo ? 'tipo' : 'estado'}, mensaje`;
      if (colCamp) sql += `, ${colCamp}`;
      sql += `) VALUES `;
      const params = [];
      const values = [];
      let i = 1;
      for (const d of dons) {
        const tuple = [`$${i++}`, `$${i++}`, `$${i++}`];
        values.push(d.id, tipo || 'aviso', mensaje);
        if (colCamp) { tuple.push(`$${i++}`); values.push(campania_id); }
        params.push(`(${tuple.join(',')})`);
      }
      sql += params.join(',');
      await pool.query(sql, values);
      return dons.length;
    }
  return 0;
},

async getHistorial() {
    const s = await loadSchema();

    const colFecha = s.hasCreatedAt
      ? 'created_at'
      : s.hasFechaEnvio
      ? 'fecha_envio'
      : 'NOW() as fecha_envio';
    const colTipo = s.hasTipo ? 'tipo' : (s.hasEstado ? 'estado' : "'info' as tipo");

    const { rows } = await pool.query(
      `SELECT 
         id,
         ${s.hasUsuario ? 'usuario_id' : (s.hasDonante ? 'donante_id' : 'NULL::int as usuario_id')},
         ${s.hasCampania ? 'campania_id' : (s.hasCampaña ? '"campaña_id" as campania_id' : 'NULL::int as campania_id')},
         ${colTipo},
         mensaje,
         ${colFecha}
       FROM notificaciones
       ORDER BY ${s.hasCreatedAt ? 'created_at' : (s.hasFechaEnvio ? 'fecha_envio' : 'id')} DESC
       LIMIT 50`
    );
    return rows;
  }
};

module.exports = Notificaciones;


