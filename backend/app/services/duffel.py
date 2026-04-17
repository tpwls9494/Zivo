"""Duffel API client. 상세 구현은 Day 3. 지금은 자리표시자."""

from app.core.config import settings

DUFFEL_BASE = "https://api.duffel.com"
HEADERS = {
    "Authorization": f"Bearer {settings.DUFFEL_API_KEY}" if settings.DUFFEL_API_KEY else "",
    "Duffel-Version": "v2",
    "Content-Type": "application/json",
    "Accept-Encoding": "gzip",
}


async def search_roundtrip(origin: str, destination: str, depart: str, ret: str) -> list[dict]:
    """Day 3 에서 구현."""
    return []


async def search_oneway_pair(
    origin: str, destination: str, depart: str, ret: str
) -> tuple[list[dict], list[dict]]:
    """Day 3 에서 구현. 가는편·오는편 병렬 호출."""
    return [], []
