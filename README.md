# Advanced_Major_Project
전공심화프로젝트
<img width="3572" height="5241" alt="시스템 아키텍처" src="https://github.com/user-attachments/assets/04f64c1d-1642-44cc-bddf-a08bf28827d1" />

## 실행 방법

프로젝트를 받은 뒤 아래 순서대로 실행합니다.

## 0) 사전 준비

- Node.js 20+
- Python 3.11+ (권장: 가상환경)
- Docker Desktop (MySQL 실행용)
- 모바일 테스트 시, PC와 모바일을 같은 네트워크에 연결

## 1) MySQL 실행

```bash
cd backend
docker compose up -d
```

MySQL이 켜지면 `backend/.env`의 DB 값이 아래와 같은지 확인합니다.

```bash
DB_HOST=localhost
DB_USER=app_user
DB_PASSWORD=app_password
DB_NAME=app_db
```

## 2) AI 서버 실행 (택1)

### 2-A) Mock AI 서버 (개발용 fallback)
```bash
cd backend
npm run start:ai-mock
```

이때 `backend/.env`의 `AI_SERVER_URL`은 아래처럼 유지합니다.

```bash
AI_SERVER_URL=http://localhost:5001
```

### 2-B) Real AI 서버 (FastAPI + PyTorch)
```bash
cd ai
python -m venv .venv
.\.venv\Scripts\activate
python -m pip install -r requirements.txt
python api_server.py
```

이때 `backend/.env`의 `AI_SERVER_URL`을 아래처럼 바꿉니다.

```bash
AI_SERVER_URL=http://localhost:8000
```

## 3) Backend API 서버 실행

```bash
cd backend
npm install
npm start
```

## 4) Frontend 앱 실행
```bash
cd frontend
npm install
npm start
```

## 5) 실행 확인 체크리스트

- MySQL: `docker ps`에서 `advanced_major_project_mysql` 컨테이너 실행 중
- AI 서버:
  - Mock 모드: `http://localhost:5001/health`
  - Real 모드: `http://localhost:8000/health`
- Backend: `http://localhost:3000` 정상 응답
- Frontend: Expo QR 코드 표시 후 앱 접속 가능

## AI 서버 전환 기준

- `AI_SERVER_URL=http://localhost:5001` -> `backend/mockAiServer.js` 사용
- `AI_SERVER_URL=http://localhost:8000` -> `ai/api_server.py` 사용

백엔드 코드는 동일하며, URL만 바꿔 mock/real 서버를 전환할 수 있습니다.
