const pool = require('../data/config');

// MODELO DE CAMPAÑAS
const CampaniasModel = {
  async obtenerTodas() {
    const query = `
      SELECT c.id, c.nombre, c.descripcion, c.imagen_url,
             c.fecha_inicio, c.fecha_fin, c.estado,
             l.nombre AS localidad, b.nombre AS barrio
      FROM campañas c
      LEFT JOIN localidades l ON c.localidad_id = l.id
      LEFT JOIN barrios b ON c.barrio_id = b.id
      ORDER BY c.created_at DESC;
    `;
    const { rows } = await pool.query(query);
    return rows;
  },

  async crear(campania) {
    const { centro_id, nombre, descripcion, imagen_url, localidad_id, barrio_id, fecha_inicio, fecha_fin } = campania;
    const query = `
      INSERT INTO campañas (centro_id, nombre, descripcion, imagen_url, localidad_id, barrio_id, fecha_inicio, fecha_fin)
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
      UPDATE campañas
      SET nombre=$1, descripcion=$2, imagen_url=$3, fecha_inicio=$4, fecha_fin=$5, estado=$6, updated_at=NOW()
      WHERE id=$7
      RETURNING *;
    `;
    const values = [nombre, descripcion, imagen_url, fecha_inicio, fecha_fin, estado, id];
    const { rows } = await pool.query(query, values);
    return rows[0];
  },

  async eliminar(id) {
    const query = `DELETE FROM campañas WHERE id=$1 RETURNING *;`;
    const { rows } = await pool.query(query, [id]);
    return rows[0];
  }
};

module.exports = CampaniasModel;
