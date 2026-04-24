# Zivo 디자인 시스템 — 프로젝트 통합 가이드

## 1. 패키지 설치

```bash
cd webapp
pnpm add clsx tailwind-merge
```

---

## 2. 파일 복사

아래 파일들을 그대로 복사해서 붙여넣으세요:

| 이 파일 | → 프로젝트 경로 |
|---|---|
| `globals.css` | `webapp/src/app/globals.css` (기존 파일 교체) |
| `tailwind.config.ts` | `webapp/tailwind.config.ts` (기존 파일 교체) |
| `lib/utils.ts` | `webapp/src/lib/utils.ts` |
| `components/ui/*` | `webapp/src/components/ui/` (폴더째로 복사) |

---

## 3. 컴포넌트 사용법

```tsx
import { Button, Badge, Card, Input, Select, Tabs, Banner, Spinner, ZivoLogo } from "@/components/ui";

// 버튼
<Button variant="primary">항공권 검색</Button>
<Button variant="success" size="sm">두 편 모두 예약</Button>
<Button variant="ghost" size="sm">취소</Button>

// 배지
<Badge variant="blue">왕복</Badge>
<Badge variant="green">confirmed</Badge>
<Badge variant="amber">⚠ 주의</Badge>

// 카드
<Card>...</Card>
<CardForm>...</CardForm>

// 인풋
<Input label="영문 성 (Family)" placeholder="LEE" />
<Select label="좌석">
  <option value="economy">이코노미</option>
</Select>

// 탭
<Tabs
  tabs={[
    { key: "basic", label: "기본" },
    { key: "combo", label: "더 싼 옵션", badge: 3 },
    { key: "calendar", label: "달력" },
  ]}
  onChange={(key) => setActiveTab(key)}
/>

// 배너
<Banner variant="warning">⚠️ 편도 조합은 별개의 예약입니다.</Banner>
<Banner variant="info">편도 조합 예약</Banner>
<Banner variant="danger">검색 중 오류가 발생했습니다.</Banner>
<Banner variant="success">저장됨 (15:30)</Banner>

// 로딩
<Spinner />
<FullPageSpinner />

// 로고
<ZivoLogo size={32} color="#2563EB" />
<ZivoLogo size={24} color="#fff" />   // 다크/브랜드 배경용
<ZivoWordmark height={24} />
```

---

## 4. Tailwind 클래스 변경 요약

기존 코드에서 자주 쓰이는 클래스들의 대응표:

| 기존 클래스 | 새 클래스 또는 컴포넌트 |
|---|---|
| `bg-blue-600 text-white rounded-xl py-3 font-semibold` | `<Button variant="primary">` |
| `bg-blue-600 text-white text-sm px-4 py-1.5 rounded-lg` | `<Button variant="primary" size="sm">` |
| `bg-green-600 ...` | `<Button variant="success" size="sm">` |
| `border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-blue-500` | `<Input>` or `<Select>` |
| `bg-white rounded-xl border border-gray-100 shadow-sm p-4` | `<Card>` |
| `bg-white rounded-2xl shadow p-5` | `<CardForm>` |
| `bg-blue-50 text-blue-800 rounded-xl p-4` | `<Banner variant="info">` |
| `bg-amber-50 border border-amber-200 ... text-amber-800` | `<Banner variant="warning">` |
| `w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin` | `<Spinner>` |

---

## 5. 색상 토큰 (Tailwind 클래스로 직접 사용)

```
bg-primary-DEFAULT    → #2563EB (파란 배경)
text-primary-DEFAULT  → #2563EB (파란 텍스트)
bg-primary-light      → #EFF6FF (연한 파란 배경)
bg-success-DEFAULT    → #16A34A (초록 배경)
bg-success-light      → #F0FDF4
text-fg-1             → #111827 (주요 텍스트)
text-fg-4             → #4B5563 (레이블)
text-fg-6             → #9CA3AF (플레이스홀더)
border-border         → #F3F4F6 (카드 테두리)
border-border-input   → #E5E7EB (인풋 테두리)
bg-surface            → #FFFFFF (흰 배경)
```
