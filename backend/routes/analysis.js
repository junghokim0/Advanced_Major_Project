const express = require('express');
const router = express.Router();
const analysisController = require('../controllers/analysisController');
const { authenticateToken } = require('../middlewares/authMiddleware');

router.get('/history', authenticateToken, analysisController.getHistory);

module.exports = router;