// back/src/routes/centro.routes.js

const express = require('express');
const router = express.Router();
const CentrosController = require('../controllers/centros.controller');
const authMiddleware = require('../services/auth/middleware/authMiddleware');
const roleMiddleware = require('../services/auth/middleware/roleMiddleware');

// ==========================================
// PERFIL
// ==========================================
router.get(
  '/me',
  authMiddleware,
  roleMiddleware("centro"),
  CentrosController.obtenerMiPerfil
);

router.put(
  '/me',
  authMiddleware,
  roleMiddleware("centro"),
  CentrosController.actualizarMiPerfil
);

// ==========================================
// RESUMEN
// ==========================================
router.get(
  '/summary',
  authMiddleware,
  roleMiddleware("centro"),
  CentrosController.obtenerResumen
);

// ==========================================
// NOTIFICACIONES MANUALES
// ==========================================
router.post(
  '/notificaciones',
  authMiddleware,
  roleMiddleware("centro"),
  CentrosController.enviarNotificaciones
);

router.post(
  '/notificaciones/preview',
  authMiddleware,
  roleMiddleware("centro"),
  CentrosController.previewNotificaciones
);

// ==========================================
// FELICITACIONES
// ==========================================
router.post(
  '/notificaciones/felicitaciones',
  authMiddleware,
  roleMiddleware("centro"),
  CentrosController.enviarFelicitacionesCumple
);

router.post(
  '/notificaciones/felicitaciones/preview',
  authMiddleware,
  roleMiddleware("centro"),
  CentrosController.previewFelicitaciones
);

// ==========================================
// LOGS DE NOTIFICACIONES
// ==========================================
router.get(
  '/notificaciones/log',
  authMiddleware,
  roleMiddleware("centro"),
  CentrosController.getNotificacionesLog
);

router.get(
  '/notificaciones',
  authMiddleware,
  roleMiddleware("centro"),
  CentrosController.getNotificacionesCentro
);

// ==========================================
// MARCAR LEÍDA (placeholder)
// ==========================================
router.put(
  '/notificaciones/:id/leida',
  authMiddleware,
  roleMiddleware("centro"),
  CentrosController.marcarNotificacionCentroLeida
);

module.exports = router;
