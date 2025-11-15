// En este archivo obtengo los datos de provincias
const db = require('../config/database');

// Aqui traigo todas las provincias ordenadas por nombre
async function getAllProvincias() {
  const sql = 'SELECT * FROM provincias ORDER BY nombre';
  const { rows } = await db.query(sql);
  return rows;
}

module.exports = {
  getAllProvincias
};
