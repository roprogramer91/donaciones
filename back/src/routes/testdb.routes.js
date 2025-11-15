// En este archivo expongo un ping sencillo para la base
const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Uso este GET para chequear la hora obtenida desde Postgres
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() AS ahora');
    res.json({ status: 'Conexion exitosa', ahora: result.rows[0].ahora });
  } catch (error) {
    console.error('Error al conectar a la base de datos:', error.message);
    res.status(500).json({ error: 'No se pudo conectar a la base de datos' });
  }
});

module.exports = router;
