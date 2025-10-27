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
    filtrarDonantes,
    editarPerfilDonante,
    campaniasParaDonante,
    asistirCampania
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

//POST
router.post('/', authMiddleware, crearDonante);

//PUT
router.put('/perfil', authMiddleware, editarPerfilDonante); 

// POST acción: inscribirse a una campaña
router.post('/campanias/:id/asistir', authMiddleware, asistirCampania);

module.exports = router;
