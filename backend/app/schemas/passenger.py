import uuid
from datetime import date

from pydantic import BaseModel, Field


class PassengerIn(BaseModel):
    nickname: str = Field(default="나", max_length=32)
    passport_given_name: str = Field(..., max_length=64)
    passport_family_name: str = Field(..., max_length=64)
    birth_date: date
    gender: str = Field(..., pattern="^[MF]$")
    nationality: str = Field(default="KOR", max_length=3)
    phone: str = Field(..., max_length=32)
    passport_number: str | None = Field(default=None, max_length=20)
    passport_expiry: date | None = None
    is_primary: bool = False


class PassengerOut(BaseModel):
    id: uuid.UUID
    nickname: str
    passport_given_name: str
    passport_family_name: str
    birth_date: date
    gender: str
    nationality: str
    phone: str
    passport_number_masked: str | None
    is_primary: bool

    model_config = {"from_attributes": True}
