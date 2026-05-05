const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authValidator = require('../middlewares/authValidator');

router.post('/signup', authValidator.validateSignup, authController.signup);
router.post('/login', authValidator.validateLogin, authController.login);

module.exports = router;
