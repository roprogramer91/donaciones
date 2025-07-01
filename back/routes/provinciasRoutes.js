const express = require('express');
const router = express.Router();

const provinciasController = require('../controllers/provinciasController');

router.get('/', provinciasController.getProvincias);

module.exports = router;