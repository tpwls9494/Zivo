# CLAUDE.md

이 파일은 Claude Code가 Zivo 레포에서 작업할 때 항상 참고하는 지침이다.

> **세션 시작 시 반드시 `plan.md` 를 먼저 읽어 현재 진척도를 확인할 것.**
> 7일 로드맵의 어느 단계인지, 무엇이 완료되었는지, 다음 작업이 무엇인지 모두 `plan.md` 에 있다.

## 프로젝트 개요

**Zivo** 는 한국-일본 노선 전문 항공권 예약 크롬 익스텐션이다. 핵심 차별점:

1. **편도 조합 최저가** — 서로 다른 항공사의 편도 티켓을 조합해 실제 최저가 제시
2. **원터치 예약** — 저장된 탑승자 정보로 항공사/OTA 예약 폼 자동 완성
3. **자동완성** — 여권 영문명·생년월일·연락처 등 한 번 입력하면 영구 재사용

현재 단계: **Phase 1 (7일 MVP)**. Duffel 단일 소스로 ICN ↔ KIX/NRT/FUK/CTS 노선 지원. Kiwi·Amadeus·카카오 로그인은 Phase 2+.

## 레포 구조

```
Zivo/
├── CLAUDE.md                  이 파일
├── README.md                  프로젝트 전체 설명 (사용자 지향)
├── .claude/skills/            Claude Code 전용 skill
├── docker-compose.yml         postgres + redis (로컬 개발)
├── backend/                   FastAPI + SQLAlchemy + Alembic
│   ├── app/
│   │   ├── main.py            FastAPI 엔트리
│   │   ├── core/              config, security(AES/JWT)
│   │   ├── db/                SQLAlchemy session
│   │   ├── models/            users, user_profiles, bookings, price_alerts ...
│   │   ├── schemas/           pydantic I/O 모델
│   │   ├── api/v1/            REST 엔드포인트
│   │   └── services/          duffel, combo(편도 조합)
│   ├── alembic/
│   ├── pyproject.toml
│   └── .env.example
└── extension/                 Manifest V3 크롬 익스텐션
    ├── manifest.json
    ├── src/
    │   ├── popup/             React 18 + Zustand
    │   ├── background/        Service Worker (가격 폴링)
    │   └── lib/               api client, chrome.storage.sync 래퍼
    └── vite.config.ts
```

## 기술 스택

| 영역 | 기술 |
|---|---|
| Backend | Python 3.12 · FastAPI · SQLAlchemy 2.x (async) · Alembic · PostgreSQL 16 · Redis 7 · httpx · tenacity · pydantic-settings |
| Extension | Manifest V3 · React 18 · TypeScript 5 · Vite + CRXJS · Tailwind CSS · Zustand |
| Auth/Sec | JWT · AES-256-GCM · TLS 1.3 · 카카오 OAuth (Phase 2) |
| Flight API | Duffel (Phase 1) · Kiwi Tequila · Amadeus (Phase 2+) |
| Infra | Docker Compose (로컬) · Railway (배포, Phase 2) |

## 핵심 도메인 규칙 — 반드시 지킬 것

Claude가 쉽게 틀릴 수 있는 제약들:

1. **민감정보 저장 원칙**
   - 여권번호, 여권 만료일은 **서버 DB에만** 저장하며 AES-256-GCM으로 암호화 (`app/core/security.py`)
   - `chrome.storage.sync` 에는 여권번호를 **절대** 저장하지 않는다
   - 로그에 여권번호, 생년월일, 전화번호 원문을 출력하지 말 것 (마스킹 유틸 사용)

2. **결제 정보 비저장**
   - Zivo는 카드번호·CVC 등 결제 정보를 **직접 저장·처리하지 않는다**
   - 결제는 항공사/OTA 페이지로 리다이렉트하여 처리한다

3. **편도 조합은 별개 예약**
   - UI에 반드시 "두 편이 별개 예약이며 앞 편 지연 시 뒷 편 항공사 자동 보호가 적용되지 않는다"는 경고를 노출
   - `extension/src/popup` 의 편도 조합 탭에서 배너로 구현

4. **예약 직전 가격 재확인**
   - Redis 캐시 TTL은 5분
   - `POST /api/flights/book` 호출 시 Duffel로 실시간 재조회 → 캐시 대비 ±2% 초과 변동이면 프론트에 재확인 요구

5. **Phase 1 인증**
   - 카카오 OAuth는 Phase 2. Phase 1 은 익명 디바이스 ID (UUID, `chrome.storage.sync`) 로 프로필을 식별
   - 이 디바이스 ID 기반 데이터는 Phase 2 로그인 시 병합 마이그레이션 필요

## 개발 명령어

### 공통

```bash
docker-compose up -d        # postgres + redis 기동
docker-compose down         # 정지
```

### Backend

```bash
cd backend
uv sync                     # 또는 pip install -r requirements.txt
alembic upgrade head        # DB 마이그레이션
uvicorn app.main:app --reload
pytest                      # 테스트
ruff check . && mypy app    # lint + type check
```

### Extension

```bash
cd extension
npm install
npm run dev                 # Vite 개발 빌드 (watch)
npm run build               # 프로덕션 빌드 → dist/
npm test                    # vitest
```

크롬 로드: `chrome://extensions` → 개발자 모드 ON → `압축 해제된 확장 프로그램 로드` → `extension/dist` 선택.

## 코딩 컨벤션

- **Python**: ruff (format + lint), mypy strict, 함수 시그니처에 타입 힌트 필수
- **TypeScript**: eslint + prettier, `strict: true`, `any` 금지
- **커밋 메시지**: 기존 레포 스타일 유지 — `feat:`, `fix:`, `docs:`, `ci:`, `chore:` prefix
- **테스트**: 비즈니스 로직(`services/`) 과 API 라우터는 pytest 커버리지 필수
- **에러 처리**: 외부 API 호출은 `tenacity` 로 지수 백오프(최대 3회), 4xx/5xx는 구조화 로그로 남김

## 외부 API 키 관리

- 모든 비밀값은 `backend/.env` 에 보관 (`.env` 은 커밋 금지, `.env.example` 만 커밋)
- 필수 키:
  - `DATABASE_URL`, `REDIS_URL`
  - `DUFFEL_API_KEY` (Phase 1 필수)
  - `JWT_SECRET_KEY`, `AES_ENCRYPTION_KEY` (32바이트 base64)
  - `KIWI_API_KEY`, `AMADEUS_API_KEY`, `AMADEUS_API_SECRET` (Phase 2)
  - `KAKAO_CLIENT_ID`, `KAKAO_REDIRECT_URI`, `KAKAO_ALIMTALK_API_KEY` (Phase 2)

## 참고

- **세션 진척도: `plan.md`** — Day별 체크리스트, 완료 기준, Next 포인터
- Phase 1 상세 로드맵: `README.md` 의 "개발 로드맵" 섹션
- Duffel API 작업: `.claude/skills/duffel-search.md` 자동 로드
- 편도 조합 알고리즘: `.claude/skills/oneway-combo.md` 자동 로드
- 익스텐션 수동 테스트: `.claude/skills/ext-load-test.md`

## 세션 규약

- **시작**: `plan.md` 읽기 → 현재 Day 확인 → 해당 Day 체크리스트로 작업
- **종료**: 완료 항목 `[x]` 체크, 상단 진척 개요 표 업데이트, `Next:` 블록에 이어갈 지점 기록
- **커밋·푸시**: 각 Day 작업 완료 후 반드시 `git add → git commit → git push` 수행. 커밋 메시지는 `feat: Day N — <주제>` 형식, Co-Authored-By 포함.
