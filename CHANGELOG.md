# Changelog

All notable changes to Zivo are documented here.

## [0.3.0] — 2026-04-25

### Added

**Phase 2.5 — 프로덕션 전환 + 카카오 OAuth**
- 카카오 OAuth 백엔드: `POST /api/auth/kakao/exchange`, `GET /api/auth/me`, `POST /api/auth/logout`
- JWT httpOnly 쿠키 인증, `get_current_user_or_device()` 의존성 (JWT 우선, Device-ID 폴백)
- `POST /api/auth/merge-device` — 기존 device_id 프로필·예약을 카카오 계정으로 병합
- 웹앱 카카오 로그인 버튼 + `/auth/kakao/callback` 라우트
- Railway 실배포 + Duffel Live 키 연동

**Phase 3 — 가격 알림·달력·자동완성 고도화**
- `POST/GET/DELETE /api/alerts` — 가격 알림 CRUD
- APScheduler 6h cron — 가격 트리거 시 알림(log stub, 카카오알림톡 키 시 실전송)
- 웹앱 `/alerts` — 알림 생성·목록·삭제 UI
- `GET /api/flights/search/flexible` — 주말 31일 병렬 검색, Redis 1h 캐시
- `CalendarHeatmap` — 달력 히트맵 탭 (날짜별 최저가 시각화)
- 달력 데이터 백그라운드 프리패치 (검색 결과 로드 시 미리 요청)
- content script: ANA·제주항공·아시아나·진에어·에어부산·티웨이·피치·제트스타 selector 추가 (10개 항공사 완성)
- `autofill.ts` 개선: 영문 월 이름 매핑(March→3), SPA 타임아웃 폴백 3단계

**아이콘·스토어 준비**
- 아이콘 PNG 3종 (16×16·48×48·128×128) 실 디자인 — Z 로고, #2563EB 배경
- `extension/PRIVACY.md` — AES-256-GCM 암호화·비로컬저장 정책 명시
- `extension/store-assets/` — Chrome Web Store 제출용 에셋 가이드

### Changed
- 익스텐션 manifest version → `0.3.0`
- content_scripts matches 10개 항공사로 확장

### Test
- 백엔드 pytest 유지
- 익스텐션 vitest 31개 (+8: ANA·Jeju Air fixture, findElement 헬퍼, select 테스트)

### Known Limitations
- 항공사 셀렉터 실DOM 검증: 대한항공(KE)만 완료, 나머지 9개 베스트에포트
- Chrome Web Store 제출: 스크린샷 5장 + $5 개발자 계정 필요 (수동)
- Kiwi Tequila API: MAU 50,000+ 요건으로 보류 (Day 20)

---

## [0.2.0] — 2026-04-18

### Added

**Phase 2 — 웹앱 피벗 + 익스텐션 자동완성**

#### 웹앱 (Next.js 14 App Router)
- `/` — 항공편 검색 폼 (출발/도착/날짜/인원/좌석)
- `/search` — 결과 3탭 (기본·더 싼 옵션·달력), URL query string 기반 공유·뒤로가기
- `/book` — 탑승자 확인 폼, 가격변동(±2%) 재확인 다이얼로그
- `/book/confirm` — 예약 결과 + 항공사 딥링크 버튼 (편도 조합은 두 편 각각)
- `/profile` — 탑승자 프로필 관리 (localStorage 캐시, 여권번호·만료일 제외)
- `/bookings` — 예약 이력 (방향 배지: 왕복·가는편·오는편)
- TanStack Query + Zustand, `X-Device-Id` 자동 첨부 fetch 래퍼

#### 익스텐션 (v0.2.0, Manifest V3)
- 팝업 재설계 — "Zivo 웹앱 열기" 버튼 + 탑승자 프로필 폼 (검색/예약/이력 UI 제거)
- Content script 자동완성 — 대한항공(`koreanair.com`), JAL(`jal.co.jp`)
  - name/id/placeholder/label 4단계 fuzzy selector
  - MutationObserver 동적 폼 대응 (최대 20회 재시도)
  - 성공/실패 토스트 알림
- `alarms` 권한 제거, `GET_PROFILE` background 메시지 릴레이 추가

#### 인프라·배포
- `vercel.json` — webapp Vercel 배포 설정
- `backend/Dockerfile` + `railway.toml` — Railway 배포 설정
- `NEXT_PUBLIC_API_BASE` 환경변수로 백엔드 URL 분리 (로컬/프로덕션)
- `extension/.env.production` — 프로덕션 API base

#### 테스트
- 백엔드 pytest 46개 유지
- 익스텐션 vitest 23개 (storage 10, store 5, autofill 8)

### Changed
- 익스텐션 manifest version → `0.2.0`
- 백엔드 FastAPI version → `0.2.0`
- pnpm workspace 도입 (`webapp/`, `extension/`, `packages/types/`)
- `@zivo/types` 공용 패키지 분리 — 웹앱·익스텐션 타입 공유

### Security
- 웹앱 localStorage에도 여권번호·만료일 미저장
- content script — 여권번호는 chrome.storage.sync 비저장이므로 자동입력 제외 (Phase 2.5 서버 복호화 흐름 예정)

### Known Limitations (Phase 2.5+ 예정)
- 카카오 OAuth 미구현 (익명 Device ID 유지)
- 웹앱·익스텐션 device_id 불일치 → 로그인 후 병합 마이그레이션 필요
- 달력 탭 플레이스홀더
- content script 여권번호 자동입력 미지원

---

## [0.1.0] — 2026-04-17

### Added

**Phase 1 MVP — 한국-일본 노선 항공권 예약 크롬 익스텐션**

#### 백엔드 (FastAPI)
- `GET /health` — 상태 확인 엔드포인트
- `GET /api/profile` · `PUT /api/profile` — 탑승자 프로필 저장/조회 (여권번호·만료일 AES-256-GCM 암호화)
- `POST /api/flights/search` — Duffel API 연동, 왕복+편도쌍 병렬 검색, Redis 5분 캐시
- `POST /api/flights/book` — 저장 프로필 기반 딥링크 생성, 예약 직전 가격 재확인 (±2% 초과 시 409)
- `GET /api/bookings` — 예약 이력 조회
- 편도 조합 알고리즘 — 서로 다른 항공사 편도 티켓 조합으로 왕복 대비 최저가 계산
- 구조화 JSON 로깅 — 여권번호·전화번호 자동 마스킹
- tenacity 재시도 — Duffel 5xx/429에 지수 백오프(최대 3회)

#### 익스텐션 (Manifest V3, React 18)
- 항공편 검색 폼 (ICN ↔ KIX/NRT/FUK/CTS)
- 3탭 결과 화면: 기본 / 더 싼 옵션(편도 조합) / 달력(플레이스홀더)
- 편도 조합 탭 — 별개 예약 경고 배너 필수 노출
- 탑승자 확인 화면 — 저장 프로필 표시 후 원터치 예약
- 예약 이력 화면
- `chrome.storage.sync` 프로필 캐시 (여권번호·만료일 저장 금지)
- 익명 Device ID 기반 사용자 식별

#### 인프라
- Docker Compose — PostgreSQL 16 + Redis 7 로컬 개발 환경
- 7개 DB 테이블 (users, user_profiles, mileage_cards, user_defaults, saved_routes, bookings, price_alerts)
- Alembic 마이그레이션

#### 테스트
- 백엔드 pytest 46개 (커버리지 82%)
- 익스텐션 vitest 17개 (storage, store — chrome runtime mock)

### Security
- 여권번호·여권만료일: 서버 DB AES-256-GCM 암호화 저장, `chrome.storage.sync` 저장 금지
- 결제 정보 미저장 — 항공사/OTA 페이지로 리다이렉트
- JWT 인증 (Phase 2 카카오 OAuth 대비 준비)

### Known Limitations (Phase 2 예정)
- Duffel sandbox 모드 (`duffel_test_` 키) — 실결제 불가
- 카카오 OAuth 미구현 (익명 Device ID로 동작)
- 달력 탭 플레이스홀더
- 아이콘 PNG placeholder (실 디자인 교체 필요)
- 편도 조합은 KRW 통화 오퍼만 지원
