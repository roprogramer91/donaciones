const jwt = require('jsonwebtoken');

const secret = process.env.JWT_SECRET || 'clave_supersecreta';

function generarToken(usuario) {
  return jwt.sign(
    { id: usuario.id, email: usuario.email },
    secret,
    { expiresIn: '1h' }
  );
}

function verificarToken(token) {
  return jwt.verify(token, secret);
}

module.exports = { generarToken, verificarToken };
