---
name: duffel-search
description: Duffel API 를 호출하거나 디버깅할 때 로드. Offer Request → Offer 흐름, asyncio 병렬 패턴, 재시도·스키마 참고가 필요한 경우. backend/app/services/duffel.py 작업 시 자동 로드됨.
---

# Duffel Flight Search Skill

한국-일본 노선을 Duffel API 로 검색할 때 쓰는 패턴 모음.

## Duffel 호출 흐름

Duffel 은 **2단계** 호출 구조다:

1. `POST /air/offer_requests` — 출발지, 도착지, 날짜, 승객 정보를 올려 `offer_request_id` 수신 (수 초 소요)
2. `GET /air/offers?offer_request_id=...&sort=total_amount` — 해당 요청의 오퍼 리스트 조회

단일 왕복 검색도 두 번 호출해야 하므로 **반드시** `httpx.AsyncClient` 로 비동기 처리.

## 기본 클라이언트 (backend/app/services/duffel.py)

```python
import httpx
from app.core.config import settings

DUFFEL_BASE = "https://api.duffel.com"
HEADERS = {
    "Authorization": f"Bearer {settings.DUFFEL_API_KEY}",
    "Duffel-Version": "v2",
    "Content-Type": "application/json",
    "Accept-Encoding": "gzip",
}

async def create_offer_request(client: httpx.AsyncClient, origin: str, dest: str,
                                depart: str, ret: str | None, adults: int = 1) -> str:
    slices = [{"origin": origin, "destination": dest, "departure_date": depart}]
    if ret:
        slices.append({"origin": dest, "destination": origin, "departure_date": ret})
    payload = {
        "data": {
            "slices": slices,
            "passengers": [{"type": "adult"}] * adults,
            "cabin_class": "economy",
        }
    }
    r = await client.post(f"{DUFFEL_BASE}/air/offer_requests", json=payload, headers=HEADERS)
    r.raise_for_status()
    return r.json()["data"]["id"]

async def list_offers(client: httpx.AsyncClient, offer_request_id: str, limit: int = 50) -> list[dict]:
    r = await client.get(
        f"{DUFFEL_BASE}/air/offers",
        params={"offer_request_id": offer_request_id, "sort": "total_amount", "limit": limit},
        headers=HEADERS,
    )
    r.raise_for_status()
    return r.json()["data"]
```

## 병렬 호출 (편도 조합 검색)

편도 조합을 만들려면 **가는편** 과 **오는편** 을 각각 **편도 Offer Request** 로 따로 호출해야 한다. 왕복 Offer Request 의 오퍼는 같은 항공사 쌍으로 묶이기 때문.

```python
import asyncio

async def search_oneway_pair(origin: str, dest: str, depart: str, ret: str):
    async with httpx.AsyncClient(timeout=30.0) as client:
        out_id, ret_id = await asyncio.gather(
            create_offer_request(client, origin, dest, depart, None),
            create_offer_request(client, dest, origin, ret, None),
        )
        outbound, inbound = await asyncio.gather(
            list_offers(client, out_id),
            list_offers(client, ret_id),
        )
        return outbound, inbound
```

## 재시도 전략 (tenacity)

Duffel 은 burst 제한과 5xx 를 간헐적으로 돌려준다. 네트워크·5xx·429 만 재시도, 4xx 는 즉시 실패.

```python
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential
from httpx import HTTPStatusError, TransportError

def _is_retryable(e: BaseException) -> bool:
    if isinstance(e, TransportError):
        return True
    if isinstance(e, HTTPStatusError):
        return e.response.status_code >= 500 or e.response.status_code == 429
    return False

@retry(
    retry=retry_if_exception_type((TransportError, HTTPStatusError)),
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=0.5, min=0.5, max=4),
    reraise=True,
)
async def list_offers_with_retry(client, offer_request_id):
    return await list_offers(client, offer_request_id)
```

## 정규화된 응답 스키마

Duffel 원본 응답은 크다. 프론트에 넘기기 전에 아래로 축소:

```python
class NormalizedOffer(BaseModel):
    offer_id: str              # Duffel offer.id — 예약 시 재사용
    carrier: str               # "피치항공" 등 한글명 매핑 필요
    carrier_iata: str          # "MM"
    departure_iata: str        # "ICN"
    arrival_iata: str          # "KIX"
    departure_at: datetime     # UTC → Asia/Seoul 변환 필요
    arrival_at: datetime
    duration_minutes: int
    stops: int
    baggage_checked_kg: int    # 0 이면 무료 수하물 없음
    total_krw: int             # total_amount 가 KRW 면 그대로, 아니면 환율 적용
```

## Phase 1 스코프 주의사항

- **지원 노선**: ICN ↔ { KIX, NRT, HND, FUK, CTS, KMI } 6개만. 그 외는 프론트에서 차단.
- **지원 항공사**: Duffel 이 주는 것만. 피치·제트스타는 Duffel 에 없을 수 있음 → Phase 2 공식 파트너 연동.
- **통화**: Duffel 요청 시 `currency: "KRW"` 명시. KRW 미지원 항공사는 결과에서 제외.
- **다구간/수하물 옵션**: Phase 1 은 무시, 화면에는 "기본 운임" 만 표시.

## 예약 직전 가격 재확인

캐시된 offer_id 로 예약하기 전 반드시:

```python
# offer_id 로 단건 조회
r = await client.get(f"{DUFFEL_BASE}/air/offers/{offer_id}", headers=HEADERS)
fresh = r.json()["data"]
if abs(fresh["total_amount"] - cached_price) / cached_price > 0.02:
    raise PriceChangedError(fresh["total_amount"])
```

## 테스트

- Duffel sandbox 모드 (`DUFFEL_API_KEY` 가 `duffel_test_` 로 시작) 에서는 결제가 실제로 일어나지 않는다
- unit test 는 `respx` 로 `httpx` 응답을 모킹, fixture 는 `backend/tests/fixtures/duffel_*.json`
- integration test 는 sandbox 실호출, `@pytest.mark.integration` 마크 후 CI 에서 분리 실행

## 자주 마주치는 에러

| 에러 | 원인 | 대응 |
|---|---|---|
| 422 `invalid_airport` | ICN/KIX 등 IATA 오타 | 입력 검증 레이어에서 차단 |
| 429 `rate_limited` | 병렬 호출 과다 | `asyncio.Semaphore(10)` 로 동시성 제한 |
| offer_request 에 offer 0개 | 날짜가 과거거나 해당일 운항 없음 | 프론트에 "해당 날짜 운항 없음" 표시 |
| offer 의 `expires_at` 지남 | offer 생성 후 30분 이상 경과 | offer_request 재생성 필요 |
