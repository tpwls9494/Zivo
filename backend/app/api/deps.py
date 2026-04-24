"""공통 FastAPI 의존성."""
from __future__ import annotations

import uuid

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.user import User
from app.services.user import get_or_create_user


async def get_current_user_or_device(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> User:
    """JWT 쿠키(카카오 로그인) → X-Device-Id(익명) 순으로 유저를 식별한다."""
    token = request.cookies.get("zivo_token")
    if token:
        try:
            payload = decode_access_token(token)
            user = await db.get(User, uuid.UUID(payload["sub"]))
            if user:
                return user
        except Exception:
            pass

    device_id = request.headers.get("X-Device-Id")
    if device_id:
        return await get_or_create_user(db, device_id)

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="로그인 또는 X-Device-Id 헤더가 필요합니다",
    )
