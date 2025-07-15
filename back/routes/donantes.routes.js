const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { crearDonante, obtenerDonantes, getDonanteByEmail, getPerfilDonanteCompleto } = require('../controllers/donantes.controller');

//GET
router.get('/', obtenerDonantes);
router.get('/me', authMiddleware, getDonanteByEmail);
router.get('/perfil', authMiddleware, getPerfilDonanteCompleto);

//POST
router.post('/', authMiddleware, crearDonante);

module.exports = router;
