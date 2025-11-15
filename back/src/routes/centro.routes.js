// En este archivo publico las rutas del panel de centros
const express = require('express');
const router = express.Router();
const CentrosController = require('../controllers/centros.controller');

// Aqui muestro y actualizo el perfil del centro
router.get('/me', CentrosController.obtenerMiPerfil);
router.put('/me', CentrosController.actualizarMiPerfil);
// Aqui entrego un resumen rapido para dashboards
router.get('/summary', CentrosController.obtenerResumen);

// Aqui manejo las notificaciones emitidas por el centro
router.post('/notificaciones', CentrosController.enviarNotificaciones);
router.post('/notificaciones/felicitaciones', CentrosController.enviarFelicitacionesCumple);
router.post('/notificaciones/preview', CentrosController.previewNotificaciones);
router.post('/notificaciones/felicitaciones/preview', CentrosController.previewFelicitaciones);
router.get('/notificaciones/log', CentrosController.getNotificacionesLog);
router.get('/notificaciones', CentrosController.getNotificacionesCentro);
router.put('/notificaciones/:id/leida', CentrosController.marcarNotificacionCentroLeida);

// Aqui consulto las inscripciones y el historial legacy
router.get('/donantes/:usuarioId/inscripciones', CentrosController.getInscripcionesUsuario);
router.get('/api/centros/notificaciones/log', CentrosController.getHistorialNotificaciones);

module.exports = router;
