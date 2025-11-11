// services/auth/routes/auth.routes.js
const express = require('express');
const { login, verify2FA, recoverPassword,resetPassword } = require('../controllers/auth.controller');


const router = express.Router();

router.post('/login', login);
router.post('/verify-2fa', verify2FA);
router.post('/recover', recoverPassword);
router.post('/reset', resetPassword);

module.exports = router;
