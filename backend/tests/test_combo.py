from datetime import datetime, timezone

import pytest

from app.schemas.flight import NormalizedOffer
from app.services.combo import build_combos


def _offer(
    offer_id: str,
    carrier_iata: str,
    dep_iata: str,
    arr_iata: str,
    departure_at: datetime,
    arrival_at: datetime,
    total_krw: int,
) -> NormalizedOffer:
    return NormalizedOffer(
        offer_id=offer_id,
        carrier=carrier_iata,
        carrier_iata=carrier_iata,
        departure_iata=dep_iata,
        arrival_iata=arr_iata,
        departure_at=departure_at,
        arrival_at=arrival_at,
        duration_minutes=int((arrival_at - departure_at).total_seconds() // 60),
        stops=0,
        baggage_checked_kg=0,
        total_krw=total_krw,
    )


def _dt(day: int, hour: int) -> datetime:
    return datetime(2026, 5, day, hour, 0, tzinfo=timezone.utc)


# 가는편: ICN→KIX, 오는편: KIX→ICN
OUT = _offer("out1", "7C", "ICN", "KIX", _dt(10, 8), _dt(10, 10), 80_000)
BACK = _offer("back1", "MM", "KIX", "ICN", _dt(17, 14), _dt(17, 16), 70_000)
BASELINE = 200_000


def test_basic_combo_found():
    combos = build_combos([OUT], [BACK], BASELINE)
    assert len(combos) == 1
    assert combos[0].total_krw == 150_000
    assert combos[0].savings_krw == 50_000


def test_filter_insufficient_layover():
    """가는편 도착 직후 오는편 출발 (< 3h) → 제외."""
    back_too_soon = _offer("back_soon", "MM", "KIX", "ICN", _dt(10, 11), _dt(10, 13), 70_000)
    combos = build_combos([OUT], [back_too_soon], BASELINE)
    assert combos == []


def test_drop_same_carrier_combo():
    """같은 항공사 조합은 결과에 없어야 한다."""
    same = _offer("back_same", "7C", "KIX", "ICN", _dt(17, 14), _dt(17, 16), 70_000)
    combos = build_combos([OUT], [same], BASELINE)
    assert combos == []


def test_no_savings_dropped_when_baseline_given():
    """합산가 >= baseline → 절약 없으면 제외."""
    expensive_back = _offer("back_exp", "MM", "KIX", "ICN", _dt(17, 14), _dt(17, 16), 130_000)
    combos = build_combos([OUT], [expensive_back], BASELINE)
    assert combos == []


def test_no_savings_included_when_no_baseline():
    """baseline 없으면 절약 여부 무관하게 포함."""
    combos = build_combos([OUT], [BACK], None)
    assert len(combos) == 1
    assert combos[0].savings_krw == 0
    assert combos[0].savings_pct == 0.0


def test_combo_sorted_by_total_price():
    """출력은 total_krw 오름차순."""
    out2 = _offer("out2", "BX", "ICN", "KIX", _dt(10, 9), _dt(10, 11), 90_000)
    back2 = _offer("back2", "OZ", "KIX", "ICN", _dt(17, 16), _dt(17, 18), 50_000)
    combos = build_combos([OUT, out2], [BACK, back2], BASELINE)
    prices = [c.total_krw for c in combos]
    assert prices == sorted(prices)


def test_dedupe_carrier_pair():
    """같은 항공사 쌍(7C+MM)이 여러 시간대로 있으면 최저가 하나만 남긴다."""
    out_cheap = _offer("out_cheap", "7C", "ICN", "KIX", _dt(10, 6), _dt(10, 8), 60_000)
    out_exp = _offer("out_exp", "7C", "ICN", "KIX", _dt(10, 9), _dt(10, 11), 80_000)
    back1 = _offer("back_mm1", "MM", "KIX", "ICN", _dt(17, 12), _dt(17, 14), 70_000)
    back2 = _offer("back_mm2", "MM", "KIX", "ICN", _dt(17, 15), _dt(17, 17), 75_000)
    combos = build_combos([out_cheap, out_exp], [back1, back2], BASELINE)
    carrier_pairs = [(c.outbound.carrier_iata, c.inbound.carrier_iata) for c in combos]
    assert carrier_pairs.count(("7C", "MM")) == 1


def test_airport_mismatch_excluded():
    """도착 공항과 출발 공항이 다르면 제외."""
    back_wrong_airport = _offer("back_hnd", "NH", "HND", "ICN", _dt(17, 14), _dt(17, 16), 60_000)
    combos = build_combos([OUT], [back_wrong_airport], BASELINE)
    assert combos == []
