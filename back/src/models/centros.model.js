// En este archivo administro las consultas de centros
const pool = require('../config/database');
const { calcularAptoYRestante } = require('../utils/donanteUtils');

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

    const hoy = new Date();

    const [donantesRes, campaniasRes, notificacionesRes] = await Promise.all([
      pool.query(
        `
          SELECT grupo_sanguineo, fecha_ultima_donacion, sexo
          FROM donantes
        `
      ),
      pool.query(
        `
          SELECT id, nombre, fecha_inicio, fecha_fin, estado
          FROM campanias
        `
      ),
      pool.query(
        `
          SELECT COALESCE(SUM(enviados), 0) AS total
          FROM notificaciones_log
          WHERE centro_id = $1
        `,
        [centro.id]
      ),
    ]);

    const donantes = donantesRes.rows || [];
    const campanias = campaniasRes.rows || [];
    const notificaciones_enviadas = Number(
      notificacionesRes.rows?.[0]?.total || 0
    );

    let donantes_aptos_hoy = 0;
    const aptos_por_grupo = {};

    donantes.forEach((d) => {
      const sexo = d.sexo || "M";
      const { apto } = calcularAptoYRestante(
        d.fecha_ultima_donacion,
        sexo,
        hoy
      );
      if (apto) {
        donantes_aptos_hoy += 1;
        const grupo = d.grupo_sanguineo || "Sin grupo";
        aptos_por_grupo[grupo] = (aptos_por_grupo[grupo] || 0) + 1;
      }
    });

    const donantes_totales = donantes.length;

    let campanias_activas = 0;
    let campanias_finalizadas = 0;
    let proximas_14_dias = 0;
    let siguiente_campania = null;

    const normalizarFecha = (fecha) => {
      if (!fecha) return null;
      const f = new Date(fecha);
      return new Date(f.getFullYear(), f.getMonth(), f.getDate());
    };

    const hoyPlano = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());

    campanias.forEach((campania) => {
      const fi = normalizarFecha(campania.fecha_inicio);
      const ff = normalizarFecha(campania.fecha_fin);
      let estado = "desconocido";

      if (fi && ff) {
        if (fi <= hoyPlano && hoyPlano <= ff) estado = "activa";
        else if (ff < hoyPlano) estado = "finalizada";
        else if (fi > hoyPlano) estado = "futura";
      } else if (fi && !ff) {
        estado = fi <= hoyPlano ? "activa" : "futura";
      } else if (!fi && ff) {
        estado = hoyPlano <= ff ? "activa" : "finalizada";
      } else {
        const est = (campania.estado || "").toLowerCase();
        if (est.includes("cancel")) estado = "cancelada";
        else if (est.includes("final")) estado = "finalizada";
        else if (est.includes("act")) estado = "activa";
        else if (est.includes("fut")) estado = "futura";
      }

      if (estado === "activa") campanias_activas += 1;
      if (estado === "finalizada") campanias_finalizadas += 1;

      if (estado === "futura" && fi) {
        const diffDias = Math.floor((fi - hoyPlano) / (1000 * 60 * 60 * 24));
        if (diffDias <= 14) proximas_14_dias += 1;

        if (
          !siguiente_campania ||
          fi < new Date(siguiente_campania.fecha_inicio)
        ) {
          siguiente_campania = {
            id: campania.id,
            nombre: campania.nombre,
            fecha_inicio: fi.toISOString(),
          };
        }
      }
    });

    return {
      centro: centro.nombre,
      donantes_totales,
      donantes_aptos_hoy,
      campanias_activas,
      campanias_finalizadas,
      proximas_14_dias,
      siguiente_campania,
      aptos_por_grupo,
      notificaciones_enviadas,
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
