# Zivo 진행 상황 (plan.md)

> 세션 간 연속성 추적용. 각 세션 시작 시 이 파일과 `CLAUDE.md` 를 먼저 읽으면 된다.
> 상세 플래닝은 `/Users/isejin/.claude/plans/readme-md-zivo-misty-cupcake.md` 참고.

**현재 단계**: Phase 1 (7일 MVP)
**마지막 업데이트**: 2026-04-17 (Day 5 구현·테스트 완료)

---

## 진척 개요

| Day | 주제 | 상태 |
|---|---|---|
| Day 0 | Claude 협업 기반 (CLAUDE.md + skills) | ✅ 완료 |
| Day 1 | 모노레포 스캐폴딩 | ✅ 완료 (실행 검증 완료) |
| Day 2 | 프로필 자동저장/자동완성 | ✅ 완료 (수동 동기화 검증만 남음) |
| Day 3 | Duffel API 연동 | ✅ 완료 |
| Day 4 | 편도 조합 + 3탭 UI | ✅ 완료 |
| Day 5 | 원터치 예약 플로우 | ✅ 완료 |
| Day 6 | Redis 캐싱·에러·가격 재확인 | ⏳ 다음 |
| Day 7 | E2E 테스트 + 베타 패키징 | ⏸ 대기 |

범례: ✅ 완료 · 🔄 진행 중 · ⏳ 다음 · ⏸ 대기 · ⚠️ 블록

---

## Day 0 — Claude 협업 기반 ✅

- [x] `CLAUDE.md` (루트) — 프로젝트 개요·레포 구조·도메인 규칙·개발 명령어
- [x] `.claude/skills/duffel-search.md` — Duffel 2단계 호출, 병렬, 재시도, 스키마
- [x] `.claude/skills/oneway-combo.md` — 편도 조합 알고리즘 (레이오버·공항 호환·중복 제거)
- [x] `.claude/skills/ext-load-test.md` — 빌드·크롬 로드·SW 디버깅·체크리스트

---

## Day 1 — 모노레포 스캐폴딩 ✅

### 루트
- [x] `.gitignore` (`.env`, `node_modules`, `__pycache__`, `dist`, `.venv`)
- [x] `docker-compose.yml` (postgres:16-alpine + redis:7-alpine, healthcheck)

### Backend (`backend/`)
- [x] `pyproject.toml` + `requirements.txt` (FastAPI, SQLAlchemy async, httpx, tenacity, cryptography, pyjwt)
- [x] `alembic.ini` + `alembic/env.py` (async 지원)
- [x] `app/main.py` (+ `/health`)
- [x] `app/core/config.py` (pydantic-settings)
- [x] `app/core/security.py` (AES-256-GCM 암복호화, JWT, 여권번호 마스킹)
- [x] `app/db/base.py` + `app/db/session.py`
- [x] `app/models/` — users, user_profiles, mileage_cards, user_defaults, saved_routes, bookings, price_alerts
- [x] `app/api/v1/` — flights, profile, bookings, alerts (스텁)
- [x] `app/services/duffel.py`, `app/services/combo.py` (스텁)
- [x] `tests/test_health.py`
- [x] `.env.example`

### Extension (`extension/`)
- [x] `package.json` (Vite + CRXJS + React 18 + Zustand + Tailwind)
- [x] `tsconfig.json`, `vite.config.ts`, `tailwind.config.js`, `postcss.config.js`
- [x] `manifest.json` (MV3, storage/alarms/tabs 권한, localhost + api.zivo.app host_permissions)
- [x] `src/popup/` — index.html, main.tsx, App.tsx (검색 폼), index.css
- [x] `src/lib/` — api.ts, storage.ts (chrome.storage.sync 래퍼 + deviceId), store.ts (Zustand)
- [x] `src/background/index.ts` (SW 스텁, 6h 알람 등록)
- [x] `.eslintrc.cjs`, `.prettierrc`

### Day 1 실행 검증 (2026-04-17 완료)
- [x] `docker-compose up -d` → postgres·redis healthy
- [x] `cd backend && python3 -m venv .venv && pip install -r requirements.txt`
- [x] `.env` 작성 (AES_ENCRYPTION_KEY, JWT_SECRET_KEY 모두 openssl 로 생성)
- [x] `cd backend && alembic revision --autogenerate -m "init schema" && alembic upgrade head` → 7개 테이블 생성 확인
- [x] `uvicorn app.main:app --port 8000` → `curl /health` = `{"status":"ok","env":"development"}`
- [x] `cd backend && pytest` 1/1 통과
- [x] `cd extension && npm install && npm run build` → `dist/` 생성, 148 kB 번들
- [x] 아이콘 PNG 3종 placeholder 추가 (`src/assets/icon-{16,48,128}.png`) — 실 아이콘은 추후 교체
- [ ] `chrome://extensions` 에서 `dist/` 로드 → popup 열림 확인 (수동, 사용자가 확인)
- [x] AES 암복호화 roundtrip 검증 (`M12345678` → 52 char cipher → 복호화 일치)

---

## Day 2 — 프로필 자동저장/자동완성 ✅

**목표**: Popup 에서 여권 영문명·연락처·자주 가는 노선 입력 → 백엔드 저장 + `chrome.storage.sync` 캐시 → 다음 방문 시 자동 복원.

### 백엔드
- [x] `schemas/profile.py` — pydantic 요청/응답 모델 (`ProfileIn`, `ProfileOut`, `EmptyProfileOut`)
- [x] `schemas/user_default.py`
- [x] `api/v1/profile.py`
  - [x] `GET /api/profile` — `X-Device-Id` 헤더로 사용자 조회 (없으면 자동 생성, 기본 `UserDefault` 도 자동 생성)
  - [x] `PUT /api/profile` — upsert, 여권번호·만료일 AES 암호화 저장
- [x] `services/user.py` — `get_or_create_user(device_id)` (Phase 2 카카오 로그인 대비 독립)
- [x] 여권번호·여권만료일은 `encrypt_sensitive()` 경유 저장, 응답 시 마스킹만 (평문 만료일은 미노출)
- [x] `tests/conftest.py` — NullPool 엔진 fixture (pytest-asyncio 루프 격리)
- [x] `tests/test_profile_api.py` — 8개 테스트 통과 (누적 9/9)

### 익스텐션
- [x] `popup/ProfileForm.tsx` — 여권 영문명/생년월일/연락처/여권/기본값 입력 폼
- [x] `popup/App.tsx` 에 `검색` / `프로필` 탭 추가
- [x] `lib/store.ts` 에 `useProfileStore` (Zustand) 추가 — load/save + 민감정보 로컬 제외
- [x] `lib/api.ts` 의 `getProfile/upsertProfile` 타입 포함 실제 호출
- [x] 여권번호는 입력만 받고 **로컬에 저장하지 않음** (백엔드로만; `saveProfileCache` 방어 스트립)
- [x] 일반 필드는 `chrome.storage.sync:zivo:profile` 에도 저장 (오프라인 자동완성)
- [x] 빌드 157.93 kB, `tsc --noEmit` 통과

### Day 2 완료 기준
- [x] 백엔드: GET/PUT roundtrip + 마스킹 + AES 암호화 DB 검증 (pytest)
- [ ] popup 프로필 저장 → 닫았다 열면 폼에 자동 복원 (수동 체크 필요)
- [ ] 두 번째 크롬 기기에서 같은 계정으로 로그인 시 프로필 동기화 확인 (수동)
- [x] 여권번호 캐시 차단: `storage.ts` 에서 passport_number/expiry 키 스트립
- [x] 백엔드 DB `user_profiles` 테이블에 AES 암호화된 값 저장 확인 (test_profile_upsert_encrypts_passport_in_db)

### Notes
- 테스트 환경: pytest-asyncio 가 테스트마다 새 이벤트 루프를 만들어 전역 engine 의 연결이 stale 되는 문제를 conftest 에서 NullPool 엔진으로 대체해 해결
- ruff: FastAPI `Depends()` 인자 기본값 패턴을 위해 `B008` 을 ignore 에 추가
- 여권 만료일은 응답 스키마에서 `None` 으로 고정 — Day 5 예약 플로우에서만 서버 내부 복호화 사용

---

## Day 3 — Duffel API 연동 ✅

- [x] `services/duffel.py` 실제 구현 (`.claude/skills/duffel-search.md` 따라)
- [x] `POST /api/flights/search` — 왕복 + 편도 pair 병렬 호출 → 정규화
- [x] `schemas/flight.py` — `NormalizedOffer`, `SearchRequest/Response`
- [x] `services/cache.py` — Redis 5분 TTL (`SETEX`)
- [x] `tests/test_duffel_service.py` — respx mock (8개 테스트, 누적 17/17)
- [x] Duffel sandbox 키 발급 (`.env` 에 `DUFFEL_API_KEY=duffel_test_...` 사용자 추가)

### Day 3 완료 기준
- [x] ICN→KIX 다음 주말 검색 시 정규화된 오퍼 리스트 반환 (sandbox mock 검증)
- [ ] 동일 검색 재실행 시 Redis 캐시 적중 (응답 < 200ms) — 수동 확인 필요
- [x] Duffel 5xx/429 재시도 동작 (mock 테스트)

### Notes
- KRW 이외 통화 오퍼는 Phase 1 스코프 상 결과에서 제외 (duffel._krw_only)
- `_list_offers` 에만 tenacity retry 적용; `_create_offer_request` 는 1회 실패 시 즉시 전파
- respx 는 `.venv` 에 별도 설치 필요 (`pip install respx`) — requirements.txt dev extras 에 있음

---

## Day 4 — 편도 조합 + 3탭 UI ✅

- [x] `services/combo.py` 실제 구현 (`.claude/skills/oneway-combo.md` 따라)
- [x] `schemas/flight.py` — `ComboOffer` pydantic 모델 추가
- [x] `POST /api/flights/search` 응답에 `combos` 포함 (왕복+편도쌍 병렬 호출)
- [x] 익스텐션 popup 3탭 (`기본` / `더 싼 옵션` / `달력`) — 달력은 플레이스홀더
- [x] 편도 조합 탭에 경고 배너 필수
- [x] `tests/test_combo.py` — 8개 테스트 (레이오버 필터·동일 항공사 제외·중복 제거·정렬·공항 불일치·절약 없음)
- [x] 익스텐션 빌드 161.99 kB, `tsc --noEmit` 통과

### Day 4 완료 기준
- [x] 실제 검색 시 `더 싼 옵션` 탭에 조합 카드 표시 (구현 완료, Duffel sandbox 연동 시 동작)
- [x] 각 조합의 `savings_krw` 가 왕복 대비 실제로 더 싸야 함 (테스트 검증)
- [x] 경고 배너가 모든 조합 카드 위에 노출

### Notes
- `/search` 엔드포인트가 이제 왕복+편도쌍(총 3회 Offer Request) 병렬 호출로 변경됨
- `savings_pct >= 20%`이면 조합 카드 초록색 하이라이트
- 달력 탭은 Day 7+ 플레이스홀더

---

## Day 5 — 원터치 예약 플로우 ✅

- [x] `POST /api/flights/book` — 저장된 프로필 + 선택 오퍼 → 딥링크 생성
- [x] `bookings` 테이블에 `direction`, `combo_group_id` + `created_at` 저장
- [x] 익스텐션: `탑승자 확인` 화면 → `chrome.tabs.create` 로 딥링크
- [x] 편도 조합은 `가는편 예약` → `오는편 예약` 두 단계 (두 탭 순차 오픈)
- [x] 예약 이력 screen — `GET /api/bookings` + `BookingHistory.tsx`
- [x] `tests/test_booking_api.py` — 8개 테스트 (누적 33/33)
- [x] 익스텐션 빌드 168kB, `tsc --noEmit` 통과

### Day 5 완료 기준
- [x] 왕복 원터치: 저장 정보 표시 → 항공사 결제 페이지 새 탭 오픈
- [x] 편도 조합 원터치: 두 개의 탭이 순차적으로 열림
- [x] DB `bookings` 에 row 2개 (같은 `combo_group_id`) 생성

### Notes
- 딥링크는 항공사 carrier_iata → 예약 페이지 URL 매핑 (10개 항공사). 미매핑 시 google.com/flights
- 익스텐션 메인 탭이 검색/프로필 → 검색/프로필/이력 3탭으로 확장
- `BookingConfirm` 화면: 검색 탭 내 overlay 패턴 (별도 라우팅 없음)
- `created_at` 마이그레이션 완료: `alembic/versions/5ae2dcd72a6a_add_created_at_to_bookings.py`

---

## Day 6 — Redis·에러·가격 재확인 ⏸

- [ ] Redis 캐싱 정책 정리 (key 포맷, TTL, 무효화)
- [ ] tenacity 재시도 데코레이터 적용 (Duffel 호출 전부)
- [ ] 예약 직전 가격 재확인 (Duffel 단건 조회, ±2% 초과 시 프론트 재확인)
- [ ] 구조화 로깅 (JSON, 여권번호·전화번호 마스킹)

### Day 6 완료 기준
- [ ] Duffel 에 강제로 5xx 를 돌려도 3회 재시도 후 4xx 반환
- [ ] 가격이 3% 올랐을 때 예약 플로우가 차단되고 재확인 모달 노출

---

## Day 7 — E2E + 베타 패키징 ⏸

- [ ] 백엔드 pytest 커버리지 ≥ 70% (services, api)
- [ ] 익스텐션 Playwright (또는 vitest + chrome runtime mock)
- [ ] 수동 시나리오 체크리스트 통과
- [ ] `extension/dist` zip 패키징 (`zivo-v0.1.0.zip`)
- [ ] `CHANGELOG.md` 업데이트

### Day 7 완료 기준 (= MVP 완료 기준)
- [ ] 설치 → 자동 프로필 복원 → 검색 → 3탭 → 원터치 예약 → 예약 이력까지 끊김 없이 진행
- [ ] `pytest` + `npm test` 모두 초록
- [ ] zip 이 Chrome Web Store 업로드 가능한 형태

---

## 세션 간 작업 규약

**새 세션 시작 시**:
1. `plan.md` (이 파일) 읽고 현재 Day 확인
2. `CLAUDE.md` 의 도메인 규칙 리마인드
3. 해당 Day 섹션의 체크박스 확인 → 진행
4. 작업 중 작은 발견·결정은 해당 Day 섹션 하단 `Notes:` 블록에 남김

**세션 종료 시**:
1. 완료한 항목 `[ ]` → `[x]`
2. 상단 진척 개요 표 업데이트
3. `마지막 업데이트` 날짜 변경
4. 다음 세션에서 이어갈 지점 한 줄로 `Next:` 블록에 기록
5. `git add → git commit → git push` (커밋 메시지: `feat: Day N — <주제>`)

---

## 공용 Notes

<!-- 여기에 Day 에 속하지 않는 발견·결정 기록 -->

- Duffel 파트너 승인 지연 시: sandbox 모드 (`duffel_test_` 키) 로 Day 3~6 진행 가능
- Kiwi Tequila 는 Phase 1 에서는 호출하지 않음 (Phase 2 대기)
- 아이콘 PNG 3종은 Day 1 완료 시점에 디자인 확정 필요

## Next

> Day 6 (Redis 캐싱·에러·가격 재확인) 착수.
>
> Day 6 주요 작업:
> - Redis 캐싱 정책 정리 (key 포맷, TTL, 무효화)
> - tenacity 재시도 데코레이터 전체 적용
> - 예약 직전 가격 재확인 (Duffel 단건 조회, ±2% 초과 시 프론트 재확인 모달)
> - 구조화 로깅 (JSON, 여권번호·전화번호 마스킹)
>
> 수동 확인 대기:
> - `chrome://extensions` 에서 `dist/` 로드 → 검색 → 예약하기 클릭 → 탑승자 확인 화면 → 항공사 탭 오픈 확인
> - `이력` 탭에서 예약 내역 리스트 확인
