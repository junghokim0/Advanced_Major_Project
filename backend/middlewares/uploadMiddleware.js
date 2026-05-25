const multer = require('multer');
const path = require('path');
const fs = require('fs');

// uploads 폴더가 없으면 생성
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// 파일 저장 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// 파일 필터링: .jpg, .png만 허용 (.jpeg 확장자 제외)
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext === '.jpeg') {
    return cb(new Error('Only .jpg or .png files are allowed (.jpeg extension is not supported).'), false);
  }
  if (ext === '.jpg' && /jpeg|jpg/.test(file.mimetype)) {
    return cb(null, true);
  }
  if (ext === '.png' && /png/.test(file.mimetype)) {
    return cb(null, true);
  }
  cb(new Error('Only image files (.jpg, .png) are allowed!'), false);
};

// multer 설정
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB 제한
  }
});

module.exports = upload;