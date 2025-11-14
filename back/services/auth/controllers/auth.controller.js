  // controllers/auth.controller.js
  const bcrypt = require('bcrypt');
  const { findUserByid, findUserByDni,findUserByEmail, updatePassword } = require('../models/usuarios.model');
  const { createVerification, verifyCode, markCodeAsUsed} = require('../models/verificaciones2FA.model');
  const { generate2FACode } = require('../utils/generate2FACode');
  const { generarToken } = require('../utils/jwt'); 
  const { enviarCodigo2FA, sendMail } = require('../utils/mailer');





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
  console.log("🧠 Body recibido en verify:", req.body);

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

  // --- RECUPERACIÓN DE CONTRASEÑA ---


async function recoverPassword(req, res) {
  try {
    const { dni, email } = req.body;

    if (!dni && !email) {
      return res.status(400).json({ message: 'Debe enviar su DNI o correo electrónico.' });
    }

    // Buscar usuario por DNI o email
    const user = dni ? await findUserByDni(dni) : await findUserByEmail(email);

    if (!user || !user.activo) {
      return res.status(404).json({ message: 'Usuario no encontrado o inactivo.' });
    }

    // Generar código 2FA y guardarlo
    const codigo = generate2FACode();
    await createVerification(user.id, codigo, 'recuperacion');

    // Enviar correo
    const subject = 'Recuperación de contraseña - Sistema Donaciones de Sangre';
    const html = `
      <h2>Recuperación de contraseña</h2>
      <p>Hola ${user.nombre},</p>
      <p>Recibimos una solicitud para restablecer su contraseña. Su código de verificación es:</p>
      <h1 style="letter-spacing:4px;">${codigo}</h1>
      <p>Este código expira en 10 minutos.</p>
      <p>Si usted no solicitó este cambio, puede ignorar este mensaje.</p>
      <br/>
      <p><strong>Sistema Donaciones de Sangre</strong></p>
    `;

    await sendMail(user.email, subject, html);

    res.status(200).json({
      message: 'Se ha enviado un código de verificación a su correo electrónico.',
    });
  } catch (error) {
    console.error('Error en recoverPassword:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
}


async function resetPassword(req, res) {
  try {
    const { dni, codigo, nuevaPassword } = req.body;

    if (!dni || !codigo || !nuevaPassword) {
      return res.status(400).json({ message: 'DNI, código y nueva contraseña son requeridos.' });
    }

    const user = await findUserByDni(dni);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado.' });

    // Verificar código de recuperación
    const verificacion = await verifyCode(user.id, codigo, 'recuperacion');
    if (!verificacion) {
      return res.status(400).json({ message: 'Código inválido o expirado.' });
    }

    // Hashear nueva contraseña
    const hashed = await bcrypt.hash(nuevaPassword, 10);
    await updatePassword(user.id, hashed);

    // Marcar código como usado
    await markCodeAsUsed(verificacion.id);

    return res.status(200).json({ message: 'Contraseña actualizada correctamente.' });
  } catch (error) {
    console.error('Error en resetPassword:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
}

  module.exports = { login, verify2FA, recoverPassword, resetPassword };
