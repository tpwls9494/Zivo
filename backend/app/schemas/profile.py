from __future__ import annotations

from datetime import date
from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.user_default import UserDefaultIn, UserDefaultOut


class ProfileIn(BaseModel):
    passport_given_name: str = Field(min_length=1, max_length=64)
    passport_family_name: str = Field(min_length=1, max_length=64)
    birth_date: date
    gender: Literal["M", "F"]
    nationality: str = Field(default="KOR", min_length=3, max_length=3)
    phone: str = Field(min_length=1, max_length=32)
    passport_number: str | None = Field(default=None, min_length=6, max_length=20)
    passport_expiry: date | None = None
    defaults: UserDefaultIn | None = None


class ProfileOut(BaseModel):
    passport_given_name: str
    passport_family_name: str
    birth_date: date
    gender: Literal["M", "F"]
    nationality: str
    phone: str
    # 여권번호는 서버에만 AES 로 저장. 응답에는 마스킹된 값만 노출.
    passport_number_masked: str | None = None
    passport_expiry: date | None = None
    defaults: UserDefaultOut | None = None


class EmptyProfileOut(BaseModel):
    exists: Literal[False] = False
    defaults: UserDefaultOut
