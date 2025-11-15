// En este archivo configuro y utilizo el transportador de correos
const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: true, // Aqui uso TLS cuando el puerto es 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// Aqui envio un correo generico
async function sendMail(to, subject, html) {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
    });
    console.log(`Correo enviado a ${to}: ${subject}`);
    return info;
  } catch (error) {
    console.error('Error enviando correo:', error);
    throw error;
  }
}

// Aqui envio el codigo especifico para 2FA
async function enviarCodigo2FA(destinatario, codigo) {
  const html = `
    <div style="font-family: Arial, sans-serif; text-align:center;">
      <h2>Verificacion de acceso</h2>
      <p>Tu codigo de verificacion es:</p>
      <h1 style="color:#e63946;">${codigo}</h1>
      <p>El codigo expira en 5 minutos.</p>
      <hr/>
      <p style="font-size:12px; color:#777;">Sistema Donaciones de Sangre</p>
    </div>
  `;
  return sendMail(destinatario, 'Codigo de verificacion - Donaciones de Sangre', html);
}

module.exports = { enviarCodigo2FA, sendMail };
