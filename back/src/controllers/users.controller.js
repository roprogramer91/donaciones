// En este archivo administro los endpoints de usuario autenticado
const UserModel = require('../models/user.model');

// Aqui actualizo los roles del usuario autenticado
async function updateRoles(req, res) {
  try {
    const userId = req.user.id;
    const { roles } = req.body;

    if (!roles || !Array.isArray(roles) || roles.length === 0) {
      return res.status(400).json({ error: 'Roles invalidos.' });
    }

    await UserModel.updateRoles(userId, roles);
    return res.json({ ok: true, roles });
  } catch (err) {
    console.error('Error actualizando roles:', err);
    return res.status(500).json({ error: 'Error actualizando roles.' });
  }
}

// Aqui devuelvo mis datos autenticados junto con el flag de donante
async function getMe(req, res) {
  try {
    const userId = req.user.id;
    console.log('[GET /api/user/me] userId recibido:', userId);

    const user = await UserModel.findUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Aqui reviso si el usuario esta registrado como donante
    const donante = await UserModel.findDonanteByUserId(userId);

    // Aqui devuelvo los datos basicos y el flag esDonante
    res.json({
      id: user.id,
      nombre: user.nombre,
      apellido: user.apellido,
      email: user.email,
      roles: user.roles,
      esDonante: !!donante
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
