// back/routes/centro.routes.js
const express = require('express');
const router = express.Router();
const CentrosController = require('../controllers/centros.controller');

// Perfil del centro autenticado
router.get('/me', CentrosController.obtenerMiPerfil);
router.put('/me', CentrosController.actualizarMiPerfil);
router.get('/summary', CentrosController.obtenerResumen);

// Notificaciones desde el centro
router.post('/notificaciones', CentrosController.enviarNotificaciones);
router.post('/notificaciones/felicitaciones', CentrosController.enviarFelicitacionesCumple);

module.exports = router;
