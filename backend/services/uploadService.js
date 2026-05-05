const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');
const uploadRepository = require('../repositories/uploadRepository');
const analysisRepository = require('../repositories/analysisRepository');

const AI_SERVER_URL = process.env.AI_SERVER_URL || 'http://localhost:5001';
const AI_SERVER_TIMEOUT_MS = Number(process.env.AI_SERVER_TIMEOUT_MS || 10000);

const getCategoryByScore = (score) => {
  if (score <= 33) return 1;
  if (score <= 66) return 2;
  return 3;
};

const requestAIServer = async (file) => {
  const formData = new FormData();
  formData.append('image', fs.createReadStream(file.path), {
    filename: file.originalname,
    contentType: file.mimetype,
  });

  const response = await axios.post(`${AI_SERVER_URL}/analyze`, formData, {
    headers: formData.getHeaders(),
    timeout: AI_SERVER_TIMEOUT_MS,
  });

  const score = Number(response.data?.score);
  if (!Number.isInteger(score) || score < 1 || score > 100) {
    throw new Error('Invalid AI response score.');
  }

  return { score };
};

exports.processUpload = async (file, user) => {
  if (!file) {
    const error = new Error('No file uploaded.');
    error.status = 400;
    throw error;
  }

  const uploadId = await uploadRepository.saveUploadRecord({
    filename: file.filename,
    originalname: file.originalname,
    size: file.size,
    mimetype: file.mimetype,
    userId: user.userId,
  });

  // AI 서버에 파일을 전달해 점수(1~100)를 받는다.
  let analysisResult = null;
  try {
    const aiResponse = await requestAIServer(file);
    const score = aiResponse.score;
    const category = getCategoryByScore(score);
    const resultStage = `score-${score}`;
    const probability = Number((score / 100).toFixed(4));

    // 기존 DB 스키마를 유지하기 위해 score를 stage/probability로 매핑해 저장.
    await analysisRepository.saveAnalysisResult({
      uploadId,
      resultStage,
      probability,
    });

    analysisResult = { score, category };
  } catch (aiError) {
    console.error('AI analysis failed:', aiError.message);
    // AI 실패 시에도 업로드는 성공으로 처리
  }

  return {
    message: 'Image uploaded successfully.',
    uploadId,
    filename: file.filename,
    originalname: file.originalname,
    size: file.size,
    mimetype: file.mimetype,
    uploadedBy: user.email,
    uploadedAt: new Date().toISOString(),
    analysis: analysisResult,
  };
};