const nodemailer = require('nodemailer');
require('dotenv').config();

// === CONFIGURACIÓN DEL TRANSPORTADOR ===
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: true, // true si usás puerto 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false, // necesario a veces en Hostinger
  },
});

// === FUNCIÓN GENÉRICA PARA ENVIAR CORREOS ===
async function sendMail(to, subject, html) {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
    });
    console.log(`📧 Correo enviado a ${to}: ${subject}`);
    return info;
  } catch (error) {
    console.error('❌ Error enviando correo:', error);
    throw error;
  }
}

// === FUNCIÓN ESPECÍFICA PARA 2FA ===
async function enviarCodigo2FA(destinatario, codigo) {
  const html = `
    <div style="font-family: Arial, sans-serif; text-align:center;">
      <h2>Verificación de acceso</h2>
      <p>Tu código de verificación es:</p>
      <h1 style="color:#e63946;">${codigo}</h1>
      <p>El código expirará en 5 minutos.</p>
      <hr/>
      <p style="font-size:12px; color:#777;">Sistema Donaciones de Sangre</p>
    </div>
  `;
  return sendMail(destinatario, 'Código de verificación - Donaciones de Sangre', html);
}

module.exports = { enviarCodigo2FA, sendMail };
