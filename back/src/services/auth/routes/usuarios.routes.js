// En este archivo valido el JWT y devuelvo el usuario basico
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { findUserByid } = require('../models/usuarios.model');

// Aqui pruebo el token y respondo con los datos basicos
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await findUserByid(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    res.status(200).json({
      message: 'Acceso autorizado.',
      usuario: {
        id: user.id,
        dni: user.dni,
        nombre: user.nombre,
        email: user.email,
        tipo_usuario: user.tipo_usuario,
      },
    });
  } catch (error) {
    console.error('Error en /me:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

module.exports = router;
