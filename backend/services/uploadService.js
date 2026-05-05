const uploadRepository = require('../repositories/uploadRepository');
const analysisRepository = require('../repositories/analysisRepository');

// Mock AI 분석 함수
const mockAIAnalysis = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const stages = ['stage1', 'stage2', 'stage3'];
      const resultStage = stages[Math.floor(Math.random() * stages.length)];
      const probability = Math.round((Math.random() * (0.98 - 0.75) + 0.75) * 10000) / 10000; // 소수점 4자리

      resolve({ result_stage: resultStage, probability });
    }, 2000); // 2초 대기
  });
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

  // Mock AI 분석 요청
  let analysisResult = null;
  try {
    const aiResponse = await mockAIAnalysis();

    const { result_stage, probability } = aiResponse;

    // 분석 결과 저장
    await analysisRepository.saveAnalysisResult({
      uploadId,
      resultStage: result_stage,
      probability,
    });

    analysisResult = { resultStage: result_stage, probability };
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