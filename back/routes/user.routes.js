const express = require('express');
const router = express.Router();
const authMiddleware = require('../services/auth/middleware/authMiddleware');
const UserController = require('../controllers/users.controller');

router.post('/roles', authMiddleware, UserController.updateRoles);
router.get('/me', authMiddleware, UserController.getMe);

module.exports = router;
