const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');
const uploadRepository = require('../repositories/uploadRepository');
const analysisRepository = require('../repositories/analysisRepository');
const { normalizePatternType } = require('../utils/patternType');
const { parseAiBlurError } = require('../utils/aiErrorParser');

const AI_SERVER_URL = process.env.AI_SERVER_URL || 'http://localhost:8000';
const AI_SERVER_TIMEOUT_MS = Number(process.env.AI_SERVER_TIMEOUT_MS || 30000);

const formatAiError = (error) => {
  if (error.response) {
    const detail = error.response.data?.detail || error.response.data?.error || error.response.data;
    return `AI HTTP ${error.response.status}: ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`;
  }
  if (error.code) {
    return `${error.code}: ${error.message || 'AI server unreachable'}`;
  }
  return error.message || 'AI analysis failed';
};

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

  const analyzeUrl = `${AI_SERVER_URL}/analyze?patternType=${encodeURIComponent(patternType)}`;
  const response = await axios.post(analyzeUrl, formData, {
    headers: formData.getHeaders(),
    timeout: AI_SERVER_TIMEOUT_MS,
  });

  const aiPatternType = response.data?.patternType;
  if (aiPatternType && aiPatternType !== patternType) {
    console.warn(
      `[Upload] AI patternType mismatch: requested=${patternType}, response=${aiPatternType}`
    );
  }

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
    patternType: aiPatternType || patternType,
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
  console.log(`[Upload] AI analyze patternType=${patternType} url=${AI_SERVER_URL}`);

  let analysisResult = null;
  let analysisError = null;
  let aiResponse;
  try {
    aiResponse = await requestAIServer(file, patternType);
    const {
      patternType: aiPatternType,
      predictedClass,
      rawPredictedClass,
      probabilities,
      corrected,
      correctionReason,
      engine,
    } = aiResponse;
    const confidence = Math.max(probabilities.class1, probabilities.class2, probabilities.class3);
    analysisResult = {
      patternType: aiPatternType,
      engine,
      rawPredictedClass,
      predictedClass,
      confidence,
      probabilities,
      corrected,
      correctionReason,
    };
  } catch (aiError) {
    const blurError = parseAiBlurError(aiError);
    if (blurError) {
      throw blurError;
    }
    analysisError = formatAiError(aiError);
    console.error('AI analysis failed:', analysisError);
  }

  const uploadId = await uploadRepository.saveUploadRecord({
    filename: file.filename,
    originalname: file.originalname,
    size: file.size,
    mimetype: file.mimetype,
    patternType,
    userId: user.userId,
  });

  if (analysisResult) {
    const confidence = Math.max(
      aiResponse.probabilities.class1,
      aiResponse.probabilities.class2,
      aiResponse.probabilities.class3
    );
    await analysisRepository.saveAnalysisResult({
      uploadId,
      resultStage: `class-${aiResponse.predictedClass}`,
      probability: confidence,
    });
  }

  return {
    message: analysisResult
      ? 'Image uploaded and analyzed successfully.'
      : 'Image uploaded, but analysis failed.',
    uploadId,
    patternType,
    filename: file.filename,
    originalname: file.originalname,
    size: file.size,
    mimetype: file.mimetype,
    uploadedBy: user.email,
    uploadedAt: new Date().toISOString(),
    analysis: analysisResult,
    analysisStatus: analysisResult ? 'success' : 'failed',
    analysisError,
  };
};
