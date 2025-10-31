// back/routes/centro.routes.js
const express = require('express');
const router = express.Router();
const CentrosController = require('../controllers/centros.controller');
const authMiddleware = require('../middleware/authMiddleware');

// Perfil del centro autenticado
router.get('/me', CentrosController.obtenerMiPerfil);
router.put('/me', CentrosController.actualizarMiPerfil);

// ✅ SIN middleware para compatibilidad anterior
router.get('/summary', CentrosController.obtenerResumen);

// Notificaciones desde el centro
router.post('/notificaciones', CentrosController.enviarNotificaciones);
router.post('/notificaciones/felicitaciones', CentrosController.enviarFelicitacionesCumple);
router.post('/notificaciones/preview', CentrosController.previewNotificaciones);
router.post('/notificaciones/felicitaciones/preview', CentrosController.previewFelicitaciones);

router.get('/notificaciones/log', CentrosController.getNotificacionesLog);
router.get('/notificaciones', CentrosController.getNotificacionesCentro);
router.put('/notificaciones/:id/leida', CentrosController.marcarNotificacionCentroLeida);

router.get('/donantes/:usuarioId/inscripciones', CentrosController.getInscripcionesUsuario);

module.exports = router;
