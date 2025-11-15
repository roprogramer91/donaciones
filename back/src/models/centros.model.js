// En este archivo administro las consultas de centros
const pool = require('../config/database');

const CentrosModel = {
  async obtenerPorId(id) {
    const query = `
      SELECT id, nombre, direccion, telefono, email
      FROM centros_hemoterapia
      WHERE id = $1
      LIMIT 1;
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
      UPDATE centros_hemoterapia
      SET ${sets.join(', ')}
      WHERE id = $${i}
      RETURNING id, nombre, direccion, telefono, email;
    `;
    values.push(id);
    const { rows } = await pool.query(query, values);
    return rows[0] || null;
  }
};

module.exports = CentrosModel;


