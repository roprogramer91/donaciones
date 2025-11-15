// En este archivo publico las rutas de localidades
const express = require('express');
const router = express.Router();
const localidadesController = require('../controllers/localidadesController');

// Aqui devuelvo todas las localidades o filtro por provincia
router.get('/', localidadesController.getLocalidades);
// Aqui listo las localidades para una provincia puntual
router.get('/provincia/:id', localidadesController.getLocalidadesByProvincia);

module.exports = router;
