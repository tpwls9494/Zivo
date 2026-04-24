from __future__ import annotations

import uuid
from datetime import date, datetime

from pydantic import BaseModel, Field


class AlertIn(BaseModel):
    origin: str = Field(..., min_length=3, max_length=3)
    destination: str = Field(..., min_length=3, max_length=3)
    depart_date: date
    return_date: date | None = None
    target_krw: int = Field(..., gt=0)
    channel: str = "email"  # email | kakao
    notify_email: str | None = Field(default=None, max_length=256)


class AlertOut(BaseModel):
    id: uuid.UUID
    origin: str
    destination: str
    depart_date: date
    return_date: date | None
    target_krw: int
    channel: str
    enabled: bool
    last_notified_at: datetime | None

    model_config = {"from_attributes": True}


class AlertsListResponse(BaseModel):
    items: list[AlertOut]
