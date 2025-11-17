// back/src/routes/campanias.routes.js

// En este archivo publico todas las rutas de campanias
const express = require('express');
const router = express.Router();
const CampaniasController = require('../controllers/campanias.controller');
const authMiddleware = require('../services/auth/middleware/authMiddleware')
const roleMiddleware = require('../services/auth/middleware/roleMiddleware');

// Aca listo todas las campanias
router.get(
  '/',
  authMiddleware,
  roleMiddleware(["centro", "admin"]),
  CampaniasController.obtenerCampanias
);

// aca muestro una campania puntual
router.get(
  '/:id',
  authMiddleware,
  roleMiddleware(["centro", "admin"]),
  CampaniasController.obtenerCampaniaPorId
);

// Aca creo nuevas campanias
router.post(
  '/',
  authMiddleware,
  roleMiddleware(["centro", "admin"]),
  CampaniasController.crearCampania
);

// Aca actualizo una campania existente
router.put(
  '/:id',
  authMiddleware,
  roleMiddleware(["centro", "admin"]),
  CampaniasController.actualizarCampania
);

// Aca elimino una campania por id
router.delete(
  '/:id',
  authMiddleware,
  roleMiddleware(["centro","admin"]),
  CampaniasController.eliminarCampania
);

// Aca muestro los inscriptos de una campania usando auth
router.get(
  '/:id/inscriptos',
  authMiddleware,
  roleMiddleware(["centro", "admin"]),
  CampaniasController.obtenerInscriptos
);


module.exports = router;
