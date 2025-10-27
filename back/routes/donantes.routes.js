//back/routes/donantes.routes.js
// Rutas para la gestión de donantes

// Importar dependencias
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
//fin importaciones-----


// Controladores
const { 
    crearDonante, 
    obtenerDonantes, 
    getDonanteByEmail, 
    getPerfilDonanteCompleto,
    filtrarDonantes
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

//POST
router.post('/', authMiddleware, crearDonante);

//PUT
router.put('/api/donantes/perfil', authMiddleware, editarPerfilDonante); 

module.exports = router;
