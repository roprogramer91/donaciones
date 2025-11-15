// En este archivo publico las rutas de provincias
const express = require('express');
const router = express.Router();
const provinciasController = require('../controllers/provinciasController');

// Aqui expongo el listado completo de provincias
router.get('/', provinciasController.getProvincias);

module.exports = router;
