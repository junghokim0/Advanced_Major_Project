# Advanced_Major_Project
전공심화프로젝트
<img width="3572" height="5241" alt="시스템 아키텍처" src="https://github.com/user-attachments/assets/04f64c1d-1642-44cc-bddf-a08bf28827d1" />

## 실행 방법

프로젝트를 받은 뒤 아래처럼 터미널 3개를 열어서 실행합니다.

### 1) Backend API 서버
```bash
cd backend
npm start
```

### 2) AI 서버 (택1)

#### 2-A) Mock AI 서버 (개발용 fallback)
```bash
cd backend
npm run start:ai-mock
```

이때 `backend/.env`의 `AI_SERVER_URL`은 아래처럼 유지합니다.

```bash
AI_SERVER_URL=http://localhost:5001
```

#### 2-B) Real AI 서버 (FastAPI + PyTorch)
```bash
cd ai
pip install -r requirements.txt
python api_server.py
```

이때 `backend/.env`의 `AI_SERVER_URL`을 아래처럼 바꿉니다.

```bash
AI_SERVER_URL=http://localhost:8000
```

### 3) Frontend 앱
```bash
cd frontend
npm start
```

## AI 서버 전환 기준

- `AI_SERVER_URL=http://localhost:5001` -> `backend/mockAiServer.js` 사용
- `AI_SERVER_URL=http://localhost:8000` -> `ai/api_server.py` 사용

백엔드 코드는 동일하며, URL만 바꿔 mock/real 서버를 전환할 수 있습니다.
