// En este archivo publico las rutas exclusivas para administradores
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const ROLES = require('../utils/roles');

// Aqui protejo el dashboard tecnico solo para admins
router.get(
  '/dashboard',
  authMiddleware,
  roleMiddleware([ROLES.ADMIN]),
  (req, res) => {
    res.json({
      message: `Bienvenido al panel tecnico, ${req.user.email}`,
      rol: req.user.tipo_usuario,
    });
  }
);

module.exports = router;
