# ✈️ Zivo

> **한국-일본 노선 전문 항공권 예약 서비스 · 웹앱 + 크롬 익스텐션 자동완성**  
> 편도 조합 최저가 탐색 · 원터치 예약 · 탑승자 정보 자동완성

---

## 목차

- [소개](#소개)
- [핵심 기능](#핵심-기능)
- [기술 스택](#기술-스택)
- [시스템 아키텍처](#시스템-아키텍처)
- [화면 구성](#화면-구성)
- [개발 로드맵](#개발-로드맵)
- [시작하기](#시작하기)
- [환경 변수](#환경-변수)
- [API 명세](#api-명세)
- [데이터베이스 스키마](#데이터베이스-스키마)
- [수익화 모델](#수익화-모델)
- [라이선스](#라이선스)

---

## 소개

Zivo는 한국-일본 노선에 특화된 항공권 예약 서비스입니다. **Next.js 웹앱**이 검색·결과·예약·이력을 담당하고, **크롬 익스텐션**은 탑승자 정보 관리와 항공사/OTA 사이트에서의 예약 폼 자동완성을 담당합니다.

기존 항공권 예약 서비스와의 차이점:

| 기존 서비스 | Zivo |
|---|---|
| 검색 → 직접 입력 → 예약 | 웹앱 열자마자 결과 → 클릭 한 번 → 예약 완료 |
| 왕복만 비교 | 편도 조합까지 포함한 진짜 최저가 |
| 매번 탑승자 정보 입력 | 한 번 저장 → 웹앱/항공사 사이트 모두 영구 자동완성 |

### 시장 규모

| 지표 | 수치 | 출처 |
|---|---|---|
| 한일 노선 연간 이용객 (2024) | 약 1,200만 명 | 국토교통부 항공통계 |
| 크롬 브라우저 국내 점유율 | 약 65% | StatCounter 2025 |
| 잠재 타겟 추산 | 약 200~300만 명 | 상기 지표 교차 추산 |

---

## 핵심 기능

### 1. 자동완성 (Auto-fill)

한 번 입력한 개인정보와 여행 선호를 저장해두고, **웹앱**과 **항공사 예약 사이트** 양쪽에서 자동으로 불러옵니다.

**저장 항목**
- 개인정보: 여권 영문명, 생년월일, 여권번호(암호화), 여권 만료일, 연락처
- 여행 선호: 기본 출발지, 자주 가는 도착지(최대 5개), 여행 패턴, 예약 시점, 인원, 좌석/수하물 선호, 마일리지 카드

**저장 방식**
- **백엔드 DB** 가 source of truth — 여권번호 등 민감정보는 AES-256-GCM 으로 암호화 저장
- 웹앱: 브라우저 `localStorage` 에 일반 필드만 캐시 (오프라인 자동완성)
- 익스텐션: `chrome.storage.sync` 에 일반 필드만 캐시 → 항공사 사이트 content script 가 읽어 폼 자동 입력
- 여권번호는 **로컬 저장소에 절대 저장하지 않으며** 서버에서만 복호화하여 사용

---

### 2. 편도 조합 최저가

왕복 티켓뿐 아니라 **서로 다른 항공사의 편도 티켓을 조합**해 가장 저렴한 조합을 자동으로 찾아줍니다.

```
예시:
  → 피치항공  5/17 15:00 ICN→KIX  ₩30,000
  ← 제주항공  5/18 10:00 KIX→ICN  ₩40,000
  ────────────────────────────────────────
  합계 ₩70,000  (일반 왕복 대비 32% 절약)
```

> ⚠️ 편도 조합은 두 편이 별개 예약입니다. 앞 편 지연 시 뒷 편 항공사의 자동 보호가 적용되지 않습니다. 예약 전 명확히 안내합니다.

---

### 3. 3탭 결과 화면

| 탭 | 내용 |
|---|---|
| **기본** | 일반 왕복 최저가순 |
| **더 싼 옵션** | 편도 조합 최저가 (절약액 표시) |
| **달력** | 날짜별 최저가 히트맵 |

---

### 4. 원터치 예약

**웹앱** 에서 저장된 탑승자 정보로 예약 폼을 자동완성하고, 항공사/OTA 결제 페이지로 바로 연결합니다. 항공사 사이트에 도착한 뒤에는 **크롬 익스텐션 content script** 가 탑승자/여권 정보를 해당 페이지의 폼에 채워 줍니다.  
Zivo는 결제 정보를 직접 저장하거나 처리하지 않습니다.

**일반 왕복** (웹앱)
1. 결과 카드의 `[원터치 예약]` 클릭
2. 저장된 탑승자 정보 자동표시 → 확인
3. 항공사/OTA 결제 페이지로 리다이렉트 → content script 가 폼 자동완성
4. 예약번호 이력 저장

**편도 조합** (웹앱)
1. `[가는편 예약]` → 첫 번째 항공사 결제 페이지로 리다이렉트
2. `[오는편 예약]` → 두 번째 항공사 결제 페이지로 리다이렉트
3. 두 예약번호 모두 이력에 저장

---

### 5. 가격 알림

목표가 이하로 떨어지면 카카오 알림톡 또는 이메일로 즉시 알림을 받습니다.

- 6시간마다 백그라운드 자동 체크
- 알림 예시: `"ICN→KIX 5/17 ₩62,000 달성! 지금 예약하기 →"`

---

### 6. 유연 날짜 탐색

날짜를 정하지 않아도 해당 월 전체를 탐색해 최저가 날짜 Top 3를 자동 추천합니다.

```
이번 달 ICN → KIX  1박 2일 기준

  1위: 5/10(토)  ₩58,000  편도 조합
  2위: 5/3(토)   ₩71,000  편도 조합
  3위: 5/17(토)  ₩89,000  일반 왕복
```

---

## 기술 스택

| 영역 | 기술 |
|---|---|
| 웹앱 | Next.js 14 (App Router) · TypeScript 5 · Tailwind CSS · TanStack Query · Zustand |
| 크롬 익스텐션 | Manifest V3 · React 18 · TypeScript · Vite (축소판 · popup + content scripts) |
| 백엔드 | Python 3.12 · FastAPI · PostgreSQL 16 · Redis · SQLAlchemy · APScheduler |
| 인프라 | Docker Compose (로컬) · Vercel (웹앱) · Railway (백엔드) |
| 인증/보안 | JWT · 카카오 OAuth 2.0 (Phase 2.5) · AES-256-GCM · TLS 1.3 |
| 항공권 API | Duffel (Phase 1) · Kiwi Tequila (Phase 3) · Amadeus (Phase 3) |
| 알림 | 카카오 알림톡 · 이메일 |
| 모바일 (Phase 4) | React Native (검토 예정) |

---

## 시스템 아키텍처

```
[Zivo 웹앱 (Next.js · Vercel)]          [크롬 익스텐션]
 ├─ / (검색 폼)                          ├─ Popup: 탑승자 정보 편집
 ├─ /search (결과 3탭)                   │         + "Zivo 웹앱 열기" 버튼
 ├─ /book, /book/confirm (예약)          └─ Content Script
 ├─ /bookings (예약 이력)                      항공사/OTA 예약 폼 자동완성
 └─ /profile (탑승자 정보)                     (chrome.storage.sync 의 프로필 읽음)
        ↓ /api/* rewrites                      ↕ chrome.runtime message
              ↕
       [FastAPI 백엔드 · Railway]
        ├─ /api/flights/search  병렬 검색 → 중복 제거 → 최저가 정렬
        ├─ /api/flights/book    예약 직전 가격 재확인 + 딥링크
        ├─ /api/profile         ← 웹앱·익스텐션 공동 source
        ├─ /api/bookings        예약 이력
        ├─ /api/alerts          가격 알림 (Phase 3)
        └─ /api/auth/kakao      카카오 OAuth (Phase 2.5)
              ↕
       [PostgreSQL]  [Redis 5분 캐시]
              ↕
       [Duffel API]  [Kiwi Tequila]  [Amadeus]
```

### 병렬 검색 소스

| 우선순위 | 소스 | 커버리지 | 비고 |
|---|---|---|---|
| 1 | Duffel | 대한항공·아시아나·JAL | MVP 기본 소스, 즉시 사용 가능 |
| 2 | Kiwi Tequila | LCC 포함 광범위 | 파트너 승인 후 추가 (1~2주) |
| 3 | Amadeus | GDS 전체 | Phase 2 추가 |
| 4 | 피치항공 | 피치 전용 | Phase 2, 공식 파트너 우선 |
| 5 | 제트스타 | 제트스타 전용 | Phase 2, 공식 파트너 우선 |

---

## 화면 구성

### 웹앱 (Next.js)

| 라우트 | 화면명 | 설명 |
|---|---|---|
| `/` | 홈 / 검색 | 기본 설정 자동완성 + 즉시 검색 |
| `/search` | 검색 결과 | 3탭 구조 (기본 / 더 싼 옵션 / 달력) |
| `/book` | 탑승자 확인 | 저장된 정보 자동 표시 + 편도 조합 경고 |
| `/book/confirm` | 예약 완료 | 예약번호 표시 + 항공사 페이지 안내 |
| `/bookings` | 예약 이력 | 과거 예약 목록 및 상태 |
| `/profile` | 프로필 / 설정 | 개인정보 및 기본 여행 설정 관리 |
| `/alerts` | 가격 알림 (Phase 3) | 알림 노선 및 목표가 관리 |

상단 네비: `검색` · `예약이력` · `알림` · `프로필`

### 크롬 익스텐션 (축소판)

| 구성 | 역할 |
|---|---|
| Popup | 탑승자 정보 편집 폼 + "Zivo 웹앱 열기" 버튼 (간소화) |
| Content Script | 대한항공/JAL/ANA/제주항공 등 예약 페이지에서 탑승자·여권·연락처 폼 자동 입력 |

---

## 개발 로드맵

### Phase 1 — 익스텐션 MVP (1주차) ✅ 완료

| 일자 | 작업 내용 |
|---|---|
| Day 1 | 프로젝트 세팅 (익스텐션 + FastAPI + PostgreSQL + Redis) |
| Day 2 | 프로필 자동저장/자동완성 (chrome.storage.sync) |
| Day 3 | Duffel API 연동 (asyncio 병렬 처리) |
| Day 4 | 편도 조합 알고리즘 + 3탭 결과 UI |
| Day 5 | 원터치 예약 플로우 (탑승자 확인 → OTA 리다이렉트) |
| Day 6 | Redis 캐싱 + 에러 처리 + 가격 재확인 로직 |
| Day 7 | E2E 테스트 + 버그 수정 + 베타 패키징 (v0.1.0) |

**결과물**: `zivo-v0.1.0.zip` — 익스텐션 단독으로 검색·예약 가능한 MVP. Phase 2 에서 웹앱 중심으로 전환하면서 익스텐션 UI 는 Day 12 에 축소 예정.

### Phase 2 — 웹앱 피벗 (2주차) ✅ 완료

검색·결과·예약·이력을 Next.js 웹앱으로 이전하고, 익스텐션은 탑승자 정보 관리 + 항공사 사이트 자동완성(content script)으로 축소.

| 일자 | 작업 내용 |
|---|---|
| Day 8 | pnpm workspace + `webapp/` Next.js 14 스캐폴딩, `packages/types/` 분리, 백엔드 CORS 확장 |
| Day 9 | 검색 폼(`/`) + 결과 3탭(`/search`), FlightCard/ComboCard 포팅 |
| Day 10 | 예약 플로우(`/book`, `/book/confirm`) + 편도 조합 가는편/오는편 |
| Day 11 | 프로필(`/profile`) + 예약 이력(`/bookings`) |
| Day 12 | 익스텐션 축소 — 검색/결과/예약/이력 UI 삭제, 팝업 재디자인 |
| Day 13 | Content script 자동완성 (대한항공/JAL, selector map + MutationObserver) |
| Day 14 | Vercel/Railway 배포 설정, v0.2.0 태그 |

**결과물**: `zivo-v0.2.0.zip` — 웹앱 중심 구조, 익스텐션은 프로필 관리 + 자동완성 전담.  
**Phase 2.5**: 카카오 OAuth (webapp 콜백 + backend JWT 쿠키) — 다음 작업 블록

### Phase 3 — 커버리지·고도화 (3~4주차)
- Kiwi Tequila 병렬 소스 추가 (파트너 승인 후)
- Amadeus API 추가
- 가격 알림 (카카오 알림톡 + 이메일) 완성
- 최저가 달력 뷰 완성
- 유연 날짜 탐색 ("이번 달 최저가 날짜 찾기")
- 편도 조합 보호 보험 연계 (수익화)
- 절약액 통계 대시보드
- Chrome Web Store 정식 등록

### Phase 4 — 모바일 (검토 예정)
- React Native 기반 iOS/Android 앱
- 웹앱 구조 안정화 이후 착수. 세부 로드맵은 Phase 3 종료 시점에 재수립.

---

## 시작하기

### 사전 요구사항
- Node.js 18+
- **pnpm 8+** (모노레포 워크스페이스)
- Python 3.12+
- Docker & Docker Compose

### 포트 구성 (로컬 개발)

| 프로세스 | 포트 | 명령 |
|---|---|---|
| Postgres / Redis | 5432 / 6379 | `docker-compose up -d` |
| FastAPI 백엔드 | 8000 | `uvicorn app.main:app --reload` |
| Next.js 웹앱 | 3000 | `pnpm -F zivo-webapp dev` |
| 크롬 익스텐션 | — (파일 빌드) | `pnpm -F zivo-extension dev` |

### 한 번에 실행

```bash
git clone https://github.com/your-username/zivo.git
cd zivo
pnpm install
docker-compose up -d
# 터미널 A
cd backend && cp .env.example .env  # .env 편집 후:
alembic upgrade head && uvicorn app.main:app --reload
# 터미널 B
pnpm dev:all       # webapp(3000) + extension watch 동시 실행
```

### 백엔드 실행

```bash
cd zivo/backend
cp .env.example .env
docker-compose up -d
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```

### 웹앱 (Next.js)

```bash
# 루트에서 실행
pnpm dev:web                       # http://localhost:3000

# 또는 webapp 디렉터리에서 직접
cd webapp
pnpm dev
```

> 프로덕션 배포 시 `NEXT_PUBLIC_API_BASE=https://api.zivo.app` 환경변수 설정 필요 (`.env.production.example` 참고)

### 크롬 익스텐션 빌드

```bash
# 루트에서 실행
pnpm dev:ext                       # watch 빌드

# 또는 extension 디렉터리에서 직접
cd extension
npm run build                      # 프로덕션 빌드 → dist/
```

**크롬에 익스텐션 로드**
1. `chrome://extensions` 접속
2. `개발자 모드` 활성화
3. `압축 해제된 확장 프로그램 로드` → `extension/dist` 폴더 선택

---

## 환경 변수

### 백엔드 (`backend/.env`)

```env
DATABASE_URL=postgresql://user:password@localhost:5432/zivo
REDIS_URL=redis://localhost:6379

DUFFEL_API_KEY=your_duffel_api_key
KIWI_API_KEY=your_kiwi_api_key                  # Phase 3
AMADEUS_API_KEY=your_amadeus_api_key            # Phase 3
AMADEUS_API_SECRET=your_amadeus_secret          # Phase 3

KAKAO_CLIENT_ID=your_kakao_client_id            # Phase 2.5
KAKAO_REDIRECT_URI=http://localhost:3000/auth/kakao/callback
KAKAO_ALIMTALK_API_KEY=your_alimtalk_key        # Phase 3

JWT_SECRET_KEY=your_jwt_secret
AES_ENCRYPTION_KEY=your_aes_256_key

# 웹앱 도메인을 CORS 에 포함
CORS_ORIGINS=chrome-extension://*,http://localhost:3000,https://zivo.app
```

### 웹앱 (`webapp/.env.local`)

```env
NEXT_PUBLIC_API_BASE=http://localhost:8000
```

### 익스텐션

`extension/src/lib/api.ts` 가 `VITE_API_BASE` 환경변수를 참조. 로컬 개발 시 기본값 `http://localhost:8000` 으로 동작.

---

## API 명세

| 엔드포인트 | 메서드 | 설명 | 호출 주체 |
|---|---|---|---|
| `/api/flights/search` | POST | 병렬 검색 → 중복 제거 → 최저가 정렬 반환 | 웹앱 |
| `/api/flights/search/flexible` | POST | 해당 월 전체 날짜 탐색 → 최저가 Top 5 반환 (Phase 3) | 웹앱 |
| `/api/flights/book` | POST | 가격 재확인 + 딥링크 반환 + 예약 기록 | 웹앱 |
| `/api/bookings` | GET | 예약 이력 조회 | 웹앱 |
| `/api/alerts` | POST | 가격 알림 등록 (Phase 3) | 웹앱 |
| `/api/profile` | GET/PUT | 사용자 프로필 조회/수정 | 웹앱 + 익스텐션 |
| `/api/auth/kakao` | POST | 카카오 로그인 (Phase 2.5) | 웹앱 |

모든 호출에 `X-Device-Id` 헤더 필요 (웹앱: `localStorage`, 익스텐션: `chrome.storage.sync` 에 UUID 저장). 카카오 로그인 이후에는 JWT 쿠키로 대체.

---

## 데이터베이스 스키마

```
users            사용자 (이메일, 카카오ID)
user_profiles    개인 프로필 (여권번호 AES-256 암호화)
mileage_cards    마일리지 카드
user_defaults    기본 여행 설정 (자동완성 핵심)
saved_routes     즐겨찾기 노선
bookings         예약 이력
price_alerts     가격 알림 설정
```

---

## 수익화 모델

| 모델 | 내용 | 예상 수익 |
|---|---|---|
| API 수수료 공유 | Kiwi·Duffel 예약 건당 수수료 | 건당 ₩1,000~3,000 |
| 보험 연계 | 편도 조합 보호 보험 판매 | 건당 ₩3,000~5,000 |
| 프리미엄 구독 | 가격 알림 무제한, 우선 알림 | 월 ₩2,900 |
| 카드사 제휴 | 특정 카드 결제 시 추가 할인 | CPA 기반 |

### 수익 시뮬레이션 (보수적 기준)

| 시나리오 | 월 활성 사용자 | 월 예약 건수 | 월 예상 수익 |
|---|---|---|---|
| 초기 (Phase 1) | 500명 | 200건 | ₩200,000~600,000 |
| 성장 (Phase 3) | 3,000명 | 1,500건 | ₩1,500,000~4,500,000 |
| 구독 추가 시 | 3,000명 중 10% 구독 | — | 추가 ₩870,000/월 |

---

## 향후 확장 계획

- **항공사 사이트 자동완성 확대** (대한항공/JAL 완료): ANA/제주항공/피치/제트스타 순차 추가 예정
- **도메인 확장**: 한일 노선 안정화 이후 대만(TPE), 중국(PEK/PVG) 노선 추가
- **다국어 지원**: 일본어, 중국어, 영어 UI
- **모바일 앱 (Phase 4)**: React Native 기반 iOS/Android. 웹앱 코드와 공유하는 도메인 모델은 이미 `packages/types/` 에 분리되어 있어 전환 비용이 낮음

---

## 라이선스

MIT License © 2026 Zivo
