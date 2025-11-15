// En este archivo publico las rutas de barrios
const express = require('express');
const router = express.Router();
const barriosController = require('../controllers/barriosController');

// Aqui devuelvo todos los barrios
router.get('/', barriosController.getBarrios);

// Aqui traigo un barrio puntual
router.get('/:id', barriosController.getBarrioById);

// Aqui filtro los barrios por localidad
router.get('/localidad/:id', barriosController.getBarriosByLocalidad);

module.exports = router;
