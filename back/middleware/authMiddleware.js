const jwt = require('jsonwebtoken');
require('dotenv').config();

const secret = process.env.JWT_SECRET || 'MiMatheuAuthSecret_2025!';

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ mensaje: 'Token no proporcionado' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, secret);
    req.user = payload; // El user va en req.user, NO en req.usuario
    next();
  } catch (err) {
    console.error('Token inválido o expirado:', err.message); // log para debug
    return res.status(401).json({ mensaje: 'Token inválido o expirado' });
  }
}

module.exports = authMiddleware;
