const fs = require('fs');
const path = require('path');
const uploadService = require('../services/uploadService');
const { validateUploadBuffer } = require('../utils/uploadImageValidation');

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

      let buffer;
      try {
        buffer = Buffer.from(base64String, 'base64');
      } catch {
        const error = new Error('잘못된 이미지 데이터 형식입니다.');
        error.status = 400;
        return next(error);
      }

      const validation = validateUploadBuffer(
        buffer,
        mimetype,
        filename || 'photo.jpg'
      );
      if (!validation.ok) {
        const error = new Error(validation.error);
        error.status = 400;
        return next(error);
      }

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

    const fileBuffer = fs.readFileSync(file.path);
    const fileValidation = validateUploadBuffer(
      fileBuffer,
      file.mimetype,
      file.originalname
    );
    if (!fileValidation.ok) {
      try {
        fs.unlinkSync(file.path);
      } catch {
        // ignore
      }
      const error = new Error(fileValidation.error);
      error.status = 400;
      return next(error);
    }

    console.log('Upload file received:', {
      fieldname: file.fieldname,
      originalname: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
    });

    const patternType =
      req.body?.patternType || req.headers['x-pattern-type'] || req.query?.patternType;
    console.log('[Upload] patternType:', patternType);

    const result = await uploadService.processUpload(file, req.user, patternType);
    res.json(result);
  } catch (error) {
    console.error('Upload error:', error);
    next(error);
  }
};