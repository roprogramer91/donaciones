// users.controller.js
// Controlador para manejar las operaciones relacionadas con los usuarios

const UserModel = require('../models/user.model');

// Actualizar roles
async function updateRoles(req, res) {
  try {
    const userId = req.user.id;
    const { roles } = req.body;

    if (!roles || !Array.isArray(roles) || roles.length === 0) {
      return res.status(400).json({ error: 'Roles inválidos.' });
    }

    await UserModel.updateRoles(userId, roles);
    return res.json({ ok: true, roles });
  } catch (err) {
    console.error('Error actualizando roles:', err);
    return res.status(500).json({ error: 'Error actualizando roles.' });
  }
}

// Obtener el usuario autenticado (para /api/users/me)
async function getMe(req, res) {
  try {
    const userId = req.user.id;
    console.log('[GET /api/user/me] userId recibido:', userId);

    const user = await UserModel.findUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Consultar si es donante
    const donante = await UserModel.findDonanteByUserId(userId);

    // Responder datos básicos y flag
    res.json({
      id: user.id,
      nombre: user.nombre,
      apellido: user.apellido,
      email: user.email,
      roles: user.roles,
      esDonante: !!donante // true si existe, false si no
    });
  } catch (err) {
    console.error('Error en GET /api/user/me:', err);
    res.status(500).json({ error: 'Error buscando usuario' });
  }
}

module.exports = {
  updateRoles,
  getMe
};
