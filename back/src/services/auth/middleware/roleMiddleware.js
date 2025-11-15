// En este archivo valido los roles esperados en cada endpoint
const ROLES = require('../utils/roles');

function roleMiddleware(rolesPermitidos = []) {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Usuario no autenticado.' });
      }

      const userRole = req.user.tipo_usuario;
      if (!userRole) {
        return res.status(403).json({ message: 'Rol no definido en el token.' });
      }

      if (!rolesPermitidos.includes(userRole)) {
        return res.status(403).json({ message: 'Acceso denegado. Rol insuficiente.' });
      }

      next();
    } catch (error) {
      console.error('Error en roleMiddleware:', error);
      return res.status(500).json({ message: 'Error interno en control de roles.' });
    }
  };
}

module.exports = roleMiddleware;
