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

## M자 커스텀 촬영 (프론트엔드)

| 구분 | 상태 | 설명 |
|------|------|------|
| 커스텀 카메라 | 구현됨 | M자 + Take Photo → `CameraCaptureScreen` (`expo-camera`) |
| 수평 확인 | 구현됨 | 가속도계 기준, 수평일 때만 촬영 가능 |
| 가이드라인(타원 프레임) | 구현됨 | `guideLayouts.js` 비율로 조정, `CaptureGuideOverlay` |
| 가이드 영역 crop 업로드 | 구현됨 | 촬영 후 `guideLayouts` 동일 비율로 bounding box crop → 업로드 |
| 폰 pitch 각도 (이마 쪽, 기본 **-10°**) | 구현됨 | `captureConfig.js` — `TARGET_PITCH_DEG` 등 |
| **표준 자세 예시 이미지** | **예정** | 촬영 화면 진입 **전** 「예시 보기」로 표시 |

### 표준 자세 예시 이미지 (추가 예정)

M자 촬영은 **얼굴 정면(안내)** + **폰 기울기(자동)** + **가이드 프레임(예정)** 으로 일관된 구도를 맞춥니다.  
고개 숙임·정면 등은 얼굴 인식 없이 **표준 자세 참고 사진**으로 보완할 예정입니다.

**추가할 로직 (촬영 전):**

```text
[M자 선택] → Take Photo
  → (예정) 「예시 보기」모달/화면 — 표준 자세 사진 1장 표시
  → [확인] → CameraCaptureScreen (수평 + 가이드 + pitch)
  → 촬영 → 업로드
```

**에셋 (준비 예정):**

- 경로: `frontend/assets/guide-m_line-example.jpg` (또는 `.png`)
- 내용: 정면, 턱 살짝 내림, 이마·헤어라인이 가이드 타원에 들어간 **팀 합의 표준 샘플 1장**
- 용도: pitch·타원 수치 튜닝 기준 + 사용자 촬영 전 참고

> 구현 시 `UploadScreen` 또는 `CameraCaptureScreen` 진입 직전에 예시를 한 번 보여 주고, 「촬영 시작」 후 커스텀 카메라로 넘기는 흐름을 사용합니다.

---

## 의존성 (Dependencies)

프로젝트를 clone한 뒤 각 폴더에서 `npm install` / `pip install -r requirements.txt`로 설치합니다. 버전은 `package.json`·`requirements.txt` 기준입니다.

### 공통 / 인프라

| 항목 | 용도 |
|------|------|
| Node.js 20+ | Backend, Frontend(Expo) |
| Python 3.11+ | AI 서버 (`ai/`) |
| Docker Desktop | MySQL (`backend/docker-compose.yml`) |

### Frontend (`frontend/package.json`)

Expo SDK **54** 기준. M자 촬영·가이드·crop 관련 패키지는 아래와 연결됩니다.

| 패키지 | 버전(대략) | 용도 | 관련 설정·코드 |
|--------|------------|------|----------------|
| `expo` | ~54.0.0 | 앱 런타임 | `app.json` |
| `expo-camera` | ~17.0.10 | M자 커스텀 카메라·프리뷰 | `app.json` → `plugins` (카메라 권한), `CameraCaptureScreen.js` |
| `expo-sensors` | ~15.0.8 | 가속도계 — roll·pitch 촬영 각도 | `useDeviceLevel.js`, `captureConfig.js` |
| `expo-image-manipulator` | ~14.0.8 | 가이드 영역 crop | `cropGuideRegion.js`, `guideLayouts.js` |
| `expo-image-picker` | ~17.0.11 | 갤러리·정수리 시스템 카메라 | `UploadScreen.js` |
| `expo-splash-screen` | ^55.0.21 | 네이티브·인앱 스플래시 | `App.js`, `app.json` → `splash` |
| `react-native-svg` | ^15.14.0 | 가이드 타원 오버레이 | `CaptureGuideOverlay.js` |
| `react-native-chart-kit` | ^6.12.0 | 분석 결과 차트 | `ProgressScreen.js` |

**네이티브 권한 (`frontend/app.json`):**

- `expo-camera` 플러그인 — iOS `NSCameraUsageDescription`, Android `CAMERA`
- 스플래시·아이콘 — `frontend/assets/logo.png`

**웹:** 커스텀 카메라·센서는 **모바일(Expo Go / 빌드 앱)** 위주. `npm run web`에서는 M자 촬영 화면이 제한됩니다.

### Backend (`backend/package.json`)

| 패키지 | 용도 |
|--------|------|
| `express` | REST API |
| `mysql2` | MySQL |
| `multer` / `form-data` | 업로드·AI 서버 전달 |
| `axios` | AI 서버 HTTP 호출 (`AI_SERVER_URL`) |
| `bcrypt`, `jsonwebtoken` | 인증 |
| `dotenv` | `backend/.env` (커밋 제외) |
| `cors` | CORS |

**레거시 (일상 미사용):** `mockAiServer.js` — `npm run start:ai-mock`, 포트 5001

### AI (`ai/requirements.txt`)

| 패키지 | 용도 |
|--------|------|
| `fastapi`, `uvicorn`, `python-multipart` | API 서버·이미지 업로드 |
| `torch`, `torchvision` | EfficientNet 추론 |
| `pillow` | 이미지 로드 |

**모델 파일 (Git LFS/외부 배포 가능):**

- `ai/bestmodel/best_model.pth` — 정수리 (`crown`)
- `ai/bestmodel/best_model_mline.pth` — M자 (`m_line`, 없으면 mock)

### 서비스 간 연결 (환경 변수)

| 변수 | 위치 | 의존 대상 |
|------|------|-----------|
| `DB_*` | `backend/.env` | Docker MySQL |
| `AI_SERVER_URL` | `backend/.env` | `http://localhost:8000` (통합 FastAPI) |
| `EXPO_PUBLIC_API_BASE_URL` | (선택) `frontend` | Backend `http://<PC IP>:3000/api` |

### Docker

| 이미지 | 용도 |
|--------|------|
| `mysql:8.0` | `backend/docker-compose.yml` — DB, `init.sql` / `migrations/` |

---

## 기술 스택·추후 수정 메모

과제 **「컨텍스트 정의」** 문서(허용·금지 스택, 기능 범위)를 기준으로 한 정리입니다. 추후 OpenCV·이력 UI·부가 기능 작업 시 참고합니다.

### 허용 / 금지 스택 (요약)

| 계층 | 허용 | 금지 |
|------|------|------|
| 프론트 | React Native, JavaScript, **React Context만**, 차트 라이브러리 | TypeScript, Redux |
| 백엔드 | Node.js 20, Express.js 4, REST, JSON | NestJS, GraphQL |
| AI | Python 3.11, **PyTorch**, **OpenCV** | TensorFlow, 온디바이스 AI |
| DB | MySQL 8.0 | MongoDB, Firestore |
| 통신 | HTTP, JSON | WebSocket |
| 인증 | JWT | 세션 인증, 소셜 로그인 |
| 배포 | Docker Compose, GitHub (로컬) | AWS/GCP 등 클라우드 |

**전체 규칙:** 계층 역할 분리, REST+JSON만, 명시되지 않은 프레임워크 임의 추가 지양.

**현재 코드에서 문서에 없으나 사용 중인 것 (보고서·README에 한 줄 명시 권장):**

- **Expo** — React Native 모바일 실행·카메라·센서
- **FastAPI + uvicorn** — AI 서버 HTTP API (문서는 Python/PyTorch/OpenCV만 명시)

### Pillow vs OpenCV (AI 전처리)

| | Pillow (`PIL`) | OpenCV (`cv2`) |
|---|----------------|----------------|
| 역할 | 파일 열기, 리사이즈 등 **기본 이미지 I/O** | 밝기·크롭·필터·블러 등 **비전 전처리** |
| **현재** | `ai/api_server.py`에서 업로드 바이트 → `Image.open` → `torchvision` 224×224 | **미구현** (`requirements.txt`에도 없음) |
| **과제 문서** | — | AI 서버 전처리에 OpenCV 사용 명시 |

**추후 OpenCV 도입 시:**

1. `ai/requirements.txt`에 `opencv-python` 추가
2. `api_server.py`에서 디코딩·리사이즈·(예정) 얼굴 블러·품질 검사 등을 `cv2`로 처리
3. PyTorch 입력은 `numpy`/`tensor` 경로로 통일 가능
4. 전처리를 OpenCV 한쪽으로 **완전히 옮긴 뒤**에는 Pillow 의존성·`from PIL import Image` **제거 가능** (중간 단계에서는 둘 다 쓸 수 있음)

```text
[현재]  bytes → Pillow → torchvision transforms → PyTorch
[목표]  bytes → OpenCV → (선택) tensor 정규화 → PyTorch
```

### 이미지 주소: `uri` vs 서버 URL

앱·DB에서 “사진 위치”가 두 종류입니다.

| 종류 | 예시 | 설명 |
|------|------|------|
| **로컬 `uri`** | `file:///...`, `ph://...` | 갤러리·카메라 직후, **폰 안에만** 존재. `UploadScreen` 미리보기, `api.js`의 `fetch(image.uri)` 업로드에 사용 |
| **서버 URL** | `http://<PC IP>:3000/uploads/upload-xxx.jpg` | 업로드 후 `backend/uploads/` + DB `uploads.filename`. 이력·Before/After에서 **과거 사진 재표시**용 |

- DB에는 `filename` 저장 → 정적 경로 `/uploads/<filename>`
- **Progress 화면**은 현재 클래스·확률 위주이며, 이력 항목 **썸네일(URL) 표시는 미구현** (추후 `EXPO_PUBLIC_API_BASE_URL` 또는 API base + `/uploads/` 조합)

### DB·분석 저장 구조 (삭제·실패 시 참고)

```text
uploads (사진 메타 + filename)
  └── analysis_histories (분석 결과)   ← upload 삭제 시 CASCADE로 함께 삭제
```

- **업로드만 성공·AI 실패:** `uploads`·디스크 파일은 있으나 `analysis_histories` 없음 → 이력 API·Progress **비어 보임**
- **디스크 파일만 수동 삭제:** DB·분석 이력은 남고 `/uploads/...` URL은 404
- **AI 서버(:8000) 미실행**이 위 실패의 흔한 원인 → 업로드 전 `http://localhost:8000/health` 확인

### 문서 대비 구현 갭 (추후 작업 체크리스트)

| 항목 | 상태 | 비고 |
|------|------|------|
| OpenCV 전처리 | 미구현 | Pillow만 사용 |
| AI에서 과거 대비 변화 수치 | 미구현 | Before/After는 백엔드·DB 이력 조회 |
| 재촬영 안내 (품질 낮음) | 미구현 | 부가 기능 |
| 얼굴 블러 (프라이버시) | 미구현 | OpenCV 후보 |
| 분석 이력에서 사진 표시 | 미구현 | 서버 URL + `filename` |
| M자 표준 자세 예시 화면 | 예정 | `frontend/assets/guide-m_line-example.jpg` |
| 정수리 촬영 가이드 | 부분 | M자 대비 약함 |

**확장 기능(과제상 지금 안 함):** 소셜 로그인, 리워드, 앱 내 사진 보관함 — 미구현 유지 OK.
