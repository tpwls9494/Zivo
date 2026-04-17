---
name: oneway-combo
description: 편도 조합 최저가 알고리즘 (backend/app/services/combo.py) 작업 시 로드. 가는편·오는편 카티전 곱에서 비호환 조합 제거, 절약액 계산, 중복 왕복 제거 로직.
---

# One-Way Combo Pricing Skill

서로 다른 항공사의 편도 티켓을 조합해 **실제 최저가** 를 찾는 알고리즘.

## 문제 정의

- 입력:
  - `outbound_offers: list[NormalizedOffer]` — 가는편 편도 오퍼 (Duffel oneway Offer Request 결과)
  - `inbound_offers: list[NormalizedOffer]` — 오는편 편도 오퍼
  - `baseline_roundtrip_krw: int` — 같은 구간 왕복 Offer Request 최저가 (절약액 기준)
- 출력: `list[ComboOffer]` — 합산가 오름차순 정렬, 상위 N개 (기본 20)

## ComboOffer 스키마

```python
class ComboOffer(BaseModel):
    outbound: NormalizedOffer
    inbound: NormalizedOffer
    total_krw: int
    savings_krw: int          # baseline_roundtrip_krw - total_krw (음수면 저장 안함)
    savings_pct: float        # savings_krw / baseline_roundtrip_krw * 100
    is_same_carrier: bool     # 같은 항공사면 굳이 조합 안 보여줌 (왕복이 보통 더 쌈)
```

## 핵심 로직 (backend/app/services/combo.py)

```python
from itertools import product
from datetime import timedelta

MIN_LAYOVER_AT_DEST = timedelta(hours=3)   # 공항 체류 최소
MAX_RESULTS = 20

def build_combos(
    outbound: list[NormalizedOffer],
    inbound: list[NormalizedOffer],
    baseline_roundtrip_krw: int | None,
) -> list[ComboOffer]:
    combos: list[ComboOffer] = []
    for out, back in product(outbound, inbound):
        # 1. 시간 제약: 가는편 도착 < 오는편 출발, 최소 체류 보장
        if back.departure_at - out.arrival_at < MIN_LAYOVER_AT_DEST:
            continue

        # 2. 도착·출발 공항 일치 (ICN→KIX 후 KIX→ICN. 복수 공항 도시 주의: NRT/HND, KIX/ITM)
        if not _airports_compatible(out.arrival_iata, back.departure_iata):
            continue

        total = out.total_krw + back.total_krw
        savings = (baseline_roundtrip_krw or total) - total
        if baseline_roundtrip_krw is not None and savings <= 0:
            continue  # 왕복이 더 싸거나 같으면 조합 의미 없음

        combos.append(ComboOffer(
            outbound=out,
            inbound=back,
            total_krw=total,
            savings_krw=max(savings, 0),
            savings_pct=(savings / baseline_roundtrip_krw * 100) if baseline_roundtrip_krw else 0.0,
            is_same_carrier=out.carrier_iata == back.carrier_iata,
        ))

    # 3. 같은 항공사 조합 제외 (왕복이 보통 더 쌈. 만약 더 싸더라도 UX 혼란)
    combos = [c for c in combos if not c.is_same_carrier]

    # 4. 합산가 오름차순
    combos.sort(key=lambda c: c.total_krw)

    # 5. 동일 항공사 쌍 중복 제거 (예: 피치+제주 조합이 3개 있으면 최저 1개만)
    seen: set[tuple[str, str]] = set()
    uniq: list[ComboOffer] = []
    for c in combos:
        key = (c.outbound.carrier_iata, c.inbound.carrier_iata)
        if key in seen:
            continue
        seen.add(key)
        uniq.append(c)
        if len(uniq) >= MAX_RESULTS:
            break
    return uniq
```

## 공항 호환성

일본 측은 도시당 복수 공항이 있어 단순 IATA 일치로는 부족:

```python
AIRPORT_CITY = {
    "NRT": "TYO", "HND": "TYO",
    "KIX": "OSA", "ITM": "OSA",
    "KMI": "FUK",  # 참고: 실제로 KMI 는 미야자키, FUK 는 후쿠오카 — 예시일 뿐
}

def _airports_compatible(arrival: str, departure: str) -> bool:
    if arrival == departure:
        return True
    # Phase 1: 같은 IATA 만 허용. 도시간 이동(NRT↔HND)은 사용자에게 부담이므로 제외.
    return False
```

**Phase 1 결정**: 공항 간 이동은 번거로우므로 정확히 **같은 IATA** 만 조합. NRT 도착 → HND 출발 같은 조합은 제외한다. Phase 2 에서 사용자 선호로 확장.

## 절약액이 0 인 조합

- `baseline_roundtrip_krw` 가 없으면 (왕복 검색 실패 등) 모든 조합을 보여주되 `savings_krw=0, savings_pct=0.0`
- `baseline_roundtrip_krw` 가 있으면 `total < baseline` 인 조합만 통과 (위 로직)

## 정렬 기준

- 기본: 합산가 오름차순
- 향후 옵션 (Phase 2): 절약액 내림차순, 총 비행시간 오름차순

## 테스트 시나리오

```python
def test_filter_insufficient_layover():
    """가는편 도착과 오는편 출발 간격이 3시간 미만이면 제외."""

def test_drop_same_carrier_combo():
    """같은 항공사 조합은 결과에 없어야 한다."""

def test_dedupe_carrier_pair():
    """피치+제주 조합이 여러 시간대로 있으면 최저가 하나만 남긴다."""

def test_no_savings_dropped_when_baseline_given():
    """baseline 왕복가가 있는 경우 절약 없는 조합은 제외."""

def test_combo_sorted_by_total_price():
    """출력은 total_krw 오름차순."""
```

픽스처: `backend/tests/fixtures/offers_icn_kix_2026_05.json` 에 실제 Duffel sandbox 응답을 저장해두고 사용.

## UI 쪽 주의 (extension 편도 조합 탭)

- 모든 조합 카드 상단에 **"두 편이 별개 예약입니다. 앞 편 지연 시 뒷 편 항공사의 자동 보호가 적용되지 않습니다."** 배너 필수
- 조합 내 각 편의 항공사 로고·편명·시간·수하물을 모두 노출
- `savings_pct >= 20%` 이면 초록색 하이라이트
