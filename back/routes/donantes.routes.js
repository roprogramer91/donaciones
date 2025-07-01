const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { crearDonante, obtenerDonantes, getDonanteByEmail } = require('../controllers/donantes.controller');

router.get('/', obtenerDonantes);
router.post('/', authMiddleware, crearDonante);

router.get('/me', authMiddleware, getDonanteByEmail);

module.exports = router;
