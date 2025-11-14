// back/routes/campanias.routes.js
// Rutas para la gestión de campañas

const express = require('express');
const router = express.Router();
const CampaniasController = require('../controllers/campanias.controller');
const authMiddleware = require('../services/auth/middleware/authMiddleware');

// RUTAS CRUD DE CAMPAÑAS
router.get('/', CampaniasController.obtenerCampanias);         // Obtener todas
router.get('/:id', CampaniasController.obtenerCampaniaPorId);  // Obtener por ID
router.post('/', CampaniasController.crearCampania);           // Crear nueva
router.put('/:id', CampaniasController.actualizarCampania);    // Actualizar por ID
router.delete('/:id', CampaniasController.eliminarCampania);   // Eliminar por ID
router.get('/:id/inscriptos', authMiddleware, CampaniasController.obtenerInscriptos); // Listar inscriptos

module.exports = router;

