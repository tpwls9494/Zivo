"""이메일 알림 발송 스텁."""
from __future__ import annotations

import logging

logger = logging.getLogger(__name__)


async def send_email(
    to: str, origin: str, destination: str, depart_date: str, price_krw: int
) -> None:
    logger.info(
        "[STUB] 이메일 알림 → %s %s→%s %s %s원",
        to,
        origin,
        destination,
        depart_date,
        f"{price_krw:,}",
    )
    # TODO: SMTP 실제 구현 (Phase 3+)
