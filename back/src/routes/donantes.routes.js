// En este archivo publico las rutas que gestionan donantes
const express = require('express');
const router = express.Router();
const authMiddleware = require('../services/auth/middleware/authMiddleware');
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
router.get('/', obtenerDonantes);
router.get('/filtro', authMiddleware, filtrarDonantes);

// Aqui expongo los datos privados del donante autenticado
router.get('/me', authMiddleware, getDonanteByEmail);
router.get('/perfil', authMiddleware, getPerfilDonanteCompleto);
router.put('/perfil', authMiddleware, editarPerfilDonante);

// Aqui entrego informacion relacionada a campanias
router.get('/campanias', authMiddleware, campaniasParaDonante);
router.post('/campanias/:id/asistir', authMiddleware, asistirCampania);
router.delete('/campanias/:id/asistir', authMiddleware, cancelarAsistencia);

// Aqui muestro las inscripciones activas del donante
router.get('/inscripciones', authMiddleware, async (req, res) => {
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
router.get('/notificaciones', authMiddleware, getMisNotificaciones);
router.post('/notificaciones/:id/leida', authMiddleware, marcarNotificacionLeida);

// Aqui creo nuevos donantes
router.post('/', crearDonante);

// Aqui aplico la baja definitiva del donante autenticado
router.delete('/baja', authMiddleware, darBajaDonante);

module.exports = router;
