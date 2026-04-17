import hashlib
import json
from typing import Any

import redis.asyncio as aioredis

from app.core.config import settings

_redis: aioredis.Redis | None = None  # type: ignore[type-arg]


def _get_redis() -> aioredis.Redis:  # type: ignore[type-arg]
    global _redis
    if _redis is None:
        _redis = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
    return _redis


def make_search_key(origin: str, dest: str, depart: str, ret: str | None) -> str:
    raw = f"{origin}:{dest}:{depart}:{ret or ''}"
    digest = hashlib.md5(raw.encode()).hexdigest()
    return f"zivo:search:{digest}"


async def get_search_cache(key: str) -> dict[str, Any] | None:
    data = await _get_redis().get(key)
    if data is None:
        return None
    return json.loads(data)  # type: ignore[no-any-return]


async def set_search_cache(key: str, data: dict[str, Any]) -> None:
    await _get_redis().setex(key, settings.SEARCH_CACHE_TTL_SECONDS, json.dumps(data))
