const fs = require('fs');
const path = require('path');
const uploadService = require('../services/uploadService');

const detectMimeType = (filename = '') => {
  const ext = path.extname(filename).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  return 'image/jpeg';
};

exports.uploadImage = async (req, res, next) => {
  try {
    let file = req.file;

    // FormData 업로드가 아니라 JSON Base64 업로드인 경우 처리
    if (!file && req.body.file) {
      console.log('[Upload] Received Base64 upload');
      
      const { file: base64String, filename, mimetype } = req.body;

      if (!base64String) {
        const error = new Error('No file data provided.');
        error.status = 400;
        return next(error);
      }

      // Base64를 버퍼로 변환
      const buffer = Buffer.from(base64String, 'base64');
      
      // 임시 파일로 저장
      const uploadsDir = path.join(__dirname, '../uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(filename || 'photo.jpg');
      const savedFilename = `upload-${uniqueSuffix}${ext}`;
      const filepath = path.join(uploadsDir, savedFilename);

      fs.writeFileSync(filepath, buffer);

      file = {
        fieldname: 'image',
        originalname: filename || 'photo.jpg',
        encoding: '7bit',
        mimetype: (mimetype && mimetype.includes('/')) ? mimetype : detectMimeType(filename || 'photo.jpg'),
        size: buffer.length,
        destination: uploadsDir,
        filename: savedFilename,
        path: filepath,
      };

      console.log('[Upload] Base64 file saved:', {
        filename: file.filename,
        originalname: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
      });
    }

    // FormData 업로드인 경우
    if (!file) {
      const error = new Error('No file uploaded.');
      error.status = 400;
      return next(error);
    }

    console.log('Upload file received:', {
      fieldname: file.fieldname,
      originalname: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
    });

    const result = await uploadService.processUpload(file, req.user, req.body.patternType);
    res.json(result);
  } catch (error) {
    console.error('Upload error:', error);
    next(error);
  }
};