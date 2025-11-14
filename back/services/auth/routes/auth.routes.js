// services/auth/routes/auth.routes.js
const express = require('express');
const { register, login, verify2FA, recoverPassword,resetPassword } = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/authMiddleware');  

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/verify', verify2FA);
router.post('/recover', recoverPassword);
router.post('/reset', resetPassword);

router.get("/validate", authMiddleware, (req, res) => {
  return res.status(200).json({ valid: true });
});


module.exports = router;
