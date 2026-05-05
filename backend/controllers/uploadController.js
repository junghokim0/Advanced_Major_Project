const uploadService = require('../services/uploadService');

exports.uploadImage = async (req, res, next) => {
  try {
    const result = await uploadService.processUpload(req.file, req.user);
    res.json(result);
  } catch (error) {
    next(error);
  }
};