const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const ROLES = require('../utils/roles');

// Ruta protegida solo para administradores
router.get(
  '/dashboard',
  authMiddleware,
  roleMiddleware([ROLES.ADMIN]),
  (req, res) => {
    res.json({
      message: `Bienvenido al panel técnico, ${req.user.email}`,
      rol: req.user.tipo_usuario,
    });
  }
);

module.exports = router;
