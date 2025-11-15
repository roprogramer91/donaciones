// En este archivo genero y valido tokens JWT
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'clave-super-secreta';
const JWT_EXPIRES = '2h'; // Aqui fijo la duracion del token

// Aqui genero el token con los datos minimos del usuario
function generarToken(usuario) {
  const payload = {
    id: usuario.id,
    dni: usuario.dni,
    email: usuario.email,
    tipo_usuario: usuario.tipo_usuario,
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

// Aqui valido el token recibido
function verificarToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

module.exports = { generarToken, verificarToken };
