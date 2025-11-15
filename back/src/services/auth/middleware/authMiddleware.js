// En este archivo valido el token JWT de cada request
const jwt = require('jsonwebtoken');
require('dotenv').config();

function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      return res.status(401).json({ message: 'Token no proporcionado.' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Formato de token invalido.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Error en authMiddleware:', error);
    return res.status(401).json({ message: 'Token invalido o expirado.' });
  }
}

module.exports = authMiddleware;
