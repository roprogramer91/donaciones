// En este archivo publico todas las rutas de campanias
const express = require('express');
const router = express.Router();
const CampaniasController = require('../controllers/campanias.controller');
const authMiddleware = require('../services/auth/middleware/authMiddleware');

// Aqui listo todas las campanias
router.get('/', CampaniasController.obtenerCampanias);
// Aqui muestro una campania puntual
router.get('/:id', CampaniasController.obtenerCampaniaPorId);
// Aqui creo nuevas campanias
router.post('/', CampaniasController.crearCampania);
// Aqui actualizo una campania existente
router.put('/:id', CampaniasController.actualizarCampania);
// Aqui elimino una campania por id
router.delete('/:id', CampaniasController.eliminarCampania);
// Aqui muestro los inscriptos de una campania usando auth
router.get('/:id/inscriptos', authMiddleware, CampaniasController.obtenerInscriptos);

module.exports = router;
