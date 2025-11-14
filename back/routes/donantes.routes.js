//back/routes/donantes.routes.js
// Rutas para la gestión de donantes

// Importar dependencias
const express = require('express');
const router = express.Router();
const authMiddleware = require('../services/auth/middleware/authMiddleware');
//fin importaciones-----


// Controladores
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
    darBajaDonante
 } = require('../controllers/donantes.controller');
//fin controladores-----


//--------------------------------------
 //-------- Rutas de Donantes ---------
//--------------------------------------


//GET
router.get('/', obtenerDonantes);
router.get('/me', authMiddleware, getDonanteByEmail);
router.get('/perfil', authMiddleware, getPerfilDonanteCompleto);
router.get('/filtro', authMiddleware, filtrarDonantes);
router.get('/campanias', authMiddleware, campaniasParaDonante);
router.get('/inscripciones', authMiddleware, async (req, res) => {
  // Devolver campañas a las que el usuario está inscripto
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

// Notificaciones del donante
const { getMisNotificaciones, marcarNotificacionLeida } = require('../controllers/donantes.controller');
router.get('/notificaciones', authMiddleware, getMisNotificaciones);
router.post('/notificaciones/:id/leida', authMiddleware, marcarNotificacionLeida);

//POST
router.post('/', authMiddleware, crearDonante);

//PUT
router.put('/perfil', authMiddleware, editarPerfilDonante); 

// POST acción: inscribirse a una campaña
router.post('/campanias/:id/asistir', authMiddleware, asistirCampania);
// DELETE acción: cancelar inscripción
router.delete('/campanias/:id/asistir', authMiddleware, cancelarAsistencia);

// DELETE BAJA DEFINITIVA DEL DONANTE
router.delete('/baja', authMiddleware, darBajaDonante);

module.exports = router;
