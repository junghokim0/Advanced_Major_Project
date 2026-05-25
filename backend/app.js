const express = require('express');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const cors = require('cors');
const apiRouter = require('./routes');
const errorHandler = require('./middlewares/errorHandler');
const { seedDefaultUser } = require('./utils/seedUser');

const app = express();

if (process.env.REQUIRE_HTTPS === 'true') {
  app.set('trust proxy', 1);
}

app.use(cors());

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// uploads 폴더를 정적 폴더로 설정
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api', apiRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

app.use(errorHandler);

const PORT = process.env.PORT || 3000;

(async () => {
  await seedDefaultUser();

  app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
  });
})();
