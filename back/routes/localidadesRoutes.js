const express = require('express');
const router = express.Router();
const localidadesController = require('../controllers/localidadesController');

// Obtener todas las localidades
router.get('/', localidadesController.getLocalidades);
// Obtener localidades por provincia
router.get('/provincia/:id', localidadesController.getLocalidadesByProvincia);



module.exports = router;