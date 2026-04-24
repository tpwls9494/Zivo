from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user_or_device
from app.db.session import get_db
from app.models.price_alert import PriceAlert
from app.models.user import User
from app.schemas.alert import AlertIn, AlertOut, AlertsListResponse

router = APIRouter()


@router.get("", response_model=AlertsListResponse)
async def list_alerts(
    user: User = Depends(get_current_user_or_device),
    db: AsyncSession = Depends(get_db),
) -> AlertsListResponse:
    result = await db.execute(
        select(PriceAlert)
        .where(PriceAlert.user_id == user.id)
        .order_by(PriceAlert.depart_date)
    )
    return AlertsListResponse(items=result.scalars().all())


@router.post("", response_model=AlertOut, status_code=status.HTTP_201_CREATED)
async def create_alert(
    body: AlertIn,
    user: User = Depends(get_current_user_or_device),
    db: AsyncSession = Depends(get_db),
) -> AlertOut:
    alert = PriceAlert(
        user_id=user.id,
        origin=body.origin.upper(),
        destination=body.destination.upper(),
        depart_date=body.depart_date,
        return_date=body.return_date,
        target_krw=body.target_krw,
        channel=body.channel,
    )
    db.add(alert)
    await db.commit()
    await db.refresh(alert)
    return alert


@router.delete("/{alert_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_alert(
    alert_id: uuid.UUID,
    user: User = Depends(get_current_user_or_device),
    db: AsyncSession = Depends(get_db),
) -> None:
    alert = await db.get(PriceAlert, alert_id)
    if not alert or alert.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="알림을 찾을 수 없습니다")
    await db.delete(alert)
    await db.commit()
