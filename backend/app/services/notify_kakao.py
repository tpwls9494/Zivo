"""카카오 알림톡 발송 — 키 없으면 로그만."""
from __future__ import annotations

import logging

from app.core.config import settings

logger = logging.getLogger(__name__)


async def send_kakao_alimtalk(
    phone: str, origin: str, destination: str, depart_date: str, price_krw: int
) -> None:
    if not settings.KAKAO_ALIMTALK_API_KEY:
        logger.info(
            "[STUB] 카카오 알림톡 → phone=%s %s→%s %s %s원",
            phone[:3] + "****",
            origin,
            destination,
            depart_date,
            f"{price_krw:,}",
        )
        return
    # TODO: 실제 알림톡 API 호출 (Phase 3+)
