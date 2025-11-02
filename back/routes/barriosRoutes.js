const express = require('express');
const router = express.Router();
const barriosController = require('../controllers/barriosController');

// Obtener todos los barrios
router.get('/', barriosController.getBarrios);

// Obtener barrio por ID
router.get('/:id', barriosController.getBarrioById);

// Obtener barrios por localidad
router.get('/localidad/:id', barriosController.getBarriosByLocalidad);

module.exports = router;
