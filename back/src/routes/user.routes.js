// En este archivo publico las rutas protegidas de usuario
const express = require('express');
const router = express.Router();
const authMiddleware = require('../services/auth/middleware/authMiddleware');
const UserController = require('../controllers/users.controller');

// Aqui actualizo los roles del usuario autenticado
router.post('/roles', authMiddleware, UserController.updateRoles);
// Aqui devuelvo los datos del usuario autenticado
router.get('/me', authMiddleware, UserController.getMe);

module.exports = router;
