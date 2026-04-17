# Zivo 진행 상황 (plan.md)

> 세션 간 연속성 추적용. 각 세션 시작 시 이 파일과 `CLAUDE.md` 를 먼저 읽으면 된다.
> 상세 플래닝은 `/Users/isejin/.claude/plans/readme-md-zivo-misty-cupcake.md` 참고.

**현재 단계**: Phase 1 (7일 MVP)
**마지막 업데이트**: 2026-04-17 (Day 1 실행 검증 완료, 첫 커밋)

---

## 진척 개요

| Day | 주제 | 상태 |
|---|---|---|
| Day 0 | Claude 협업 기반 (CLAUDE.md + skills) | ✅ 완료 |
| Day 1 | 모노레포 스캐폴딩 | ✅ 완료 (실행 검증 완료) |
| Day 2 | 프로필 자동저장/자동완성 | ⏳ 다음 |
| Day 3 | Duffel API 연동 | ⏸ 대기 |
| Day 4 | 편도 조합 + 3탭 UI | ⏸ 대기 |
| Day 5 | 원터치 예약 플로우 | ⏸ 대기 |
| Day 6 | Redis 캐싱·에러·가격 재확인 | ⏸ 대기 |
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

## Day 2 — 프로필 자동저장/자동완성 ⏳

**목표**: Popup 에서 여권 영문명·연락처·자주 가는 노선 입력 → 백엔드 저장 + `chrome.storage.sync` 캐시 → 다음 방문 시 자동 복원.

### 백엔드
- [ ] `schemas/profile.py` — pydantic 요청/응답 모델
- [ ] `schemas/user_default.py`
- [ ] `api/v1/profile.py`
  - [ ] `GET /api/profile` — `X-Device-Id` 헤더로 사용자 조회 (없으면 자동 생성)
  - [ ] `PUT /api/profile` — upsert
- [ ] `services/user.py` — `get_or_create_user(device_id)` (Phase 2 카카오 로그인 대비 독립)
- [ ] 여권번호·여권만료일은 `encrypt_sensitive()` 경유 저장, 응답 시 마스킹만
- [ ] `tests/test_profile_api.py`

### 익스텐션
- [ ] `popup/ProfileForm.tsx` — 여권 영문명/생년월일/연락처/자주 가는 노선 입력
- [ ] `popup/App.tsx` 에 프로필 탭 추가 (또는 별도 screen)
- [ ] `lib/store.ts` 에 `profileStore` 추가
- [ ] `lib/api.ts` 의 `getProfile/upsertProfile` 실제 호출
- [ ] 여권번호는 입력만 받고 **로컬에 저장하지 않음** (백엔드로만)
- [ ] 일반 필드는 `chrome.storage.sync` 에도 저장 (오프라인 자동완성)

### Day 2 완료 기준
- [ ] popup 프로필 저장 → 닫았다 열면 폼에 자동 복원
- [ ] 두 번째 크롬 기기에서 같은 계정으로 로그인 시 프로필 동기화 확인 (수동)
- [ ] 여권번호는 `chrome.storage.sync.get(null)` 에서 **보이지 않아야 함**
- [ ] 백엔드 DB `user_profiles` 테이블에 AES 암호화된 값 저장 확인

---

## Day 3 — Duffel API 연동 ⏸

- [ ] `services/duffel.py` 실제 구현 (`.claude/skills/duffel-search.md` 따라)
- [ ] `POST /api/flights/search` — 왕복 + 편도 pair 병렬 호출 → 정규화
- [ ] `schemas/flight.py` — `NormalizedOffer`, `SearchRequest/Response`
- [ ] `services/cache.py` — Redis 5분 TTL (`SETEX`)
- [ ] `tests/test_duffel_service.py` — respx mock
- [ ] Duffel sandbox 키 발급 (`.env` 에 `DUFFEL_API_KEY=duffel_test_...`)

### Day 3 완료 기준
- [ ] ICN→KIX 다음 주말 검색 시 정규화된 오퍼 리스트 반환
- [ ] 동일 검색 재실행 시 Redis 캐시 적중 (응답 < 200ms)
- [ ] Duffel 5xx/429 재시도 동작 (mock 테스트)

---

## Day 4 — 편도 조합 + 3탭 UI ⏸

- [ ] `services/combo.py` 실제 구현 (`.claude/skills/oneway-combo.md` 따라)
- [ ] `POST /api/flights/search` 응답에 `combos` 포함
- [ ] 익스텐션 popup 3탭 (`기본` / `더 싼 옵션` / `달력`) — 달력은 플레이스홀더
- [ ] 편도 조합 탭에 경고 배너 필수
- [ ] `tests/test_combo.py` — 레이오버 필터·동일 항공사 제외·중복 제거·정렬

### Day 4 완료 기준
- [ ] 실제 검색 시 `더 싼 옵션` 탭에 조합 카드 표시
- [ ] 각 조합의 `savings_krw` 가 왕복 대비 실제로 더 싸야 함
- [ ] 경고 배너가 모든 조합 카드 위에 노출

---

## Day 5 — 원터치 예약 플로우 ⏸

- [ ] `POST /api/flights/book` — 저장된 프로필 + 선택 오퍼 → 딥링크 생성
- [ ] `bookings` 테이블에 `direction`, `combo_group_id` 로 row 저장
- [ ] 익스텐션: `탑승자 확인` 화면 → `chrome.tabs.create` 로 딥링크
- [ ] 편도 조합은 `가는편 예약` → `오는편 예약` 두 단계
- [ ] 예약 이력 screen (Phase 1 은 간단 리스트)

### Day 5 완료 기준
- [ ] 왕복 원터치: 저장 정보 표시 → 항공사 결제 페이지 새 탭 오픈
- [ ] 편도 조합 원터치: 두 개의 탭이 순차적으로 열림
- [ ] DB `bookings` 에 row 2개 (같은 `combo_group_id`) 생성

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

---

## 공용 Notes

<!-- 여기에 Day 에 속하지 않는 발견·결정 기록 -->

- Duffel 파트너 승인 지연 시: sandbox 모드 (`duffel_test_` 키) 로 Day 3~6 진행 가능
- Kiwi Tequila 는 Phase 1 에서는 호출하지 않음 (Phase 2 대기)
- 아이콘 PNG 3종은 Day 1 완료 시점에 디자인 확정 필요

## Next

> Day 2 (프로필 자동저장) 착수. 크롬에 `extension/dist` 수동 로드해 popup 열리는지 눈으로 확인한 뒤 시작 권장.
>
> 새 세션 시작 시: `source backend/.venv/bin/activate` → 이어서 작업.
