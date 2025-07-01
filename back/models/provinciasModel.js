const db = require('../data/config');

// Obtener todas las provincias
async function getAllProvincias() {
  const sql = 'SELECT * FROM provincias ORDER BY nombre';
  const { rows } = await db.query(sql);
  return rows;
}

module.exports = {
  getAllProvincias
};

