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
| M자 | `m_line` | `forhead/best_model_forehead.pth` **2-class** 추론 (1_level→경미, 3_level→진행), 없으면 mock |

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

M자 모델은 `ai/forhead/best_model_forehead.pth`(EfficientNet-B0, 2-class)를 사용합니다. 경로 변경 시 `AI_MLINE_MODEL_PATH` 환경 변수로 지정할 수 있습니다.

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

### 앱 하단 탭 (B안)

| 탭 | 화면 | 역할 |
|----|------|------|
| 홈 | `HomeScreen` | 최근 분석 요약, 새 분석·기록 이동 |
| 분석 | `UploadScreen` | 패턴 선택·촬영·업로드 |
| 기록 | `ProgressScreen` | 이력·차트·Before/After |
| 설정 | `ProfileScreen` | 계정·로그아웃 |

네비게이션: **React Navigation** (bottom-tabs + native-stack). M자 커스텀 카메라는 탭 밖 전체 화면 모달.

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
       m_line → forhead/best_model_forehead.pth (2-class) 또는 mock
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
| **표준 자세 안내 (M자)** | **구현됨** | 별도 예시 사진 대신 **실시간 가이드**로 대체 (아래 참고) |

### 표준 자세 안내 — 가이드라인 방식 (M자, 구현됨)

초기 README에 적어 두었던 「촬영 전 예시 사진 1장」(`guide-m_line-example.jpg`)은 **구현하지 않음**.  
대신 **촬영 화면 안**에서 표준 구도를 맞추도록 했으며, MOJI 범위에서는 이를 **표준 자세 안내 완료**로 봅니다.

| 수단 | 구현 |
|------|------|
| 타원 프레임 + 어둡게 처리 | `CaptureGuideOverlay`, `M_LINE_GUIDE` |
| 문구 안내 | `M_LINE_GUIDE_HINT` — 정면·턱·이마·M자 라인 |
| 폰 pitch (이마 쪽 약 -10°) | `useDeviceLevel`, `LevelIndicator`, 하단 안내 |
| 수평(roll) | 수평일 때만 촬영 버튼 활성 |
| 업로드 범위 통일 | 가이드와 동일 비율 **crop** (`cropGuideRegion.js`) |

```text
[M자 선택] → Take Photo → CameraCaptureScreen
  → 타원 가이드 + pitch/수평 안내 → 촬영 → 가이드 영역 crop → 업로드
```

**정수리(`crown`)** 는 동일 수준의 타원·예시 가이드는 없음 (갤러리/기본 카메라).  
**발표/문서**에서 「참고 사진 1장」을 요구하면 `guide-m_line-example.jpg` 모달만 **선택 추가**하면 됨.

---

## 엣지 포인트 · 추가 구현

타겟 사용자(자가 모니터링·주기적 기록·Before/After)를 위한 차별 기능입니다.

| 기능 | 상태 | 설명 | 관련 코드 |
|------|------|------|-----------|
| **Before/After 사진 나란히** | **구현됨** | 기록 탭: **이전/기준 시점 선택** + 이미지·호전·유지·악화 | `ProgressScreen.js`, `utils/compareChange.js` |
| **이력 썸네일** | **구현됨** | 최근 분석 이력에 `/uploads/` 썸네일 표시 | `getUploadImageUrl()` |
| **이번 주 촬영 배너** | **구현됨** | 홈: 이번 주(월요일 기준) 미촬영 시 안내 + 분석 탭 이동 | `HomeScreen.js`, `utils/weeklyCapture.js` |
| 촬영 품질·재촬영 안내 | **팀원 진행 중** | 품질 낮음 시 재촬영 유도 | — |
| M자 가이드·얼굴 인식/블러 | **팀원 진행 중** | 가이드라인 강화, 얼굴 영역 처리 | `CameraCaptureScreen` 등 |
| 표준 자세 안내 (M자) | **구현** | 실시간 타원·문구·pitch 가이드 (`CaptureGuideOverlay`) |
| OpenCV 전처리 (명도·채도·흐림) | **보류** | 팀원 추론용 파라미터 수령 후 `api_server.py` 앞단 | 아래 리마인드 |

### 이미지 URL

- 백엔드 정적 경로: `http://<PC IP>:3000/uploads/<filename>`
- 실기기: PC와 같은 Wi‑Fi, `EXPO_PUBLIC_API_BASE_URL` 또는 Expo `hostUri` 자동 사용

### 보안 · 전송 · 업로드 검수

| 항목 | 상태 | 설명 |
|------|------|------|
| **면책·의료 참고** | **구현** | 홈·업로드(짧은 문구), 기록(결과 시 힌트), 설정(전체 문구) — `MedicalDisclaimerCard`, `constants/medicalDisclaimer.js` |
| **업로드 검수** | **구현** | JPEG/PNG 매직바이트, 8KB~5MB, MIME 불일치 거절 — `backend/utils/uploadImageValidation.js` |
| **HTTPS (운영)** | **선택** | 백엔드 `REQUIRE_HTTPS=true` 시 업로드 API만 HTTPS 강제 (`uploadSecurityMiddleware.js`, `trust proxy`) |
| **앱↔API HTTPS** | **권장** | 운영: `EXPO_PUBLIC_API_BASE_URL=https://...` · 개발 HTTP 시 설정 탭에 안내 |
| **디스크 암호화** | **범위 밖** | 전면 E2E·저장 암호화 미적용 · JWT·bcrypt·HTTPS 전송으로 운영 권장 |

로컬 개발은 HTTP 그대로 사용 가능합니다. 리버스 프록시(Nginx 등) 뒤에서 TLS를 종료할 때 `REQUIRE_HTTPS=true`를 설정하세요.

### 주변 병원·약국 (네이버 지도 링크)

홈 하단 **주변 병원 · 약국** 카드 (`NearbyPlacesPlaceholder.js`):

| 방식 | 동작 |
|------|------|
| **GPS** | `expo-location` → `https://map.naver.com/v5/search/병원?c=경도,위도,...` (좌표+검색 동시) |
| **주소 입력** | `https://map.naver.com/v5/search/{검색어}` (행안부·지오코딩 API 없음) |

네이버 지도 앱이 없으면 웹 지도로 열립니다. **지도 API 키·과금 없음.**

### OpenCV와 전처리 (자주 헷갈리는 점)

**전처리 자체는 이미 동작합니다.** `ai/api_server.py`에서 Pillow RGB → `torchvision` 224 리사이즈·ImageNet 정규화 → 모델. M자는 앱에서 가이드 **crop** 추가.

**OpenCV 명도·채도·흐림 게이트는 보류 중** (추후 팀원이 추론용 수치 전달 후 진행).

| 구분 | 현재 | 보류 항목 (예정 설계) |
|------|------|----------------------|
| 패키지 | `pillow`, `torch`, `torchvision` | `opencv-python` + `ai/preprocess_config` 등 |
| 추론 파이프 | Resize 224 · Normalize | **앞단**: 조명 보정 · **흐림만** 재촬영/재선택 |
| 학습 참고 수치 | `ai/EfficientNet_B0.ipynb`, `ai/forhead/EfficientNet_B0.ipynb`의 `ColorJitter(brightness=0.2, contrast=0.2, saturation=0.1)` — **학습용**, 추론 고정값 파일 없음 | 팀원과 CLAHE/임계값 합의 필요 |

`pip install opencv-python`만으로는 동작하지 않음. **설치 + `api_server.py` 호출 + 팀 합의 파라미터**가 있어야 합니다.

### 주간 촬영 판정

- **이번 주 미촬영:** 마지막 분석일이 **이번 주 월요일 00:00 이전**이면 홈 배너 표시 (`utils/weeklyCapture.js`)
- **푸시·로컬 알림:** 미구현 (제거됨 · `expo-notifications` 미사용)

---

## 요구사항 대비 구현 현황

`요구사항분석서(전심프)`, `기획보고서(전심프)` 기준으로 **현재 MOJI 코드베이스**와 대조한 요약입니다. (의료 진단 대체 아님·참고용 서비스 범위는 문서와 동일)

### 기능 요구사항 (FR)

| ID | 요구 요약 | 상태 | 비고 |
|----|-----------|------|------|
| FR-001 | 모발 이미지 촬영 | **부분** | 정수리: 갤러리/기본 카메라 · M자: 커스텀 카메라 |
| FR-002 | 이미지 업로드 | **구현** | JWT + multer/JSON base64 |
| FR-003 | 입력 이미지 검증 | **부분** | JPEG/PNG·용량·매직바이트 검수 · 초점/식별 불가 판별 없음 |
| FR-004 | 이미지 전처리 | **부분** | Pillow+torchvision 동작 · OpenCV(명도·채도·흐림) **보류** |
| FR-005~008 | AI 분석·확률·결과 표시 | **구현** | crown 3-class · m_line 2-class |
| FR-009 | 재촬영·품질 안내 | **미구현/보류** | 흐림 게이트=OpenCV 보류와 연동 예정 · 팀원 UX 병행 |
| FR-010, FR-014 | 오류·재시도 안내 | **부분** | 업로드/분석 실패 메시지 |
| FR-011~013, FR-012 | 결과 조회·주의·없음 안내 | **구현** | 기록 탭·mock 안내 · 홈/업로드/기록/설정 **면책·의료 참고 카드** |
| FR-015 | 이미지 품질·분석 신뢰도 평가 | **부분** | confidence만 · 촬영 품질(흐림) 점수는 OpenCV 보류 후 |
| FR-016~017 | 분석 이력 저장·조회 | **구현** | MySQL + 패턴별 API |
| FR-018 | 비교 대상 **사용자 선택** | **구현** | 기록 탭 이전/기준 시점 드롭다운 |
| FR-019~020 | Before/After 분석·이미지 | **구현** | `ProgressScreen` 나란히 표시 |
| FR-021 | 변화량 시각화 | **부분** | 클래스 추이 LineChart · 밀도/굵기 수치 없음 |
| FR-022 | 호전/유지/악화 해석 안내 | **구현** | 클래스 diff → 호전·유지·악화 (`compareChange.js`) |
| FR-023~024 | 비교 가능 여부·불가 안내 | **부분** | 이력 2건 미만 숨김 · 시점 역전 시 경고 문구 |

### 기획보고서·사용자 요구 항목

| 항목 | 상태 | 비고 |
|------|------|------|
| 조기 발견·골든타임 (객관 수치) | **부분** | 단계·확률 UI · 병원 필터링 도구 수준 UX는 미흡 |
| Before/After·시계열 동기 | **부분** | 이미지·클래스 차트·시점 선택·호전/유지/악화 · PDF 수준 밀도/굵기 추이 없음 |
| 표준화 촬영 (자이로·가이드) | **부분** | M자: 수평·pitch·타원·crop · 정수리 가이드 약함 |
| 표준 자세 안내 (M자) | **구현** | 가이드라인 방식 · 예시 JPG 모달은 **선택(미구현)** |
| 프라이버시 (얼굴 블러) | **미구현/진행** | 기획: 안면 흐림 · 팀원 진행 |
| 다부위 촬영 (PDF: 전면·측면·뒷머리 등) | **범위 외/미구현** | **MOJI 범위**: `crown`+`m_line` 2패턴 **구현** |
| 병원·약국 **지도 탐색** | **부분** | GPS→좌표·주소→`map.naver.com` **링크 연동** (`naverMapLinks.js`, `expo-location`) · MOJI 내 지도 API 없음 |
| OpenCV 전처리 (명도·채도·흐림) | **보류** | 팀원 파라미터 후 `api_server.py` 앞단만 |
| HTTPS·업로드 검수 | **부분 구현** | 검수·선택적 HTTPS · 저장소 전면 암호화는 범위 밖 |
| 상세 결과 (PDF: 모공·굵기 2단 UI) | **범위 외/미구현** | **MOJI 범위**: 단계 라벨·클래스 확률·신뢰도 **구현** |
| 포인트·장기 리텐션 | **미구현** | 기획보고서 유지성 |
### 비기능 (요약)

| 항목 | 상태 |
|------|------|
| 분석 30초~1분 목표 | 환경·GPU 의존 (별도 측정 필요) |
| 동시 요청·자원 관리 | 단순 Express (대규모 미검증) |
| JWT·사용자별 이력 | **구현** |
| 모바일 사용성 | **구현** (4탭 B안) |

---

## 미구현 · 보류 리마인드 (팀 공유용)

최종 업데이트 기준 체크리스트. **구현 완료** 항목은 위 표 참고.

### 보류 (팀원 입력·합의 후 진행)

| # | 항목 | 담당/메모 | 필요한 것 |
|---|------|-----------|-----------|
| 1 | **OpenCV 앞단 전처리** | AI | 추론용 명도·채도 보정값, Laplacian(흐림) 임계값 · 학습 노트북 `ColorJitter`와 정합 |
| 2 | **재촬영/재선택 (흐림만)** | AI+프론트 | #1과 동일 요청 · 극단적 흐림만 거절, DB 흐름은 기존 유지 |
### 미구현 (예정)

| # | 항목 | 메모 |
|---|------|------|
| ~~4~~ | ~~표준 자세 예시 화면~~ | **완료(대체)** — M자 실시간 가이드·pitch·crop (`#표준 자세 안내` 참고) |
| 5 | 촬영 품질·재촬영 UX (팀원) | #2 OpenCV와 역할 분담 정리 |
| 6 | M자 얼굴 블러/가이드 강화 | 팀원 |
| 7 | 정수리 촬영 가이드 강화 | 선택 |
| ~~8~~ | ~~면책·의료 참고 문구 강화~~ | **완료** — `MedicalDisclaimerCard` |
| ~~9~~ | ~~HTTPS·업로드 검수~~ | **부분 완료** — 검수·`REQUIRE_HTTPS` · 디스크 암호화는 범위 밖 |
| 10 | 병원·약국 **앱 내 지도** | **링크 연동 완료** · SDK·장소 검색 API는 범위 밖 |
| 11 | 포인트·리텐션 | 기획보고서 |

### MOJI 프로젝트 범위에서 완료로 본 항목

- 정수리·M자 촬영/업로드/AI 분석·이력·Before/After(시점 선택, 호전·유지·악화)
- M자 **표준 자세 안내**(타원·문구·pitch·crop), 클래스별 확률·신뢰도 UI, 주간 배너, 4탭 B안
- **면책·의료 참고**, 업로드 **JPEG/PNG 검수**, 홈 **GPS·주소 → 네이버 지도 링크**

### 팀원에게 받을 OpenCV 관련 값 (예시)

- 조명 보정: CLAHE `clipLimit` / tile, 또는 고정 감마·채도 스케일
- 흐림: Laplacian 분산 **최소 임계값** (실사 `ai/forhead/realtestdata`, `ai/실제 사진test`로 튜닝)
- 학습 참고만 있음: `brightness=0.2, contrast=0.2, saturation=0.1` (train augmentation, **추론 고정값 아님**)

---
