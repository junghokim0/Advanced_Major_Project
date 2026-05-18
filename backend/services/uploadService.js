const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');
const uploadRepository = require('../repositories/uploadRepository');
const analysisRepository = require('../repositories/analysisRepository');
const { normalizePatternType } = require('../utils/patternType');

const AI_SERVER_URL = process.env.AI_SERVER_URL || 'http://localhost:8000';
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

const requestAIServer = async (file, patternType) => {
  const formData = new FormData();
  formData.append('image', fs.createReadStream(file.path), {
    filename: file.originalname,
    contentType: file.mimetype,
  });
  formData.append('patternType', patternType);

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
  const engine = typeof response.data?.engine === 'string' ? response.data.engine : null;

  if (!Number.isInteger(predictedClass) || predictedClass < 1 || predictedClass > 3) {
    throw new Error('Invalid AI response predictedClass.');
  }
  if (!Number.isInteger(rawPredictedClass) || rawPredictedClass < 1 || rawPredictedClass > 3) {
    throw new Error('Invalid AI response rawPredictedClass.');
  }

  return {
    predictedClass,
    rawPredictedClass,
    probabilities,
    corrected,
    correctionReason,
    engine,
  };
};

exports.processUpload = async (file, user, patternTypeInput) => {
  if (!file) {
    const error = new Error('No file uploaded.');
    error.status = 400;
    throw error;
  }

  const patternType = normalizePatternType(patternTypeInput);

  const uploadId = await uploadRepository.saveUploadRecord({
    filename: file.filename,
    originalname: file.originalname,
    size: file.size,
    mimetype: file.mimetype,
    patternType,
    userId: user.userId,
  });

  let analysisResult = null;
  try {
    const aiResponse = await requestAIServer(file, patternType);
    const { predictedClass, rawPredictedClass, probabilities, corrected, correctionReason, engine } =
      aiResponse;
    const confidence = Math.max(probabilities.class1, probabilities.class2, probabilities.class3);
    const resultStage = `class-${predictedClass}`;

    await analysisRepository.saveAnalysisResult({
      uploadId,
      resultStage,
      probability: confidence,
    });

    analysisResult = {
      patternType,
      engine,
      rawPredictedClass,
      predictedClass,
      confidence,
      probabilities,
      corrected,
      correctionReason,
    };
  } catch (aiError) {
    console.error('AI analysis failed:', aiError.message);
  }

  return {
    message: 'Image uploaded successfully.',
    uploadId,
    patternType,
    filename: file.filename,
    originalname: file.originalname,
    size: file.size,
    mimetype: file.mimetype,
    uploadedBy: user.email,
    uploadedAt: new Date().toISOString(),
    analysis: analysisResult,
  };
};
