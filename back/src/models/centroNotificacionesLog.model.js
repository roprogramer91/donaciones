// back/src/models/centroNotificacionesLog.model.js
// aca guardo el historial de notificaciones que envian los centros

const pool = require('../config/database');

// aca registro una notificacion enviada por el centro
module.exports.registrar = async function (centroId, titulo, mensaje, destinatarios) {
  const q = `
    insert into centro_notificaciones_log (centro_id, titulo, mensaje, destinatarios)
    values ($1, $2, $3, $4)
    returning *
  `;
  const params = [centroId, titulo, mensaje, JSON.stringify(destinatarios)];
  const { rows } = await pool.query(q, params);
  return rows[0];
};

// aca traigo el historial del centro
module.exports.listar = async function (centroId) {
  const q = `
    select *
    from centro_notificaciones_log
    where centro_id = $1
    order by fecha desc
  `;
  const { rows } = await pool.query(q, [centroId]);
  return rows;
};

