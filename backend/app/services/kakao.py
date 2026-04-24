"""카카오 OAuth 서비스 — code → KakaoUser."""
from __future__ import annotations

from dataclasses import dataclass

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

from app.core.config import settings

_TOKEN_URL = "https://kauth.kakao.com/oauth/token"
_ME_URL = "https://kapi.kakao.com/v2/user/me"


@dataclass
class KakaoUser:
    kakao_id: str
    email: str | None
    nickname: str | None


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=1, max=4))
async def exchange_code(code: str) -> KakaoUser:
    """authorization code → KakaoUser. 실패 시 최대 3회 재시도."""
    async with httpx.AsyncClient(timeout=10.0) as client:
        token_res = await client.post(
            _TOKEN_URL,
            data={
                "grant_type": "authorization_code",
                "client_id": settings.KAKAO_CLIENT_ID,
                "client_secret": settings.KAKAO_CLIENT_SECRET,
                "redirect_uri": settings.KAKAO_REDIRECT_URI,
                "code": code,
            },
        )
        token_res.raise_for_status()
        access_token: str = token_res.json()["access_token"]

        me_res = await client.get(
            _ME_URL,
            headers={"Authorization": f"Bearer {access_token}"},
        )
        me_res.raise_for_status()
        data = me_res.json()

    kakao_account = data.get("kakao_account", {})
    return KakaoUser(
        kakao_id=str(data["id"]),
        email=kakao_account.get("email"),
        nickname=data.get("properties", {}).get("nickname"),
    )
