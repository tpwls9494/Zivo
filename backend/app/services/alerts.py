"""가격 알림 체크 서비스."""
from __future__ import annotations

import logging
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.price_alert import PriceAlert
from app.models.user_profile import UserProfile
from app.services.notify_email import send_email
from app.services.notify_kakao import send_kakao_alimtalk

logger = logging.getLogger(__name__)


async def check_alert(db: AsyncSession, alert: PriceAlert) -> bool:
    """단일 알림 체크 — 현재가 ≤ target_krw 이면 알림 발송 후 True 반환."""
    from app.services.duffel import search_roundtrip, search_oneway  # 순환 방지 local import

    try:
        depart = alert.depart_date.isoformat()
        ret = alert.return_date.isoformat() if alert.return_date else None

        if ret:
            offers = await search_roundtrip(alert.origin, alert.destination, depart, ret)
        else:
            offers = await search_oneway(alert.origin, alert.destination, depart)

        if not offers:
            return False

        min_price = min(o.total_krw for o in offers)
        alert.last_checked_at = datetime.now(UTC)

        if min_price <= alert.target_krw:
            await _notify(db, alert, min_price)
            alert.last_notified_at = datetime.now(UTC)
            return True

    except Exception:
        logger.exception("alert:%s 체크 실패", alert.id)

    return False


async def _notify(db: AsyncSession, alert: PriceAlert, price_krw: int) -> None:
    profile = (
        await db.execute(
            select(UserProfile).where(UserProfile.user_id == alert.user_id)
        )
    ).scalar_one_or_none()

    depart_str = alert.depart_date.isoformat()

    if alert.channel == "kakao" and profile and profile.phone:
        await send_kakao_alimtalk(profile.phone, alert.origin, alert.destination, depart_str, price_krw)
    else:
        # notify_email 우선, 없으면 user.email 폴백
        email = alert.notify_email
        if not email:
            from app.models.user import User
            user = await db.get(User, alert.user_id)
            email = user.email if user else None
        if email:
            await send_email(email, alert.origin, alert.destination, depart_str, price_krw)
        else:
            logger.info("alert:%s 알림 채널 없음 (이메일 미등록)", alert.id)


async def check_all_alerts() -> None:
    """스케줄러에서 호출 — 모든 활성 알림 순회 체크."""
    from app.db.session import AsyncSessionLocal

    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(PriceAlert).where(PriceAlert.enabled == True)  # noqa: E712
        )
        alerts = result.scalars().all()
        logger.info("가격 알림 체크 시작: %d건", len(alerts))

        for alert in alerts:
            triggered = await check_alert(db, alert)
            if triggered:
                logger.info("alert:%s 트리거 — %s→%s", alert.id, alert.origin, alert.destination)

        await db.commit()
        logger.info("가격 알림 체크 완료")
