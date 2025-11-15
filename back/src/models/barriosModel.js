// En este archivo gestiono las consultas de barrios
const db = require('../config/database');

// Aqui traigo todos los barrios ordenados por nombre
async function getAllBarrios() {
  const sql = 'SELECT * FROM barrios ORDER BY nombre';
  const { rows } = await db.query(sql);
  return rows;
}

// Aqui filtro barrios por localidad
async function getBarriosByLocalidadId(localidadId) {
  const sql = 'SELECT * FROM barrios WHERE localidad_id = $1 ORDER BY nombre';
  const { rows } = await db.query(sql, [localidadId]);
  return rows;
}

// Aqui busco un barrio puntual
async function getBarrioById(id) {
  const sql = 'SELECT * FROM barrios WHERE id = $1';
  const { rows } = await db.query(sql, [id]);
  return rows[0];
}

module.exports = {
  getAllBarrios,
  getBarriosByLocalidadId,
  getBarrioById
};
