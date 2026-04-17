from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User


async def get_or_create_user(db: AsyncSession, device_id: str) -> User:
    """Phase 1: 익명 디바이스 ID 로 유저 조회·생성. Phase 2 카카오 로그인과 독립."""
    if not device_id:
        raise ValueError("device_id is required")
    result = await db.execute(select(User).where(User.device_id == device_id))
    user = result.scalar_one_or_none()
    if user is not None:
        return user
    user = User(device_id=device_id)
    db.add(user)
    await db.flush()
    return user
