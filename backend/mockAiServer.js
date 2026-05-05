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
  const score = Math.floor(Math.random() * 100) + 1;
  return res.json({ score });
});

app.listen(PORT, () => {
  console.log(`Mock AI server started on port ${PORT}`);
});
