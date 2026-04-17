from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class UserDefaultIn(BaseModel):
    default_origin: str = Field(default="ICN", min_length=3, max_length=3)
    preferred_cabin: Literal["economy", "premium_economy", "business", "first"] = "economy"
    adults: int = Field(default=1, ge=1, le=9)
    baggage_preference: Literal["carry_only", "checked", "any"] = "any"


class UserDefaultOut(UserDefaultIn):
    pass
