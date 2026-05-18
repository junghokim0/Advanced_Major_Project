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
DB_PORT=3307
DB_USER=app_user
DB_PASSWORD=app_password
DB_NAME=app_db
```

> Windows에 MySQL이 이미 설치되어 3306을 쓰는 경우가 많습니다. Docker는 호스트 **3307** → 컨테이너 3306으로 매핑합니다. 로컬 3306을 비우고 Docker를 `3306:3306`으로 쓰려면 `docker-compose.yml`의 ports와 `DB_PORT`를 각각 `3306`으로 맞추면 됩니다.

### 기존 DB에 `pattern_type` 컬럼 추가 (최초 Docker 이후 업데이트한 경우)

**PowerShell (Windows):**

```powershell
cd backend
Get-Content -Raw migrations\001_add_pattern_type.sql | docker compose exec -T mysql mysql -uapp_user -papp_password app_db
```

**bash (macOS / Linux / Git Bash):**

```bash
cd backend
docker compose exec -T mysql mysql -uapp_user -papp_password app_db < migrations/001_add_pattern_type.sql
```

## 2) AI 서버 실행 (통합 FastAPI)

정수리·M자 분석을 **하나의 AI 서버**(`ai/api_server.py`, 포트 8000)에서 처리합니다.

| 패턴 | `patternType` | 동작 |
|------|---------------|------|
| 정수리 | `crown` | `bestmodel/best_model.pth` 실제 추론 |
| M자 | `m_line` | `bestmodel/best_model_mline.pth`가 있으면 실제 추론, 없으면 **서버 내부 mock** |

```bash
cd ai
python -m venv .venv
.\.venv\Scripts\activate
python -m pip install -r requirements.txt
python api_server.py
```

`backend/.env` 예시:

```bash
AI_SERVER_URL=http://localhost:8000
```

M자 학습 모델을 추가할 때는 `ai/bestmodel/best_model_mline.pth`를 넣고 AI 서버만 재시작하면 됩니다. (별도 mock 서버 실행 불필요)

> **레거시:** `backend/mockAiServer.js`(포트 5001)는 이전 개발용입니다. 일상 개발에서는 사용하지 않습니다.

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

앱에서 업로드 전 **정수리 / M자** 패턴을 선택하면, 백엔드가 동일한 `AI_SERVER_URL`로 `patternType`을 함께 전달합니다.

## 5) 실행 확인 체크리스트

- MySQL: `docker ps`에서 `advanced_major_project_mysql` 컨테이너 실행 중
- AI 서버: `http://localhost:8000/health` — `patterns.crown`, `patterns.m_line` 확인
- Backend: `http://localhost:3000` 정상 응답
- Frontend: Expo QR 코드 표시 후 앱 접속 가능

## 아키텍처 요약

```text
[앱] patternType 선택 (crown | m_line)
  → [Backend :3000] uploads.pattern_type 저장 + AI 호출
  → [FastAPI :8000] patternType 분기
       crown  → EfficientNet + best_model.pth
       m_line → best_model_mline.pth 또는 내부 mock
```

- DB: `uploads.pattern_type`으로 패턴 구분 (테이블 복제 없음)
- 이력: `GET /api/analysis/history?patternType=crown` (또는 `m_line`)로 패턴별 조회
