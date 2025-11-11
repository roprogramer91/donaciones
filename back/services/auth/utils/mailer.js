const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: true, // SSL (puerto 465)
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false, // necesario a veces en Hostinger
  },
});

async function enviarCodigo2FA(destinatario, codigo) {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: destinatario,
    subject: 'Código de verificación - Donaciones de Sangre',
    html: `
      <div style="font-family: Arial, sans-serif; text-align:center;">
        <h2>Verificación de acceso</h2>
        <p>Tu código de verificación es:</p>
        <h1 style="color:#e63946;">${codigo}</h1>
        <p>El código expirará en 5 minutos.</p>
        <hr/>
        <p style="font-size:12px; color:#777;">Sistema Donaciones de Sangre</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📧 Código 2FA enviado a ${destinatario}`);
    return true;
  } catch (error) {
    console.error('❌ Error enviando correo 2FA:', error);
    return false;
  }
}

module.exports = { enviarCodigo2FA };
