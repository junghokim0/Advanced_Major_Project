/**
 * @deprecated 통합 AI 서버(ai/api_server.py)의 m_line 내부 mock을 사용합니다.
 * 레거시/단독 테스트용으로만 유지합니다.
 */
const express = require('express');
const multer = require('multer');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const PORT = Number(process.env.AI_MOCK_PORT || 5001);

app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'mock-ai-server' });
});

app.post('/analyze', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Image file is required.' });
  }

  await new Promise((resolve) => setTimeout(resolve, 800));
  const raw = [Math.random(), Math.random(), Math.random()];
  const sum = raw.reduce((acc, cur) => acc + cur, 0);
  const probabilities = raw.map((value) => Number((value / sum).toFixed(4)));
  const maxProb = Math.max(...probabilities);
  const predictedClass = probabilities.indexOf(maxProb) + 1;

  return res.json({
    predictedClass,
    probabilities: {
      class1: probabilities[0],
      class2: probabilities[1],
      class3: probabilities[2],
    },
  });
});

app.listen(PORT, () => {
  console.log(`Mock AI server started on port ${PORT}`);
});
