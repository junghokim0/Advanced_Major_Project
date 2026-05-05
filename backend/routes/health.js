const express = require('express');
const router = express.Router();
const healthController = require('../controllers/healthController');
const healthMiddleware = require('../middlewares/healthMiddleware');

router.get('/', healthMiddleware.checkRequest, healthController.checkHealth);

module.exports = router;
