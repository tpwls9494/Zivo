"""카카오 OAuth 엔드포인트."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import create_access_token, decode_access_token
from app.db.session import get_db
from app.services.kakao import KakaoUser, exchange_code
from app.services.user import get_or_create_kakao_user, merge_device_to_user

router = APIRouter()

_COOKIE_KEY = "zivo_token"
_COOKIE_MAX_AGE = 60 * 60 * 24 * 7  # 7일


class ExchangeRequest(BaseModel):
    code: str
    device_id: str | None = None  # 익명 유저 병합용


class AuthMeResponse(BaseModel):
    user_id: str
    kakao_id: str | None = None
    email: str | None = None
    nickname: str | None = None
    is_kakao_user: bool
    token: str | None = None  # exchange 엔드포인트에서만 반환 (Route Handler가 쿠키 직접 설정용)


def _set_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=_COOKIE_KEY,
        value=token,
        httponly=True,
        samesite="lax",
        secure=settings.ENVIRONMENT != "development",
        max_age=_COOKIE_MAX_AGE,
    )


@router.post("/kakao/exchange", response_model=AuthMeResponse)
async def kakao_exchange(
    body: ExchangeRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> AuthMeResponse:
    """카카오 authorization code → JWT 쿠키 발급."""
    try:
        kakao: KakaoUser = await exchange_code(body.code)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"카카오 인증 실패: {exc}",
        )

    user = await get_or_create_kakao_user(db, kakao.kakao_id, kakao.email, kakao.nickname)

    if body.device_id:
        await merge_device_to_user(db, body.device_id, user.id)

    await db.commit()

    token = create_access_token(
        subject=str(user.id),
        extra={
            "kakao_id": kakao.kakao_id,
            "email": kakao.email,
            "nickname": kakao.nickname,
        },
    )
    _set_cookie(response, token)

    return AuthMeResponse(
        user_id=str(user.id),
        kakao_id=kakao.kakao_id,
        email=kakao.email,
        nickname=kakao.nickname,
        is_kakao_user=True,
        token=token,  # Route Handler가 자체 쿠키 설정에 사용
    )


@router.get("/me", response_model=AuthMeResponse)
async def auth_me(request: Request) -> AuthMeResponse:
    """현재 로그인 상태 조회 (쿠키 기반)."""
    token = request.cookies.get(_COOKIE_KEY)
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="로그인이 필요합니다")
    try:
        payload = decode_access_token(token)
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="유효하지 않은 토큰입니다")

    return AuthMeResponse(
        user_id=payload["sub"],
        kakao_id=payload.get("kakao_id"),
        email=payload.get("email"),
        nickname=payload.get("nickname"),
        is_kakao_user=bool(payload.get("kakao_id")),
    )


@router.post("/logout")
async def logout(response: Response) -> dict[str, bool]:
    """JWT 쿠키 삭제."""
    response.delete_cookie(_COOKIE_KEY, httponly=True, samesite="lax")
    return {"ok": True}
