  // controllers/auth.controller.js
  const bcrypt = require('bcrypt');
  const { findUserByid, findUserByDni } = require('../models/usuarios.model');
  const {
    createVerification,
    verifyCode,
    markCodeAsUsed,
  } = require('../models/verificaciones2FA.model');
  const { generate2FACode } = require('../utils/generate2FACode');
  const { generarToken } = require('../utils/jwt'); 
  const { enviarCodigo2FA } = require('../utils/mailer');


  // --- LOGIN ---
async function login(req, res) {
  try {
    const { dni, password } = req.body;

    if (!dni || !password)
      return res.status(400).json({ message: 'DNI y contraseña son requeridos.' });

    const user = await findUserByDni(dni);
    if (!user || !user.activo)
      return res.status(401).json({ message: 'Usuario no encontrado o inactivo.' });

    const valid = await bcrypt.compare(password, user.password_hash || '');
    if (!valid)
      return res.status(401).json({ message: 'Contraseña incorrecta.' });

    // --- Generar código 2FA ---
    const codigo = generate2FACode();
    await createVerification(user.id, codigo, 'email');

    // --- Enviar correo 2FA ---
    const enviado = await enviarCodigo2FA(user.email, codigo);

    if (!enviado) {
      console.warn(`⚠️ No se pudo enviar el correo a ${user.email}`);
      return res.status(500).json({ message: 'No se pudo enviar el código 2FA.' });
    }

    // --- Crear token temporal (para el paso de verificación) ---
    const tempToken = generarToken({
      id: user.id,
      dni: user.dni,
      email: user.email,
      tipo_usuario: user.tipo_usuario,
    });

    res.status(200).json({
      message: 'Código 2FA generado y enviado por correo.',
      usuario_id: user.id,
      temp_token: tempToken,
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
}

  // --- VERIFY 2FA ---
  async function verify2FA(req, res) {
  
    try {
      const { usuario_id, codigo } = req.body;
      
      if (!usuario_id || !codigo)

        return res.status(400).json({ message: 'Datos incompletos.' });

      const verification = await verifyCode(usuario_id, codigo);
      if (!verification)
        return res.status(401).json({ message: 'Código inválido o expirado.' });


  if (!verification || !verification.id) {
    console.error("⚠️ No se pudo obtener verification o su ID:", verification);
    return res.status(500).json({ message: "Error interno: verification sin ID." });
  }
      await markCodeAsUsed(verification.id);

      // --- Generar token final JWT ---

      const user = await findUserByid(req.body.usuario_id);

      const finalToken = generarToken({
        id: user.id,
        dni: user.dni,
        email: user.email,
        tipo_usuario: user.tipo_usuario,
      });

      res.status(200).json({
        message: 'Verificación 2FA exitosa.',
        token: finalToken, 
        email: user.email,
        tipo_usuario: user.tipo_usuario,
      });
    } catch (error) {
      console.error('Error en verify-2fa:', error);
      res.status(500).json({ message: 'Error interno del servidor.' });
    }
  }

  module.exports = { login, verify2FA };
