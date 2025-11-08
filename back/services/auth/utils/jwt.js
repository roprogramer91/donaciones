// utils/jwt.js
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'clave-super-secreta';
const JWT_EXPIRES = '2h'; // Duración del token

// Generar un token con datos del usuario
function generarToken(usuario) {
  const payload = {
    id: usuario.id,
    dni: usuario.dni,
    tipo_usuario: usuario.tipo_usuario,
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

// Verificar validez de un token
function verificarToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

module.exports = { generarToken, verificarToken };
