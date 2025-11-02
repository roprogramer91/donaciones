const db = require('../data/config');

async function getAllBarrios() {
  const sql = 'SELECT * FROM barrios ORDER BY nombre';
  const { rows } = await db.query(sql);
  return rows;
}

async function getBarriosByLocalidadId(localidadId) {
  const sql = 'SELECT * FROM barrios WHERE localidad_id = $1 ORDER BY nombre';
  const { rows } = await db.query(sql, [localidadId]);
  return rows;
}

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
