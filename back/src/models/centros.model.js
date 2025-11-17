// En este archivo administro las consultas de centros
const pool = require('../config/database');

const CentrosModel = {

  // ----------------------------------------------------------
  // traigo datos del centro segun usuario_id
  // ----------------------------------------------------------
  async obtenerPorUsuarioId(usuarioId) {
    const q = `
      select *
      from centros_hemoterapia
      where usuario_id = $1
      limit 1;
    `;
    const { rows } = await pool.query(q, [usuarioId]);
    return rows[0] || null;
  },

  // ----------------------------------------------------------
  // actualizo datos del centro segun usuario_id
  // ----------------------------------------------------------
  async actualizarPorUsuarioId(usuarioId, data) {
    const permitidos = [
      "nombre",
      "direccion",
      "telefono",
      "email",
      "provincia_id",
      "localidad_id",
      "barrio_id"
    ];

    const sets = [];
    const values = [];
    let i = 1;

    for (const campo of permitidos) {
      if (Object.prototype.hasOwnProperty.call(data, campo)) {
        sets.push(`${campo} = $${i++}`);
        values.push(data[campo]);
      }
    }

    if (sets.length === 0) {
      return this.obtenerPorUsuarioId(usuarioId);
    }

    const q = `
      update centros_hemoterapia
      set ${sets.join(', ')}
      where usuario_id = $${i}
      returning *;
    `;

    values.push(usuarioId);

    const { rows } = await pool.query(q, values);
    return rows[0] || null;
  },

  // ----------------------------------------------------------
  // resumen para dashboard del centro
  // ----------------------------------------------------------
  async obtenerResumen(usuarioId) {
    const centro = await this.obtenerPorUsuarioId(usuarioId);
    if (!centro) return null;

    const q1 = `
      select count(*) as total_donantes
      from donantes
      where localidad_id = $1;
    `;

    const q2 = `
      select count(*) as proximas_campanias
      from campanias
      where localidad_id = $1
        and fecha_inicio >= now();
    `;

    const q3 = `
      select count(*) as notificaciones_enviadas
      from notificaciones_log
      where centro_id = $1;
    `;

    const [{ rows: r1 }, { rows: r2 }, { rows: r3 }] = await Promise.all([
      pool.query(q1, [centro.localidad_id]),
      pool.query(q2, [centro.localidad_id]),
      pool.query(q3, [centro.id])
    ]);

    return {
      centro: centro.nombre,
      total_donantes: Number(r1[0].total_donantes),
      proximas_campanias: Number(r2[0].proximas_campanias),
      notificaciones_enviadas: Number(r3[0].notificaciones_enviadas)
    };
  },

  // ----------------------------------------------------------
  // estos dos los dejo por compatibilidad si algun flujo viejo los llama
  // ----------------------------------------------------------

  async obtenerPorId(id) {
    const query = `
      select id, nombre, direccion, telefono, email
      from centros_hemoterapia
      where id = $1
      limit 1;
    `;
    const { rows } = await pool.query(query, [id]);
    return rows[0] || null;
  },

  async actualizarParcial(id, data) {
    const sets = [];
    const values = [];
    let i = 1;

    const permitidos = ['nombre', 'direccion', 'telefono', 'email'];
    for (const campo of permitidos) {
      if (Object.prototype.hasOwnProperty.call(data, campo) && data[campo] !== undefined) {
        sets.push(`${campo} = $${i++}`);
        values.push(data[campo]);
      }
    }

    if (!sets.length) {
      return this.obtenerPorId(id);
    }

    const query = `
      update centros_hemoterapia
      set ${sets.join(', ')}
      where id = $${i}
      returning id, nombre, direccion, telefono, email;
    `;

    values.push(id);
    const { rows } = await pool.query(query, values);
    return rows[0] || null;
  }

};

module.exports = CentrosModel;
