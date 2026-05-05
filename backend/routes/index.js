const express = require('express');
const router = express.Router();
const healthRouter = require('./health');
const authRouter = require('./auth');
const uploadRouter = require('./upload');
const analysisRouter = require('./analysis');

router.use('/health', healthRouter);
router.use('/auth', authRouter);
router.use('/upload', uploadRouter);
router.use('/analysis', analysisRouter);

module.exports = router;
