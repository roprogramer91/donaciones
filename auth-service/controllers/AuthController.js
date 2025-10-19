const jwt = require('jsonwebtoken');
const UserModel = require('../models/UserModel');
const pool = require("../config/database");

require('dotenv').config();

const SECRET_KEY = process.env.JWT_SECRET || 'secret-key';


//Controlador para manejar el login con DNI
const handleDniLogin = async (req, res) => {
  const { dni } = req.body;

  try {
    // Busca el donante por DNI
    const result = await pool.query('SELECT * FROM donantes WHERE dni = $1', [dni]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No existe ningún donante con ese DNI' });
    }

    const donante = result.rows[0];

    // Genera token con los datos mínimos
    const token = jwt.sign(
      {
        id: donante.usuario_id, // ← Este es el que usa el backend
        dni: donante.dni,
        tipo: 'donante'
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Respuesta igual que el login con Google
    res.json({
      message: 'Inicio de sesión exitoso con DNI',
      token,
      donante,
    });
  } catch (error) {
    console.error('Error en login por DNI:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};



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


async function handleLoginCentro(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email y contraseña son obligatorios" });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM centros_hemoterapia WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Centro no encontrado" });
    }

    const centro = result.rows[0];

    // Comparación simple (sin hash)
    if (centro.password !== password) {
      return res.status(401).json({ error: "Contraseña incorrecta" });
    }

    // Crear token JWT
    const token = jwt.sign(
      {
        id: centro.id,
        tipo: "centro",
        nombre: centro.nombre,
        email: centro.email
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      mensaje: "Login exitoso",
      token,
      centro: { id: centro.id, nombre: centro.nombre, email: centro.email }
    });

  } catch (error) {
    console.error("Error en login-centro:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}


module.exports = {
  handleGoogleLogin,
  generateToken,
  handleDniLogin,
  handleLoginCentro
};
