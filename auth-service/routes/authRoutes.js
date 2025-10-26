const express = require('express');
const passport = require('passport');
const AuthController = require('../controllers/AuthController');
const handleDniLogin = AuthController.handleDniLogin;
const handleLoginCentro = AuthController.handleLoginCentro;

require('dotenv').config();

const router = express.Router();

// Login Google (paso 1)
router.get(
  '/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Callback (paso 2)
router.get(
  '/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    AuthController.handleGoogleLogin(req.user, (err, result) => {
      if (err) {
        console.error('Error en handleGoogleLogin:', err);
        return res.status(500).json({ error: 'Error en la autenticación' });
      }

      // Redirección dinámica (desde query, o default a FRONTEND_URL)
      const redirectTo =
        req.query.redirect_to ||
        process.env.FRONTEND_URL ||
        'http://localhost:5500';

      // ¡Redirigí SIEMPRE agregando el token!
      if (redirectTo) {
        // Tip: Podés guardar el redirect_to en la DB/log si querés auditar el tráfico.
        const urlConToken = `${redirectTo}?token=${result.token}`;
        return res.redirect(urlConToken);
      }

      // En apps móviles/desktop, devolvé JSON si no hay redirect
      res.json(result);
    });
  }
);


//LOGIN CON DNI 
router.post('/dni-login', handleDniLogin);


//Loguin para centro hemoterapia (similar a donante, pero con su propio controlador)
router.post('/login-centro', handleLoginCentro);



module.exports = router;
