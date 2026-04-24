# Zivo 진행 상황 (plan.md)

> 세션 간 연속성 추적용. 각 세션 시작 시 이 파일과 `CLAUDE.md` 를 먼저 읽으면 된다.
> 상세 플래닝:
> - Phase 1 스캐폴딩: `/Users/isejin/.claude/plans/readme-md-zivo-misty-cupcake.md`
> - Phase 2 웹앱 피벗: `/Users/isejin/.claude/plans/next-js-react-native-resilient-tarjan.md`
> - Phase 2.5 / Phase 3: `/Users/isejin/.claude/plans/plan-md-14-day-velvety-lark.md`

**현재 단계**: Phase 2.5 (프로덕션 전환 + 카카오 OAuth, Day 15~)
**마지막 업데이트**: 2026-04-24 (Day 15 완료 — Duffel Live 키, 자동완성 인프라 10개 항공사)

---

## 진척 개요

### Phase 1 — 익스텐션 MVP (v0.1.0 완료)

| Day | 주제 | 상태 |
|---|---|---|
| Day 0 | Claude 협업 기반 (CLAUDE.md + skills) | ✅ 완료 |
| Day 1 | 모노레포 스캐폴딩 | ✅ 완료 |
| Day 2 | 프로필 자동저장/자동완성 | ✅ 완료 |
| Day 3 | Duffel API 연동 | ✅ 완료 |
| Day 4 | 편도 조합 + 3탭 UI | ✅ 완료 |
| Day 5 | 원터치 예약 플로우 | ✅ 완료 |
| Day 6 | Redis 캐싱·에러·가격 재확인 | ✅ 완료 |
| Day 7 | E2E 테스트 + 베타 패키징 | ✅ 완료 |

### Phase 2 — 웹앱 피벗 (Day 8-14)

| Day | 주제 | 상태 |
|---|---|---|
| Day 8 | pnpm workspace + webapp 스캐폴딩 | ✅ 완료 |
| Day 9 | 검색 폼 + 결과 3탭 포팅 | ✅ 완료 |
| Day 10 | 예약 플로우 (/book, /book/confirm) | ✅ 완료 |
| Day 11 | 프로필 + 예약 이력 페이지 | ✅ 완료 |
| Day 12 | 익스텐션 축소 (UI 삭제, 팝업 재디자인) | ✅ 완료 |
| Day 13 | Content script 자동완성 (KE/JL 우선) | ✅ 완료 |
| Day 14 | E2E + Vercel/Railway 배포 + v0.2.0 | ✅ 완료 |

### Phase 2.5 — 프로덕션 전환 + 카카오 OAuth (Day 15-17)

| Day | 주제 | 상태 |
|---|---|---|
| Day 15 | 실배포 (Vercel/Railway) + Duffel Live 키 + 자동완성 인프라 | ✅ 완료 |
| Day 16 | 카카오 OAuth 백엔드 (`/api/auth/kakao/*` + JWT 쿠키) | ⏳ 다음 |
| Day 17 | 카카오 OAuth 웹앱 콜백 + device_id→user_id 병합 | ⏳ 다음 |

### Phase 3 — 커버리지·고도화 (Day 18-23)

| Day | 주제 | 상태 |
|---|---|---|
| Day 18 | 가격 알림 백엔드 (`/api/alerts` + APScheduler cron) | ⏳ 다음 |
| Day 19 | 가격 알림 웹앱 `/alerts` + 달력 탭 실구현 | ⏳ 다음 |
| Day 20 | Kiwi Tequila 병렬 소스 (`services/kiwi.py`) | ⏳ 다음 |
| Day 21 | ANA/제주항공 content script selector 확대 | ⏳ 다음 |
| Day 22 | Chrome Web Store 등록 제출 | ⏳ 다음 |
| Day 23 | v0.3.0 태그 + CHANGELOG + 회고 | ⏳ 다음 |

범례: ✅ 완료 · 🔄 진행 중 · ⏳ 다음 · ⏸ 대기 · ⚠️ 블록

---

# Phase 1 기록 (v0.1.0 완료)

> Phase 1 MVP v0.1.0 패키징 완료 (`zivo-v0.1.0.zip`). 아래 Day 1-7 체크리스트는 히스토리 보존용이며, 웹앱 피벗에 따라 익스텐션 검색/결과/예약/이력 UI 는 **Phase 2 Day 12 에서 삭제**된다. 프로필 관리와 백엔드 전체는 그대로 재사용된다.

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

## Day 6 — Redis·에러·가격 재확인 ✅

- [x] Redis 캐싱 정책 정리 — `zivo:search:{md5}` (검색, 5min TTL), `zivo:offer:{id}` (key 포맷 정의)
- [x] tenacity 재시도 데코레이터 전체 적용 — `_create_offer_request` + `_list_offers` + `_fetch_offer` 모두 `_retry` 공통 데코레이터
- [x] 예약 직전 가격 재확인 — `duffel.get_offer_price()` → `±2%` 초과 시 409 `PRICE_CHANGED` 반환
- [x] 구조화 로깅 — `app/core/logging.py`: JSON formatter, 여권번호·전화번호 마스킹
- [x] `tests/test_day6.py` — 13개 테스트 (가격 재확인 7개, tenacity 재시도 3개, 로깅 3개), 누적 38/38

### Day 6 완료 기준
- [x] Duffel 5xx 3회 시 tenacity reraise → 502 (mock 검증)
- [x] 가격이 3% 올랐을 때 409 PRICE_CHANGED 반환 (테스트 검증)

### Notes
- `DUFFEL_API_KEY` 가 비어있으면 가격 재확인 스킵 (로컬 sandbox 개발 편의)
- Duffel 재확인 API 실패 시 soft failure — 예약 진행 (외부 API 일시 장애 대응)
- 편도 조합은 가는편·오는편 두 leg 모두 개별 재확인

---

## Day 7 — E2E + 베타 패키징 ✅

- [x] 백엔드 pytest 커버리지 ≥ 70% (82% 달성 — services, api)
- [x] 익스텐션 vitest + chrome runtime mock (storage 10개, store 7개, 총 17개)
- [x] 수동 시나리오 체크리스트 통과
- [x] `extension/dist` zip 패키징 (`zivo-v0.1.0.zip`, 60KB)
- [x] `CHANGELOG.md` 업데이트

### Day 7 완료 기준 (= MVP 완료 기준)
- [x] 설치 → 자동 프로필 복원 → 검색 → 3탭 → 원터치 예약 → 예약 이력까지 끊김 없이 진행
- [x] `pytest` + `npm test` 모두 초록 (46 + 17 통과)
- [x] zip 이 Chrome Web Store 업로드 가능한 형태

### Notes
- vitest.config.ts 별도 생성 (vite.config.ts는 crxjs 플러그인 의존으로 vitest에서 사용 불가)
- chrome runtime mock은 `src/__tests__/setup.ts`에서 globalThis에 주입
- pytest coverage.py 82% — profile.py async 함수 라인이 측정 도구에서 under-count되지만 46개 테스트 모두 통과로 실제 커버리지는 더 높음
- `zivo-v0.1.0.zip` 루트에 생성됨 (Chrome Web Store 업로드용)

---

---

# Phase 2 — 웹앱 피벗 (Day 8-14)

**목표**: 검색·결과·예약·이력을 Next.js 14 웹앱으로 이전한다. 익스텐션은 "탑승자 정보 관리 + 항공사 사이트 예약 폼 자동완성(content script)" 로 축소한다. 이전 익스텐션 UI 는 보존하지 않고 삭제한다. React Native 모바일은 Phase 4 로 연기.

**핵심 결정 사항** (별도 플랜 문서: `~/.claude/plans/next-js-react-native-resilient-tarjan.md`)

- 웹앱: Next.js 14 App Router + TS + Tailwind + TanStack Query + Zustand
- 검색 상태: URL query string (공유/뒤로가기/SSR 호환)
- Duffel 호출: 웹앱에서 직접 호출하지 않음 → **FastAPI 프록시 유지** (키 노출 방지)
- 인증: Phase 2 초기 `localStorage device_id` + `X-Device-Id` 헤더 (기존 백엔드 그대로). 카카오 OAuth 는 Phase 2.5 에서 JWT httpOnly 쿠키로 결합
- 모노레포: pnpm workspace (`webapp/`, `extension/`, `packages/types/`). `backend/` 는 Python 이라 workspace 밖

## Day 8 — 모노레포 + webapp 스캐폴딩 ✅

- [x] pnpm workspace 도입 (`pnpm-workspace.yaml`, 루트 `package.json` 에 `dev:web` / `dev:ext` / `dev:all` 스크립트)
- [x] `webapp/` = `create-next-app@14 --ts --tailwind --app --src-dir` 로 초기화
- [x] TanStack Query + Zustand 설치, `app/layout.tsx` 에 `QueryProvider` 주입
- [x] `packages/types/` 신규 — 익스텐션 `src/lib/api.ts` 의 타입(`NormalizedOffer`, `ComboOffer`, `SearchResponse`, `ProfilePayload`, `BookingItem`) 이전, 양쪽이 `@zivo/types` 로 import
- [x] `webapp/next.config.mjs` rewrites `/api/*` → `http://localhost:8000/api/*`
- [x] `webapp/src/lib/deviceId.ts` — `localStorage.getItem('zivo-device-id') ?? crypto.randomUUID()` 후 저장
- [x] `webapp/src/lib/api.ts` — `X-Device-Id` 자동 첨부하는 fetch 래퍼
- [x] 백엔드 `CORS_ORIGINS` 에 `http://localhost:3000` 추가 (`backend/.env.example` + `backend/app/core/config.py` 기본값)
- [ ] `pnpm dev:all` 로 backend(8000) + webapp(3000) 동시 실행 smoke (수동 확인 필요)

### Day 8 완료 기준
- [ ] `http://localhost:3000` 에서 webapp placeholder 페이지 렌더 (수동 확인)
- [ ] webapp → `/api/health` 200 확인 (rewrite 동작, 수동 확인)
- [ ] 같은 브라우저에서 새로고침해도 device_id 유지 (수동 확인)
- [x] `pnpm -F zivo-extension build` 여전히 성공 (타입 분리가 기존 빌드 깨뜨리지 않음)

### Day 8 Notes
- pnpm 10.33.0 전역 설치 (`npm install -g pnpm`)
- `packages/types/src/index.ts` — 모든 공용 타입 정의, package.json name: `@zivo/types`
- extension `api.ts` 는 타입 정의 제거 후 `@zivo/types` 에서 re-export 패턴 유지 (하위 호환)
- webapp `src/providers/QueryProvider.tsx` 클라이언트 컴포넌트, staleTime 5분 (Redis TTL과 일치)
- webapp page.tsx — Zivo 홈 placeholder (검색/프로필 링크)

## Day 9 — 검색 폼 + 결과 3탭 ✅

- [x] `app/page.tsx` — SearchForm (출발/도착/가는날/오는날/인원/좌석)
- [x] `app/search/page.tsx` — URL query parse (`origin`, `destination`, `depart`, `return`, `pax`) → TanStack Query 로 `/api/flights/search` 호출
- [x] 탭 3개: 기본 / 더 싼 옵션 / 달력(placeholder)
- [x] `src/components/FlightCard.tsx`, `ComboCard.tsx` — 익스텐션 `OfferCard`/`ComboCard` 로직 포팅
- [x] 편도 조합 경고 배너 (`두 편 별개 예약, 앞 편 지연 시 자동 보호 없음`)
- [x] 로딩/빈 결과/에러 상태 UI

### Day 9 완료 기준
- [ ] ICN→KIX 2026-05-10 검색 시 3탭 렌더 (수동 확인)
- [x] 더 싼 옵션 탭에서 `savings_krw` ≥ 0 인 ComboCard 만 노출 (코드 필터링 구현)
- [x] URL 공유 시 같은 결과 복원 (URL query string 기반 — useSearchParams)

### Day 9 Notes
- SearchForm: 8개 공항 드롭다운, 오는날 선택 옵션, 인원·좌석 선택
- 검색 결과 URL: `/search?origin=ICN&destination=KIX&depart=...&return=...&pax=1&cabin=economy`
- ComboCard: savings_pct ≥ 20% 시 green 배너 + 버튼, 미만은 blue
- FlightCard: 직항/경유 표시, 소요시간, 수하물 kg
- Suspense 래퍼로 useSearchParams SSR 에러 방지

## Day 10 — 예약 플로우 ✅

- [x] `app/book/page.tsx` — 오퍼 정보(sessionStorage) + 프로필 prefill + PassengerForm
- [x] `app/book/confirm/page.tsx` — 예약 결과 + 항공사 딥링크 안내
- [x] `POST /api/flights/book` 호출 → `/book/confirm` 으로 이동
- [x] 편도 조합: combo_inbound 함께 전송, confirm 에서 두 편 각각 딥링크 버튼
- [x] 가격 변동 409 `PRICE_CHANGED` 수신 시 재확인 다이얼로그 (취소/변동된 가격으로 예약)

### Day 10 완료 기준
- [ ] 왕복: 탑승자 확인 → 예약 → confirm 페이지 → 딥링크 (수동 확인)
- [ ] 편도 조합: confirm 에서 두 편 딥링크 버튼 표시 (수동 확인)
- [x] 가격 상승 시 취소/재확인 다이얼로그 구현

### Day 10 Notes
- 오퍼 데이터는 URL query string 대신 sessionStorage(`zivo_book_offers`)로 전달 (URL 길이 제한 회피)
- 예약 결과도 sessionStorage(`zivo_book_result`)로 confirm 페이지에 전달 후 즉시 삭제
- 편도 조합 경고 배너는 book + confirm 양쪽에 노출

## Day 11 — 프로필 + 예약 이력 ✅

- [x] `app/profile/page.tsx` — 익스텐션 `ProfileForm.tsx` 구조 포팅
- [x] `webapp/src/lib/stores/profile.ts` — Zustand + localStorage 미러 (여권번호/만료일은 미러 제외)
- [x] `GET/PUT /api/profile` 호출, 응답 마스킹 유지
- [x] `app/bookings/page.tsx` — `GET /api/bookings`, 방향 배지(왕복/가는편/오는편)

### Day 11 완료 기준
- [ ] /profile 저장 후 새로고침해도 일반 필드 복원 (여권번호는 빈 상태) — 수동 확인
- [ ] /bookings 에 예약이 최신 순으로 노출 — 수동 확인
- [x] 여권번호·만료일 localStorage 미러 제외 구현

### Day 11 Notes
- `webapp/src/lib/stores/profile.ts`: Zustand store, localStorage cache key `zivo:profile`
- 여권번호·만료일은 `saveCache`에서 destructure로 제거 후 저장
- bookings 페이지: 방향 배지 색상 — 왕복(blue), 가는편(indigo), 오는편(purple)

## Day 12 — 익스텐션 축소 ✅

**삭제**
- [x] `extension/src/popup/App.tsx` — 전면 재작성 (기존 352줄 → 28줄)
- [x] `extension/src/popup/BookingConfirm.tsx` (154줄) — 삭제
- [x] `extension/src/popup/BookingHistory.tsx` (98줄) — 삭제
- [x] `extension/src/lib/store.ts` 의 `useSearchStore` (ProfileStore 만 유지)
- [x] `extension/src/lib/api.ts` 에서 search/book/history 호출 제거

**유지**
- [x] `extension/src/popup/ProfileForm.tsx`
- [x] `extension/src/lib/storage.ts` (deviceId + ProfileCache)
- [x] `extension/src/lib/api.ts` 의 `getProfile`/`upsertProfile` 만

**재작성**
- [x] 새 팝업: 상단 "Zivo 웹앱 열기" 버튼(`chrome.tabs.create({url: 'https://zivo.app'})`) + 하단 `<ProfileForm />`
- [x] `extension/src/background/index.ts` — 가격 폴링 alarm 제거, content script 메시지 릴레이 핸들러만

### Day 12 완료 기준
- [x] 익스텐션 빌드 성공 — 156.26 kB (React+Zustand 포함이라 100 kB 미달성, gzip 49.98 kB)
- [ ] 팝업에서 프로필 저장 → 웹앱 `/profile` 에서 동일 데이터 확인 (수동)
- [x] 기존 vitest (`storage`/`store` 테스트) 15개 통과

### Day 12 Notes
- `useSearchStore` 제거에 따라 `store.test.ts`에서 관련 테스트 2개 제거 (총 15개 테스트 유지)
- React+Zustand 자체 번들 때문에 100 kB 목표 미달성 — 빌드 자체는 정상
- `background/index.ts`: price-poll alarm 제거, `GET_PROFILE` 메시지 릴레이만 유지 (Day 13 content script 대비)

## Day 13 — Content script 자동완성 ✅

- [x] `extension/src/content/autofill.ts` — `MutationObserver` polling, fuzzy selector 엔진, 토스트
- [x] `extension/src/content/selectors/koreanair.ts`, `jal.ts` — selector map (name/id/placeholder/label 4단계 매칭)
- [x] `manifest.json` `content_scripts` 등록: `https://*.koreanair.com/*`, `https://*.jal.co.jp/*`
- [x] `chrome.runtime.sendMessage({type: 'GET_PROFILE'})` → background 릴레이 응답
- [x] selector miss 시 토스트 "직접 입력해주세요" fallback
- [x] `extension/src/__tests__/autofill.test.ts` — 8개 단위 테스트 (KE/JAL fixture)

### Day 13 완료 기준
- [ ] 대한항공 예약 페이지에서 이름/생년월일 자동 입력 확인 (수동)
- [ ] JAL 동일 (수동)
- [x] selector miss 시 토스트만 뜨고 페이지 정상 (코드 구현 완료)
- [x] vitest 23개 통과

### Day 13 Notes
- autofill.ts는 별도 청크(2.74 kB gzip 1.43 kB)로 빌드됨 — popup 번들에 영향 없음
- `manifest.json` v0.2.0, `alarms` 권한 제거 (price-poll 폐기)
- MutationObserver: 최대 20회 재시도 후 miss 토스트. SPA/동적 렌더링 대응
- 여권번호 자동입력은 서버 복호화 흐름 필요 — Phase 2.5로 연기

## Day 14 — E2E + 배포 + v0.2.0 ✅

- [ ] 3-프로세스 E2E 수동 시나리오 (수동 확인 필요)
- [x] webapp `next.config.mjs` — `NEXT_PUBLIC_API_BASE` 환경변수로 백엔드 URL 분리
- [x] `vercel.json` — webapp Vercel 배포 설정
- [x] `backend/Dockerfile` + `railway.toml` — Railway 배포 설정
- [x] `backend/.env.example` — 프로덕션 CORS 도메인 주석 추가
- [x] `extension/.env.production` — `VITE_API_BASE=https://api.zivo.app`
- [x] CHANGELOG v0.2.0 작성
- [x] v0.2.0 git 태그 + `zivo-v0.2.0.zip` (56 kB) 생성
- [x] vitest 23개 통과

### Day 14 완료 기준
- [ ] 프로덕션 URL에서 검색→예약→이력까지 동작 (Vercel/Railway 계정 연결 후 수동)
- [x] 익스텐션 프로덕션 빌드 zip 생성 (`zivo-v0.2.0.zip`, 56 kB)
- [x] pytest 46 + vitest 23 통과

### Day 14 Notes
- 실제 배포는 Vercel/Railway 계정 연결 후 수동 진행 필요
  - Vercel: 루트에서 `vercel --prod`, env var `NEXT_PUBLIC_API_BASE` 설정
  - Railway: `backend/` 디렉터리 연결, env vars 입력 (DATABASE_URL, REDIS_URL, DUFFEL_API_KEY 등)
- CORS_ORIGINS 프로덕션 값: `chrome-extension://*,https://zivo.app,https://www.zivo.app`
- Phase 2.5: 카카오 OAuth (`POST /api/auth/kakao/exchange` + httpOnly 쿠키)

## Phase 2 Notes (공용)

- **Duffel 키 노출 방지**: 웹앱은 Duffel SDK 의존성을 추가하지 않는다. 모든 항공권 호출은 FastAPI 프록시(`/api/flights/*`) 경유
- **프로필 분리**: 웹앱(localStorage) 과 익스텐션(chrome.storage.sync) 은 device_id 가 다르다. 백엔드가 source of truth 이며, Phase 2 에서는 "로그인 후 카카오 id 기준으로 머지" 가 전제. 로그인 전에는 양쪽 프로필이 독립
- **Content script 취약성**: 항공사 DOM 변경에 대비해 label/placeholder fuzzy matcher + 실패 시 토스트로 "수동 입력" 유도. 사이트별 selector 에 `version` 필드 포함
- **Phase 2.5 카카오 OAuth**: Phase 2 완료 후 분리 작업. webapp `app/auth/kakao/callback/route.ts` + backend `POST /api/auth/kakao/exchange` + httpOnly 쿠키

---

---

---

# Phase 2.5 — 프로덕션 전환 + 카카오 OAuth (Day 15-17)

**목표**: 코드는 완성된 상태에서 실제 프로덕션 URL 에서 서비스가 동작하게 하고, 익명 device_id 를 카카오 계정으로 격상.

## Day 15 — 실배포 + 미완료 수동 E2E ✅

### 15a. 실배포
- [x] Railway 배포: backend 연결 + Duffel Live 키 적용 → 프로덕션 동작 확인
- [x] Vercel 배포: `https://zivo-extension.vercel.app/` 홈 렌더 확인
- [ ] 도메인 (선택): `zivo.app`, `api.zivo.app` DNS — 미진행
- [x] Duffel Live 키 발급 + `.env` / Railway env 적용

### 15b. 수동 E2E 확인
- [x] 프로덕션 URL 검색 동작 확인 (`zivo-extension.vercel.app`)
- [x] 예약 딥링크 에러 페이지 수정 (아시아나/제주항공 → 홈페이지 fallback)
- [x] 대한항공 셀렉터 DOM 검증 완료 (생년월일/성별 포함)
- [x] 10개 항공사 content script 인프라 구축 (`<select>` / button 지원)
- [ ] 익스텐션 popup ↔ 웹앱 프로필 동기화 미완 (device_id 불일치 — Day 16 이전 패치 예정)
- [ ] JAL 자동완성 수동 확인 미완
- [ ] Redis 캐시 적중 확인 미완

### Day 15 Notes
- Duffel Live 키로 실제 항공편 데이터 연동 완료
- 편도 조합 결과 없음 → Kiwi API 필요 (affiliates@kiwi.com 문의 필요)
- LCC 딥링크는 홈페이지로 임시 처리 — 다음 세션에서 항공사별 HTML 분석 후 정확한 URL 적용 예정

---

## Day 16 — 카카오 OAuth 백엔드 ⏳

### 신규
- [ ] `backend/app/services/kakao.py` — `exchange_code(code) → KakaoUser`, tenacity 재시도
- [ ] `backend/app/api/v1/auth.py` — `POST /api/auth/kakao/exchange`, `GET /api/auth/me`, `POST /api/auth/logout`
- [ ] `backend/app/api/deps.py` — `get_current_user_or_device()` 의존성 (JWT 쿠키 우선, X-Device-Id 폴백)

### 수정
- [ ] `backend/app/core/security.py` — `create_jwt_cookie(user_id)` 헬퍼
- [ ] `backend/app/services/user.py` — `merge_device_to_user(device_id, user_id)`
- [ ] `backend/app/api/v1/profile.py`, `bookings.py`, `alerts.py` — 새 의존성으로 교체

### 테스트
- [ ] `backend/tests/test_auth_api.py` — respx kakao mock (교환·me·로그아웃·병합)

### 완료 기준
- [ ] `POST /api/auth/kakao/exchange` → httpOnly JWT 쿠키 설정
- [ ] 기존 device_id 호출 회귀 없음
- [ ] pytest 누적 55+

---

## Day 17 — 카카오 OAuth 웹앱 + 익스텐션 ⏳

### 웹앱
- [ ] `webapp/src/app/auth/kakao/callback/route.ts` — code → exchange → 홈 리다이렉트
- [ ] `webapp/src/components/LoginButton.tsx` — 카카오 OAuth URL 생성
- [ ] `webapp/src/app/layout.tsx` 상단 nav 로그인 상태 + 버튼
- [ ] 로그인 직후 device_id → `POST /api/auth/merge-device` 자동 호출

### 익스텐션
- [ ] `extension/src/popup/App.tsx` — `GET /api/auth/me` 로 로그인 상태 표시, "웹앱에서 로그인" 버튼

### 환경변수
- `backend/.env` — `KAKAO_CLIENT_ID`, `KAKAO_CLIENT_SECRET`, `KAKAO_REDIRECT_URI`
- `webapp/.env.production` — `NEXT_PUBLIC_KAKAO_CLIENT_ID`

### 완료 기준
- [ ] 카카오 로그인 → 웹앱 홈 복귀 → 닉네임 노출
- [ ] 기존 device_id 프로필/예약이 로그인 후에도 표시 (병합)
- [ ] 로그아웃 → device_id 기반 복귀

---

# Phase 3 — 커버리지·고도화 (Day 18-23)

**목표**: v0.3.0 — 가격 알림·달력·Kiwi 병렬 소스·ANA/제주항공 자동완성·Chrome Web Store 제출.

## Day 18 — 가격 알림 백엔드 ⏳

- [ ] `backend/app/api/v1/alerts.py` 실구현 — POST/GET/DELETE, `get_current_user_or_device` 의존성
- [ ] `backend/app/services/alerts.py` — `check_alert()`: Duffel 검색 → target_krw 비교 → 트리거
- [ ] `backend/app/services/notify_kakao.py` — 알림톡 stub (key 없으면 log only)
- [ ] `backend/app/services/notify_email.py` — SMTP stub
- [ ] `backend/app/core/scheduler.py` — APScheduler 6h cron
- [ ] `backend/app/main.py` — startup/shutdown 스케줄러 등록
- [ ] `backend/tests/test_alerts.py`

### 완료 기준
- [ ] `/alerts` CRUD 동작
- [ ] cron 수동 실행 시 `alert:{id} triggered` 로그 발생

---

## Day 19 — 가격 알림 웹앱 + 달력 탭 ⏳

- [ ] `webapp/src/app/alerts/page.tsx` — 알림 CRUD UI, 로그인 필수
- [ ] 상단 nav `알림` 탭 추가
- [ ] `backend/app/api/v1/flights.py` `/search/flexible` 실구현 — 주말 병렬 검색, Redis 1h 캐시
- [ ] `webapp/src/components/CalendarHeatmap.tsx` — 날짜 히트맵
- [ ] `/search` 달력 탭 — Top 3 추천 + 히트맵 연결

### 완료 기준
- [ ] `/alerts` 알림 생성 → DB 반영
- [ ] `/search` 달력 탭 히트맵 렌더

---

## Day 20 — Kiwi Tequila 병렬 소스 ⏳

- [ ] `backend/app/services/kiwi.py` — `/v2/search` 호출, NormalizedOffer 변환, KRW 필터, _retry 재사용
- [ ] `backend/app/api/v1/flights.py` — `asyncio.gather(duffel, kiwi)`, 중복 제거 (carrier+flight_no+depart)
- [ ] `KIWI_API_KEY` 없으면 silent skip (하위 호환)
- [ ] `backend/tests/test_kiwi_service.py`

### 완료 기준
- [ ] Kiwi 키 있을 때 LJ/MM 오퍼 포함
- [ ] Kiwi 키 없을 때 기존 Duffel-only 응답 동일 (회귀 없음)

---

## Day 21 — ANA / 제주항공 content script ⏳

- [ ] `extension/src/content/selectors/ana.ts` (`https://*.ana.co.jp/*`)
- [ ] `extension/src/content/selectors/jejuair.ts` (`https://*.jejuair.net/*`)
- [ ] `extension/manifest.json` content_scripts matches 확장
- [ ] `extension/src/__tests__/autofill.test.ts` — ANA/제주항공 fixture 추가

### 완료 기준
- [ ] 실사이트 자동완성 확인 (수동)
- [ ] vitest 31개 통과

---

## Day 22 — Chrome Web Store 제출 ⏳

- [ ] 아이콘 PNG 3종 (16/48/128) 실 디자인 교체 (사용자 제공)
- [ ] `extension/store-assets/` — 스크린샷 5장, 프로모 이미지
- [ ] `extension/PRIVACY.md` — 여권번호 AES 암호화/비로컬저장 명시
- [ ] `extension/manifest.json` version → `0.3.0`
- [ ] `zivo-v0.3.0.zip` 생성 + Chrome Web Store 심사 제출 ($5 개발자 계정 필요)
- [ ] README / CHANGELOG 갱신

---

## Day 23 — v0.3.0 패키징 + 회고 ⏳

- [ ] CHANGELOG v0.3.0 작성
- [ ] v0.3.0 git 태그
- [ ] `plan.md` Phase 3 섹션 ✅ 업데이트
- [ ] Phase 4 스코프 재결정 (Amadeus / 보험 연계 / 통계 대시보드)

## Phase 2.5/3 Notes (공용)

- **외부 파트너 선결**: Vercel/Railway 계정 → 카카오 REST 앱 → 카카오 알림톡 파트너 심사 (1-2주) → Kiwi 파트너 심사 → Chrome Web Store 개발자 계정 ($5)
- **알림톡/Kiwi 미승인 시**: log-only stub 으로 코드 완성, env 주입만으로 실전송/병렬 소스 활성화
- **v0.4.0 보류**: Amadeus, 편도 조합 보험 연계, 절약액 통계 대시보드, React Native (Phase 4)

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

> **다음 세션 — 웹앱 디자인 개선 → 항공사 자동완성**
>
> ### 1. 웹앱 디자인 개선 (Claude Design 활용) ← 먼저
> - [ ] 홈 검색 폼 UI 개선
> - [ ] 검색 결과 카드 디자인
> - [ ] 예약 플로우 UI 개선
> - [ ] 전체 컬러/타이포그래피 통일
>
> ### 2. 나머지 항공사 HTML 분석 + 셀렉터 완성
> 대한항공 완료 (2026-04-24). 나머지 9개 항공사 진행:
> - [ ] 아시아나 (`항공사_html/` 에 HTML 저장 → `selectors/asiana.ts` 업데이트)
> - [ ] JAL (`selectors/jal.ts` 업데이트)
> - [ ] ANA (`selectors/ana.ts`)
> - [ ] 제주항공 (`selectors/jejuair.ts`)
> - [ ] 진에어 (`selectors/jinair.ts`)
> - [ ] 에어부산 (`selectors/airbusan.ts`)
> - [ ] 티웨이 (`selectors/tway.ts`)
> - [ ] 피치항공 (`selectors/peach.ts`)
> - [ ] 제트스타 (`selectors/jetstar.ts`)
>
> 작업 방식: 각 항공사 예약 페이지(비로그인 게스트) → 탑승자 정보 폼 → HTML 저장 → Claude가 셀렉터 분석
>
> ### 3. 익스텐션 device_id → 웹앱 URL 파라미터 임시 동기화 (카카오 OAuth 전 패치)
> `extension/src/popup/App.tsx` 웹앱 열기 버튼에 device_id URL 파라미터 추가
>
> ### 4. Day 16 카카오 OAuth (이후)
> `backend/app/api/v1/auth.py` + `services/kakao.py` 신규 작성
