// back/routes/centro.routes.js
const express = require('express');
const router = express.Router();
const CentrosController = require('../controllers/centros.controller');

// Perfil del centro autenticado
router.get('/me', CentrosController.obtenerMiPerfil);
router.put('/me', CentrosController.actualizarMiPerfil);

module.exports = router;

