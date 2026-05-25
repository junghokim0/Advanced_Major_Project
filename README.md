# MOJI (Advanced_Major_Project)

두피·탈모 **자가 모니터링** 앱 — 정수리(`crown`)·M자(`m_line`) 촬영·AI 분석·이력·Before/After. **의료 진단 대체 아님.**

<img width="3572" height="5241" alt="시스템 아키텍처" src="https://github.com/user-attachments/assets/04f64c1d-1642-44cc-bddf-a08bf28827d1" />

---

## 구현된 기능 목록

### 앱 (React Native / Expo)

| 기능 | 설명 |
|------|------|
| 로그인·회원가입 | JWT (`LoginScreen`) |
| 4탭 UI | 홈 · 분석(업로드) · 기록 · 설정 |
| 패턴 선택 | 정수리 / M자 (`UploadScreen`) |
| 갤러리·업로드 | jpg·png, `ImageManipulator` 정규화 후 Base64 업로드 |
| M자 가이드 촬영 | 타원 오버레이, 수평·pitch(-10°), 가이드 영역 **crop** |
| 흐림 시 재촬영 안내 | `BlurRetakeGuide` — 다시 촬영 / 갤러리 재선택 |
| 홈 요약 | 최근 분석, 패턴별 단계·팁, **이번 주 미촬영** 배너 |
| 기록 | 패턴별 이력, 썸네일, 클래스 추이 차트 |
| Before/After | 시점 2개 선택, 나란히 비교, **호전·유지·악화** |
| 주변 병원·약국 | GPS·주소 → **네이버 지도 링크** (앱 내 지도 API 없음) |
| 면책·의료 참고 | 홈·업로드·기록·설정 (`MedicalDisclaimerCard`) |
| 설정 | API URL·HTTP/HTTPS 안내, 로그아웃 |

### 백엔드 (Express + MySQL)

| 기능 | 설명 |
|------|------|
| 인증 | JWT, bcrypt |
| 업로드 | JSON Base64 · jpg/png · `.jpeg` 확장자 제외 · 8KB~5MB · 매직바이트 |
| 분석 연동 | `patternType` 저장 후 AI 서버 호출 |
| 이력 API | `GET /api/analysis/history?patternType=` |
| 정적 파일 | `/uploads/<filename>` |
| HTTPS (선택) | `REQUIRE_HTTPS=true` 시 업로드 API만 HTTPS 강제 |

### AI (FastAPI + EfficientNet)

| 기능 | 설명 |
|------|------|
| 통합 서버 | `:8000` — `crown` 3-class, `m_line` 2-class |
| 전처리 | 224 Laplacian **&lt; 80 → 거절(422)** · HSV 명도·채도 보정 · 224 추론 |
| 경계 보정 | 정수리 class2 경계 구간 → class1 보정 (기존 로직) |

---

## 로컬 실행 방법

**터미널 4개**를 각각 띄워 실행합니다. (루트 `npm run dev`·`dev-all.js` 등 **한 번에 실행은 롤백·미사용**)

**사전 준비:** Node 20+, Python 3.11+, Docker Desktop, (실기기) PC·폰 같은 Wi‑Fi

**1) MySQL**

```bash
cd backend
docker compose up -d
```

**2) AI** (`:8000`)

```bash
cd ai
python -m venv .venv
.\.venv\Scripts\activate
python -m pip install -r requirements.txt
python api_server.py
```

**3) Backend** (`:3000`)

```bash
cd backend
npm install
npm start
```

**4) Frontend** (Expo)

```bash
cd frontend
npm install
npm start
```

**확인**

| 서비스 | URL |
|--------|-----|
| AI | http://localhost:8000/health |
| Backend | http://localhost:3000 |
| Frontend | Expo QR |

**`backend/.env` 예시**

```bash
DB_HOST=localhost
DB_PORT=3307
DB_USER=app_user
DB_PASSWORD=app_password
DB_NAME=app_db
AI_SERVER_URL=http://localhost:8000
```

> Windows 로컬 MySQL이 3306을 쓰면 Docker는 **3307→3306** 매핑. 포트 변경 시 `docker-compose.yml`과 `DB_PORT`를 함께 맞출 것.

---

## 아키텍처

```text
[앱] patternType (crown | m_line)
  → Backend :3000 — 저장·JWT·이력
  → FastAPI :8000 — 흐림 검사 → HSV 보정 → EfficientNet
```

- DB: `uploads.pattern_type` + `analysis_histories` (패턴별 이력 조회)
- M자: 앱에서 **crop 후** 업로드 → AI는 동일 전처리
- 갤러리: crop 없음, 동일 업로드·AI 파이프

---

## AI 패턴

| patternType | 모델 | 비고 |
|-------------|------|------|
| `crown` | `ai/bestmodel/best_model.pth` | 3-class |
| `m_line` | `ai/forhead/best_model_forehead.pth` | 2-class (1→경미, 3→진행) |

전처리 기준: `ai/preprocess_config.py` (HSV 권장 범위, `LAPLACIAN_VAR_MIN=80`)

---

## DB 마이그레이션 (기존 DB 업데이트 시)

**PowerShell**

```powershell
cd backend
Get-Content -Raw migrations\001_add_pattern_type.sql | docker compose exec -T mysql mysql -uapp_user -papp_password app_db
```

**bash**

```bash
cd backend
docker compose exec -T mysql mysql -uapp_user -papp_password app_db < migrations/001_add_pattern_type.sql
```

---

## 미구현 · 보류

| 항목 | 상태 |
|------|------|
| 로컬 푸시 알림 | 제거 (`expo-notifications` 미사용) |
| M자 예시 JPG 모달 | 미구현 (실시간 가이드로 대체) |
| 정수리 전용 촬영 가이드 | 약함 (갤러리·기본 카메라) |
| 얼굴 블러·가이드 강화 | 팀원 진행 |
| OpenCV 명도·채도 **거절** 게이트 | 보정만 · 어두움/밝음 픽셀 비율 임계 미합의 |
| 앱 내 지도 SDK | 네이버 **링크**만 |
| 포인트·리텐션 | 미구현 |
| OpenCV 흐림(Laplacian) 극단 튜닝 | 기본 80 · 실사 추가 튜닝 가능 |

**레거시:** `backend/mockAiServer.js` (:5001) — 사용 안 함

---

## 요구사항 문서 대비 (요약)

상세 FR·기획보고서 대조표는 팀 내부 문서 기준. 코드 기준 핵심만:

- **구현:** 촬영·업로드·AI·이력·Before/After·면책·업로드 검수·HSV 보정·흐림 재촬영 안내·지도 링크
- **부분:** 정수리 촬영 표준화, 클래스 차트(밀도·굵기 수치 없음), HTTPS 운영 설정
- **범위 외:** 다부위 촬영, 모공·굵기 2단 UI, 포인트

---

## 트러블슈팅

| 증상 | 조치 |
|------|------|
| AI `EADDRINUSE :8000` | `netstat -ano \| findstr :8000` → `taskkill /PID <pid> /F` |
| 업로드 타임아웃 | AI·백엔드 실행, 같은 Wi‑Fi, Expo `hostUri` |
| 흐림인데 통과 | AI 서버 재시작 (`opencv`·흐림 검사 반영 여부) |
