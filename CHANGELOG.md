# Changelog

All notable changes to Zivo are documented here.

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
