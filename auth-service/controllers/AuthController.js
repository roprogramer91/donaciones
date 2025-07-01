const jwt = require('jsonwebtoken');
const UserModel = require('../models/UserModel');
require('dotenv').config();

const SECRET_KEY = process.env.JWT_SECRET || 'secret-key';

// Controlador para manejar el login con Google (async/await)
async function handleGoogleLogin(profile, callback) {
  try {
    const googleid = profile.id;
    const nombre = profile._json.given_name || profile.displayName || 'Desconocido';
    const apellido = profile._json.family_name || ' ';
    const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;

    if (!email) {
      return callback(new Error('No se obtuvo email de Google'), null);
    }

    // 1. Buscar por googleid
    let user = await UserModel.findUserByGoogleId(googleid);

    // 2. Si no existe, buscar por email
    if (!user) {
      user = await UserModel.findUserByEmail(email);
      // await UserModel.updateGoogleId(user.id, googleid);
    }

    // 3. Si todavía no existe, crearlo
    if (!user) {
      user = await UserModel.createUser({ googleid, nombre, apellido, email });
    }

    // 4. Generar token y devolver
    const token = generateToken(user);
    callback(null, { token, user });
  } catch (err) {
    callback(err, null);
  }
}

// Función para generar el JWT
function generateToken(user) {
  const payload = {
    id: user.id,
    name: user.name,
    apellido: user.apellido || '',
    email: user.email,
    // roles: user.roles || [] // Descomentar cuando roles esté implementado en tabla
  };
  return jwt.sign(payload, SECRET_KEY, { expiresIn: '2h' });
}

module.exports = {
  handleGoogleLogin,
  generateToken
};
