"""Gmail SMTP 이메일 알림 발송."""
from __future__ import annotations

import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import aiosmtplib

from app.core.config import settings

logger = logging.getLogger(__name__)

_WEBAPP_URL = "https://zivo-extension.vercel.app"


def _build_message(to: str, origin: str, destination: str, depart_date: str, price_krw: int) -> MIMEMultipart:
    search_url = f"{_WEBAPP_URL}/search?origin={origin}&destination={destination}&depart={depart_date}"

    html = f"""
<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
  <h2 style="color:#2563EB;margin-bottom:4px">✈ Zivo 가격 알림</h2>
  <p style="color:#6b7280;font-size:14px;margin-top:0">설정하신 목표가가 달성되었습니다!</p>
  <div style="background:#f0f7ff;border-radius:12px;padding:20px;margin:20px 0">
    <p style="margin:0 0 8px;font-size:18px;font-weight:700;color:#111827">{origin} → {destination}</p>
    <p style="margin:0 0 4px;color:#374151">출발일: {depart_date}</p>
    <p style="margin:0;font-size:22px;font-weight:800;color:#2563EB">₩{price_krw:,}</p>
  </div>
  <a href="{search_url}" style="display:inline-block;background:#2563EB;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:15px">
    지금 예약하기 →
  </a>
  <p style="margin-top:24px;font-size:12px;color:#9ca3af">
    Zivo 가격 알림 설정에 의해 발송되었습니다.<br>
    <a href="{_WEBAPP_URL}/alerts" style="color:#6b7280">알림 설정에서 삭제</a>
  </p>
</div>
"""

    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"[Zivo] {origin}→{destination} 목표가 달성! ₩{price_krw:,}"
    msg["From"] = settings.SMTP_FROM or settings.SMTP_USER
    msg["To"] = to
    msg.attach(MIMEText(html, "html", "utf-8"))
    return msg


async def send_email(
    to: str, origin: str, destination: str, depart_date: str, price_krw: int
) -> None:
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.info(
            "[STUB] 이메일 알림 → %s %s→%s %s ₩%s (SMTP 미설정)",
            to, origin, destination, depart_date, f"{price_krw:,}",
        )
        return

    msg = _build_message(to, origin, destination, depart_date, price_krw)
    try:
        await aiosmtplib.send(
            msg,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USER,
            password=settings.SMTP_PASSWORD,
            start_tls=True,
        )
        logger.info("이메일 발송 완료 → %s (%s→%s ₩%s)", to, origin, destination, f"{price_krw:,}")
    except Exception:
        logger.exception("이메일 발송 실패 → %s", to)
