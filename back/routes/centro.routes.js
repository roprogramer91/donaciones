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
router.post('/notificaciones/preview', CentrosController.previewNotificaciones);
router.post('/notificaciones/felicitaciones/preview', CentrosController.previewFelicitaciones);

router.get('/notificaciones/log', CentrosController.getNotificacionesLog);
// Notificaciones del centro (campana)
router.get('/notificaciones', CentrosController.getNotificacionesCentro);
router.put('/notificaciones/:id/leida', CentrosController.marcarNotificacionCentroLeida);

// Inscripciones de donante (por usuario)
router.get('/donantes/:usuarioId/inscripciones', CentrosController.getInscripcionesUsuario);

module.exports = router;

