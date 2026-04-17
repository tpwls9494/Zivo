import uuid
from datetime import datetime

from pydantic import BaseModel

from app.schemas.flight import NormalizedOffer


class BookRequest(BaseModel):
    offer: NormalizedOffer
    direction: str = "roundtrip"  # "roundtrip" | "outbound" | "inbound"
    combo_inbound: NormalizedOffer | None = None
    combo_group_id: uuid.UUID | None = None


class BookingDetail(BaseModel):
    booking_id: uuid.UUID
    direction: str
    deep_link_url: str
    combo_group_id: uuid.UUID | None = None


class BookResponse(BaseModel):
    bookings: list[BookingDetail]


class BookingItem(BaseModel):
    id: uuid.UUID
    direction: str
    carrier_iata: str
    origin: str
    destination: str
    departure_at: datetime
    arrival_at: datetime
    total_krw: int
    status: str
    combo_group_id: uuid.UUID | None = None
    created_at: datetime | None = None


class BookingsListResponse(BaseModel):
    items: list[BookingItem]
