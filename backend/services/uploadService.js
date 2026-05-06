const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');
const uploadRepository = require('../repositories/uploadRepository');
const analysisRepository = require('../repositories/analysisRepository');

const AI_SERVER_URL = process.env.AI_SERVER_URL || 'http://localhost:5001';
const AI_SERVER_TIMEOUT_MS = Number(process.env.AI_SERVER_TIMEOUT_MS || 10000);

const normalizeProbabilities = (probabilities) => {
  const class1 = Number(probabilities?.class1);
  const class2 = Number(probabilities?.class2);
  const class3 = Number(probabilities?.class3);

  if (
    !Number.isFinite(class1) ||
    !Number.isFinite(class2) ||
    !Number.isFinite(class3) ||
    class1 < 0 ||
    class2 < 0 ||
    class3 < 0
  ) {
    throw new Error('Invalid AI response probabilities.');
  }

  const total = class1 + class2 + class3;
  if (total <= 0) {
    throw new Error('Invalid AI response probabilities.');
  }

  return {
    class1: Number((class1 / total).toFixed(4)),
    class2: Number((class2 / total).toFixed(4)),
    class3: Number((class3 / total).toFixed(4)),
  };
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

  const predictedClass = Number(response.data?.predictedClass);
  const rawPredictedClass = Number(response.data?.rawPredictedClass ?? predictedClass);
  const probabilities = normalizeProbabilities(response.data?.probabilities || {});
  const corrected = Boolean(response.data?.corrected);
  const correctionReason =
    typeof response.data?.correctionReason === 'string' ? response.data.correctionReason : null;

  if (!Number.isInteger(predictedClass) || predictedClass < 1 || predictedClass > 3) {
    throw new Error('Invalid AI response predictedClass.');
  }
  if (!Number.isInteger(rawPredictedClass) || rawPredictedClass < 1 || rawPredictedClass > 3) {
    throw new Error('Invalid AI response rawPredictedClass.');
  }

  return { predictedClass, rawPredictedClass, probabilities, corrected, correctionReason };
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
    const { predictedClass, rawPredictedClass, probabilities, corrected, correctionReason } = aiResponse;
    const confidence = Math.max(probabilities.class1, probabilities.class2, probabilities.class3);
    const resultStage = `class-${predictedClass}`;

    // 기존 DB 스키마를 유지하기 위해 predictedClass/confidence를 저장.
    await analysisRepository.saveAnalysisResult({
      uploadId,
      resultStage,
      probability: confidence,
    });

    analysisResult = {
      rawPredictedClass,
      predictedClass,
      confidence,
      probabilities,
      corrected,
      correctionReason,
    };
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