const express = require('express');
const passport = require('passport');
const AuthController = require('../controllers/AuthController');
const handleDniLogin = AuthController.handleDniLogin;
const handleLoginCentro = AuthController.handleLoginCentro;

require('dotenv').config();

const router = express.Router();

/*  */// Login Google (paso 1) - incluir redirect_to en state para preservarlo
router.get('/auth/google', (req, res, next) => {
  const state = req.query.redirect_to ? encodeURIComponent(req.query.redirect_to) : '';
  return passport.authenticate('google', { scope: ['profile', 'email'], state })(req, res, next);
});

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

      // Priorizar state (redirect_to) enviado en el inicio del flujo
      const stateRedirect = req.query.state ? decodeURIComponent(req.query.state) : null;
      const redirectTo = stateRedirect || req.query.redirect_to || process.env.FRONTEND_URL || 'http://localhost:5500';

      if (redirectTo) {
        const urlConToken = `${redirectTo}?token=${result.token}`;
        return res.redirect(urlConToken);
      }

      res.json(result);
    });
  }
);

// LOGIN CON DNI
router.post('/dni-login', handleDniLogin);

// Login para centro hemoterapia (similar a donante, pero con su propio controlador)
router.post('/login-centro', handleLoginCentro);

module.exports = router;

