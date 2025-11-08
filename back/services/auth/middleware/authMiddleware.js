// middleware/authMiddleware.js
const { verificarToken } = require('../utils/jwt');

// Verifica si el usuario tiene un token valido
function verificarAutenticacion(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ mensaje: 'Token no proporcionado' });
  }

  const token = authHeader.split(' ')[1]; // "Bearer <token>"
  const decoded = verificarToken(token);

  if (!decoded) {
    return res.status(401).json({ mensaje: 'Token inválido o expirado' });
  }

  req.user = decoded; // Guarda los datos del usuario
  next();
}

// Verifica si el usuario tiene uno de los roles permitidos
function verificarRol(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ mensaje: 'No autenticado' });
    }

    if (!rolesPermitidos.includes(req.user.tipo_usuario)) {
      return res.status(403).json({ mensaje: 'No autorizado para esta acción' });
    }

    next();
  };
}

module.exports = { verificarAutenticacion, verificarRol };
