from fastapi import APIRouter, Depends
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user_or_device
from app.db.session import get_db
from app.models.booking import Booking
from app.models.user import User
from app.schemas.booking import BookingItem, BookingsListResponse

router = APIRouter()


@router.get("", response_model=BookingsListResponse)
async def list_bookings(
    user: User = Depends(get_current_user_or_device),
    db: AsyncSession = Depends(get_db),
) -> BookingsListResponse:
    result = await db.execute(
        select(Booking)
        .where(Booking.user_id == user.id)
        .order_by(desc(Booking.created_at))
        .limit(20)
    )
    rows = result.scalars().all()
    return BookingsListResponse(
        items=[
            BookingItem(
                id=b.id,
                direction=b.direction,
                carrier_iata=b.carrier_iata,
                origin=b.origin,
                destination=b.destination,
                departure_at=b.departure_at,
                arrival_at=b.arrival_at,
                total_krw=b.total_krw,
                status=b.status,
                combo_group_id=b.combo_group_id,
                created_at=b.created_at,
            )
            for b in rows
        ]
    )
