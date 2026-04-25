from __future__ import annotations

import uuid

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.booking import Booking
from app.models.passenger import Passenger
from app.models.price_alert import PriceAlert
from app.models.user import User
from app.models.user_default import UserDefault
from app.models.user_profile import UserProfile


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


async def get_or_create_kakao_user(
    db: AsyncSession,
    kakao_id: str,
    email: str | None,
    nickname: str | None,
) -> User:
    """카카오 ID 로 유저 조회·생성. 이미 있으면 email 업데이트."""
    result = await db.execute(select(User).where(User.kakao_id == kakao_id))
    user = result.scalar_one_or_none()
    if user is not None:
        if email and user.email != email:
            user.email = email
        return user
    user = User(device_id=f"kakao:{kakao_id}", kakao_id=kakao_id, email=email)
    db.add(user)
    await db.flush()
    return user


async def merge_device_to_user(
    db: AsyncSession, device_id: str, target_user_id: uuid.UUID
) -> None:
    """device_id 기반 익명 유저 데이터를 카카오 유저로 이전 후 익명 유저 삭제."""
    result = await db.execute(select(User).where(User.device_id == device_id))
    device_user = result.scalar_one_or_none()
    if device_user is None or device_user.id == target_user_id:
        return

    src_id = device_user.id

    # 예약·알림·탑승자 — 제약 없으므로 전부 이전
    await db.execute(update(Booking).where(Booking.user_id == src_id).values(user_id=target_user_id))
    await db.execute(update(PriceAlert).where(PriceAlert.user_id == src_id).values(user_id=target_user_id))
    await db.execute(update(Passenger).where(Passenger.user_id == src_id).values(user_id=target_user_id))

    # 프로필·기본값은 UNIQUE 제약 — 카카오 유저에 없을 때만 이전
    target_has_profile = (
        await db.execute(select(UserProfile.id).where(UserProfile.user_id == target_user_id))
    ).scalar_one_or_none()
    if target_has_profile is None:
        await db.execute(
            update(UserProfile).where(UserProfile.user_id == src_id).values(user_id=target_user_id)
        )

    target_has_defaults = (
        await db.execute(select(UserDefault.id).where(UserDefault.user_id == target_user_id))
    ).scalar_one_or_none()
    if target_has_defaults is None:
        await db.execute(
            update(UserDefault).where(UserDefault.user_id == src_id).values(user_id=target_user_id)
        )

    await db.delete(device_user)
    await db.flush()
