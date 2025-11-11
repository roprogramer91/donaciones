// services/auth/routes/testEmail.routes.js
const express = require('express');
const router = express.Router();
const { enviarCodigo2FA } = require('../utils/mailer');

router.get('/test-email', async (req, res) => {
  try {
    const enviado = await enviarCodigo2FA(
      'verificaciones@donaciones.roprogrammer.online', // 👈 Cambiá por tu correo real para probar
      '123456'
    );

    if (enviado) {
      res.json({ message: '✅ Correo de prueba enviado correctamente.' });
    } else {
      res.status(500).json({ message: '❌ Error al enviar el correo.' });
    }
  } catch (error) {
    console.error('Error en test-email:', error);
    res.status(500).json({ message: 'Error interno al enviar el correo.' });
  }
});

module.exports = router;
