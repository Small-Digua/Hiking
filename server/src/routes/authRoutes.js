const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Public route to check email existence
router.post('/check-email', authController.checkEmail);

module.exports = router;
