from datetime import timedelta
from itertools import product

from app.schemas.flight import ComboOffer, NormalizedOffer

MIN_LAYOVER_AT_DEST = timedelta(hours=3)
MAX_RESULTS = 20


def _airports_compatible(arrival: str, departure: str) -> bool:
    # Phase 1: 정확히 같은 IATA만 허용 (공항 간 이동은 사용자 부담)
    return arrival == departure


def build_combos(
    outbound: list[NormalizedOffer],
    inbound: list[NormalizedOffer],
    baseline_roundtrip_krw: int | None,
) -> list[ComboOffer]:
    combos: list[ComboOffer] = []
    for out, back in product(outbound, inbound):
        if back.departure_at - out.arrival_at < MIN_LAYOVER_AT_DEST:
            continue

        if not _airports_compatible(out.arrival_iata, back.departure_iata):
            continue

        total = out.total_krw + back.total_krw
        savings = (baseline_roundtrip_krw or total) - total
        if baseline_roundtrip_krw is not None and savings <= 0:
            continue

        combos.append(
            ComboOffer(
                outbound=out,
                inbound=back,
                total_krw=total,
                savings_krw=max(savings, 0),
                savings_pct=(savings / baseline_roundtrip_krw * 100) if baseline_roundtrip_krw else 0.0,
                is_same_carrier=out.carrier_iata == back.carrier_iata,
            )
        )

    combos = [c for c in combos if not c.is_same_carrier]
    combos.sort(key=lambda c: c.total_krw)

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
