"""APScheduler — 6시간마다 가격 알림 체크."""
from __future__ import annotations

import logging

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

logger = logging.getLogger(__name__)

_scheduler = AsyncIOScheduler()


def start_scheduler() -> None:
    from app.services.alerts import check_all_alerts

    _scheduler.add_job(
        check_all_alerts,
        trigger=IntervalTrigger(hours=6),
        id="price_alert_check",
        replace_existing=True,
        max_instances=1,
    )
    _scheduler.start()
    logger.info("스케줄러 시작 — 가격 알림 6h 주기")


def stop_scheduler() -> None:
    if _scheduler.running:
        _scheduler.shutdown(wait=False)
        logger.info("스케줄러 종료")
