// En este archivo gestiono el flujo de autenticacion

// Aqui importo los modulos necesarios
const bcrypt = require("bcrypt");
const {
  createUser,
  findUserByid,
  findUserByDni,
  findUserByEmail,
  updatePassword,
} = require("../models/usuarios.model");
const {
  createVerification,
  verifyCode,
  markCodeAsUsed,
} = require("../models/verificaciones2FA.model");
const DispositivosConfianza = require("../models/dispositivosConfianza.model");
const { generate2FACode } = require("../utils/generate2FACode");
const { generarToken } = require("../utils/jwt");
const { enviarCodigo2FA, sendMail } = require("../utils/mailer");

// Aqui registro un nuevo usuario
async function register(req, res) {
  try {
    const { nombre, apellido, email, dni, telefono, password } = req.body;

    if (!nombre || !apellido || !email || !dni || !telefono || !password) {
      return res
        .status(400)
        .json({ message: "Todos los campos son obligatorios." });
    }

    const emailExistente = await findUserByEmail(email);
    if (emailExistente) {
      return res.status(409).json({ message: "El email ya está registrado." });
    }

    const existenteDni = await findUserByDni(dni); // Esta validación ya la habíamos agregado, está perfecta.
    if (existenteDni) {
      return res.status(409).json({ message: "El DNI ya está registrado." });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const nuevoUsuario = await createUser({
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      email,
      dni,
      telefono,
      password_hash,
      tipo_usuario: "donante",
      activo: true,
    });

    return res.json({
      message: "Usuario registrado",
      usuario_id: nuevoUsuario.id,
    });
  } catch (error) {
    console.error("Error en register:", error);
    return res.status(500).json({ message: "Error interno del servidor." });
  }
}

async function login(req, res) {
  try {
    const { dni, email, password, skip2FA } = req.body; // skip2FA es para el post-registro
    const trustedDeviceToken = req.cookies.trusted_device_token;

    // --- INICIO DE MEJORA: "Confiar en este dispositivo" ---
    if (trustedDeviceToken) {
      const trustedDevice = await DispositivosConfianza.findValidToken(
        trustedDeviceToken
      );
      if (trustedDevice) {
        const user = await findUserByid(trustedDevice.usuario_id);
        if (user) {
          const finalToken = generarToken({
            id: user.id,
            dni: user.dni,
            email: user.email,
            tipo_usuario: user.tipo_usuario,
          });
          return res.status(200).json({
            message: "Login exitoso desde dispositivo de confianza.",
            token: finalToken,
          });
        }
      }
    }

    if (!password)
      return res.status(400).json({ message: "Contraseña requerida." });

    // Busco al usuario por email o por DNI, de forma más directa.
    const user = email
      ? await findUserByEmail(email)
      : await findUserByDni(dni);

    if (!user || !user.activo) {
      return res
        .status(401)
        .json({ message: "Usuario no encontrado o inactivo." });
    }

    // Aqui valido la contrasena
    const valid = await bcrypt.compare(password, user.password_hash || "");
    if (!valid) {
      return res.status(401).json({ message: "Contraseña incorrecta." });
    }

    // Si es un login post-registro, salteo el 2FA y devuelvo el token final
    if (skip2FA === true) {
      const finalToken = generarToken({
        id: user.id,
        dni: user.dni,
        email: user.email,
        tipo_usuario: user.tipo_usuario,
      });
      return res.status(200).json({
        message: "Login exitoso.",
        token: finalToken,
        dni: user.dni,
        tipo_usuario: user.tipo_usuario,
      });
    }

    // Aqui genero el codigo de 2FA
    const codigo = generate2FACode();
    await createVerification(user.id, codigo, "email");
    await enviarCodigo2FA(user.email, codigo);

    // Aqui genero un token temporal
    const tempToken = generarToken({
      id: user.id,
      dni: user.dni,
      email: user.email,
      tipo_usuario: user.tipo_usuario,
    });

    res.status(200).json({
      message: "Código 2FA enviado.",
      usuario_id: user.id,
      temp_token: tempToken,
    });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
}

// Aqui verifico el flujo de 2FA
async function verify2FA(req, res) {
  console.log("🧠 Body recibido en verify:", req.body);

  try {
    const { usuario_id, codigo, trust_device } = req.body;

    if (!usuario_id || !codigo)
      return res.status(400).json({ message: "Datos incompletos." });

    const verification = await verifyCode(usuario_id, codigo);
    if (!verification)
      return res.status(401).json({ message: "Código inválido o expirado." });

    if (!verification || !verification.id) {
      console.error(
        "⚠️ No se pudo obtener verification o su ID:",
        verification
      );
      return res
        .status(500)
        .json({ message: "Error interno: verification sin ID." });
    }
    await markCodeAsUsed(verification.id);

    // --- INICIO DE MEJORA: "Confiar en este dispositivo" ---
    if (trust_device === true) {
      const userAgent = req.headers["user-agent"];
      const ip = req.ip;
      const dispositivo = await DispositivosConfianza.crear(
        usuario_id,
        userAgent,
        ip
      );

      res.cookie("trusted_device_token", dispositivo.token_dispositivo, {
        httpOnly: true, // El cookie no es accesible por JS en el navegador
        secure: process.env.NODE_ENV === "production", // Solo por HTTPS en producción
        sameSite: "strict",
        expires: new Date(dispositivo.expires_at),
      });
    }

    // Aqui genero el token definitivo
    const user = await findUserByid(req.body.usuario_id);

    const finalToken = generarToken({
      id: user.id,
      dni: user.dni,
      email: user.email,
      tipo_usuario: user.tipo_usuario,
    });

    res.status(200).json({
      message: "Verificación 2FA exitosa.",
      token: finalToken,
      email: user.email,
      tipo_usuario: user.tipo_usuario,
    });
  } catch (error) {
    console.error("Error en verify-2fa:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
}

// Aqui gestiono la recuperacion de contrasena

async function recoverPassword(req, res) {
  try {
    const { dni, email } = req.body;

    if (!dni && !email) {
      return res
        .status(400)
        .json({ message: "Debe enviar su DNI o correo electrónico." });
    }

    // Aqui busco el usuario para la recuperacion
    const user = dni ? await findUserByDni(dni) : await findUserByEmail(email);

    if (!user || !user.activo) {
      return res
        .status(404)
        .json({ message: "Usuario no encontrado o inactivo." });
    }

    // Aqui genero el codigo de 2FA y lo guardo
    const codigo = generate2FACode();
    await createVerification(user.id, codigo, "recuperacion");

    // Aqui envio el correo con el codigo
    const subject = "Recuperación de contraseña - Sistema Donaciones de Sangre";
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
      message:
        "Se ha enviado un código de verificación a su correo electrónico.",
    });
  } catch (error) {
    console.error("Error en recoverPassword:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
}

async function resetPassword(req, res) {
  try {
    const { dni, codigo, nuevaPassword } = req.body;

    if (!dni || !codigo || !nuevaPassword) {
      return res
        .status(400)
        .json({ message: "DNI, código y nueva contraseña son requeridos." });
    }

    const user = await findUserByDni(dni);
    if (!user)
      return res.status(404).json({ message: "Usuario no encontrado." });

    // Aqui verifico el codigo de recuperacion
    const verificacion = await verifyCode(user.id, codigo, "recuperacion");
    if (!verificacion) {
      return res.status(400).json({ message: "Código inválido o expirado." });
    }

    // Aqui hasheo la nueva contrasena
    const hashed = await bcrypt.hash(nuevaPassword, 10);
    await updatePassword(user.id, hashed);

    // Aqui marco el codigo como usado
    await markCodeAsUsed(verificacion.id);

    return res
      .status(200)
      .json({ message: "Contraseña actualizada correctamente." });
  } catch (error) {
    console.error("Error en resetPassword:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
}

module.exports = { register, login, verify2FA, recoverPassword, resetPassword };
