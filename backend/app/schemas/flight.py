from datetime import datetime

from pydantic import BaseModel, Field


class NormalizedOffer(BaseModel):
    offer_id: str
    carrier: str
    carrier_iata: str
    departure_iata: str
    arrival_iata: str
    departure_at: datetime
    arrival_at: datetime
    duration_minutes: int
    stops: int
    baggage_checked_kg: int
    total_krw: int


class SearchRequest(BaseModel):
    origin: str = Field(..., min_length=3, max_length=3, pattern="^[A-Z]{3}$")
    destination: str = Field(..., min_length=3, max_length=3, pattern="^[A-Z]{3}$")
    departure_date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    return_date: str | None = Field(default=None, pattern=r"^\d{4}-\d{2}-\d{2}$")
    adults: int = Field(default=1, ge=1, le=9)


class SearchResponse(BaseModel):
    offers: list[NormalizedOffer]
    combos: list  # Day 4: list[ComboOffer]
    baseline_roundtrip_krw: int | None
    cached: bool = False
