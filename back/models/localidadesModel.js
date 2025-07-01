const db = require('../data/config');

async function getAllLocalidades() {
  const sql = 'SELECT * FROM localidades ORDER BY nombre';
  const { rows } = await db.query(sql);
  return rows;
}

async function getLocalidadById(id) {
  const sql = 'SELECT * FROM localidades WHERE id = $1';
  const { rows } = await db.query(sql, [id]);
  return rows[0];
}

async function getLocalidadesByProvinciaId(provinciaId) {
  const sql = 'SELECT * FROM localidades WHERE provincia_id = $1 ORDER BY nombre';
  const { rows } = await db.query(sql, [provinciaId]);
  return rows;
}

module.exports = {
  getAllLocalidades,
  getLocalidadById,
  getLocalidadesByProvinciaId
};
