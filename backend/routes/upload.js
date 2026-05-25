const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const { authenticateToken } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');
const { requireHttpsWhenEnabled } = require('../middlewares/uploadSecurityMiddleware');

const optionalImageUpload = (req, res, next) => {
  const contentType = req.headers['content-type'] || '';
  if (contentType.includes('multipart/form-data')) {
    return upload.single('image')(req, res, next);
  }
  return next();
};

router.post(
  '/image',
  requireHttpsWhenEnabled,
  authenticateToken,
  optionalImageUpload,
  uploadController.uploadImage
);

module.exports = router;