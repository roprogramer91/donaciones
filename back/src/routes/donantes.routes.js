// En este archivo publico las rutas que gestionan donantes
const express = require('express');
const router = express.Router();
const authMiddleware = require('../services/auth/middleware/authMiddleware');
const roleMiddleware = require('../services/auth/middleware/roleMiddleware');

const {
  crearDonante,
  obtenerDonantes,
  getDonanteByEmail,
  getPerfilDonanteCompleto,
  filtrarDonantes,
  editarPerfilDonante,
  campaniasParaDonante,
  asistirCampania,
  cancelarAsistencia,
  darBajaDonante,
  getMisNotificaciones,
  marcarNotificacionLeida
} = require('../controllers/donantes.controller');

// Aqui publico los listados generales
router.get('/', authMiddleware, roleMiddleware(["admin", "centro"]), obtenerDonantes);
router.get('/filtro', 
  authMiddleware, 
  roleMiddleware(["admin", "centro"]), 
  filtrarDonantes
);


// Aqui expongo los datos privados del donante autenticado
router.get('/me', 
  authMiddleware, 
  roleMiddleware("donante"), 
  getDonanteByEmail
);

router.get('/perfil', 
  authMiddleware, 
  roleMiddleware("donante"), 
  getPerfilDonanteCompleto
);

router.put('/perfil',
  authMiddleware,
  roleMiddleware("donante"),
  editarPerfilDonante
);


// Aqui entrego informacion relacionada a campanias del donante logueado
router.get('/campanias',
  authMiddleware,
  roleMiddleware("donante"),
  campaniasParaDonante
);

router.post('/campanias/:id/asistir', 
  authMiddleware,
  roleMiddleware("donante"),
  asistirCampania
);

router.delete('/campanias/:id/asistir',
  authMiddleware,
  roleMiddleware("donante"),
  cancelarAsistencia
);


// Aqui muestro las inscripciones activas del donante
router.get('/inscripciones', 
  authMiddleware, 
  roleMiddleware("donante"),
   async (req, res) => {
  try {
    const { listarInscripcionesPorUsuario } = require('../models/campanias.model');
    const usuarioId = req.user && req.user.id;
    if (!usuarioId) return res.status(401).json({ mensaje: 'Token no proporcionado' });
    const lista = await listarInscripcionesPorUsuario(usuarioId);
    res.json(lista);
  } catch (e) {
    console.error('Error al obtener inscripciones del donante:', e);
    res.status(500).json({ error: 'Error al obtener inscripciones' });
  }
});

// Aqui gestiono las notificaciones propias del donante
router.get(
  '/notificaciones',
  authMiddleware,
  roleMiddleware("donante"),
  getMisNotificaciones
);

router.post(
  '/notificaciones/:id/leida',
  authMiddleware,
  roleMiddleware("donante"),
  marcarNotificacionLeida
);


// Aqui creo nuevos donantes
router.post('/', crearDonante);

// Aqui aplico la baja definitiva del donante autenticado
router.delete(
  '/baja',
  authMiddleware,
  roleMiddleware("donante"),
  darBajaDonante
);


module.exports = router;
