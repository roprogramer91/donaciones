// En este archivo manejo las rutas relacionadas a la autenticación.
const { Router } = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  register,
  login,
  verify2FA,
  recoverPassword,
  resetPassword,
} = require("../controllers/auth.controller");

const router = Router();
// Ruta para registrar un nuevo usuario
// POST /api/auth/register
router.post("/register", register);

// Ruta para iniciar sesión
// POST /api/auth/login
router.post("/login", login);

// Ruta para verificar el código de 2FA
// POST /api/auth/verify-2fa
router.post("/verify-2fa", verify2FA);

// Rutas para recuperación de contraseña
router.post("/recover-password", recoverPassword);
router.post("/reset-password", resetPassword);

// Ruta para validar un token existente
router.get("/validate", authMiddleware, (req, res) => {
  return res.status(200).json({ valid: true, user: req.user });
});

module.exports = router;
