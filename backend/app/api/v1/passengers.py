from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user_or_device
from app.core.security import decrypt_sensitive, encrypt_sensitive, mask_passport
from app.db.session import get_db
from app.models.passenger import Passenger
from app.models.user import User
from app.schemas.passenger import PassengerIn, PassengerOut

router = APIRouter()


def _to_out(p: Passenger) -> PassengerOut:
    masked: str | None = None
    if p.passport_number_enc:
        masked = mask_passport(decrypt_sensitive(p.passport_number_enc))
    return PassengerOut(
        id=p.id,
        nickname=p.nickname,
        passport_given_name=p.passport_given_name,
        passport_family_name=p.passport_family_name,
        birth_date=p.birth_date,
        gender=p.gender,
        nationality=p.nationality,
        phone=p.phone,
        passport_number_masked=masked,
        is_primary=p.is_primary,
    )


@router.get("", response_model=list[PassengerOut])
async def list_passengers(
    user: User = Depends(get_current_user_or_device),
    db: AsyncSession = Depends(get_db),
) -> list[PassengerOut]:
    rows = (
        await db.execute(
            select(Passenger)
            .where(Passenger.user_id == user.id)
            .order_by(Passenger.is_primary.desc(), Passenger.created_at)
        )
    ).scalars().all()
    return [_to_out(p) for p in rows]


@router.post("", response_model=PassengerOut, status_code=201)
async def create_passenger(
    payload: PassengerIn,
    user: User = Depends(get_current_user_or_device),
    db: AsyncSession = Depends(get_db),
) -> PassengerOut:
    # is_primary 설정 시 기존 primary 해제
    if payload.is_primary:
        existing = (
            await db.execute(
                select(Passenger).where(
                    Passenger.user_id == user.id, Passenger.is_primary.is_(True)
                )
            )
        ).scalars().all()
        for p in existing:
            p.is_primary = False

    # 첫 번째 탑승자는 자동으로 primary
    count = (
        await db.execute(
            select(Passenger).where(Passenger.user_id == user.id)
        )
    ).scalars().all()
    is_primary = payload.is_primary or len(count) == 0

    passenger = Passenger(
        user_id=user.id,
        nickname=payload.nickname,
        passport_given_name=payload.passport_given_name.strip().upper(),
        passport_family_name=payload.passport_family_name.strip().upper(),
        birth_date=payload.birth_date,
        gender=payload.gender,
        nationality=payload.nationality.upper(),
        phone=payload.phone.strip(),
        is_primary=is_primary,
    )
    if payload.passport_number:
        passenger.passport_number_enc = encrypt_sensitive(payload.passport_number.strip())
    if payload.passport_expiry:
        passenger.passport_expiry_enc = encrypt_sensitive(payload.passport_expiry.isoformat())

    db.add(passenger)
    await db.commit()
    await db.refresh(passenger)
    return _to_out(passenger)


@router.put("/{passenger_id}", response_model=PassengerOut)
async def update_passenger(
    passenger_id: uuid.UUID,
    payload: PassengerIn,
    user: User = Depends(get_current_user_or_device),
    db: AsyncSession = Depends(get_db),
) -> PassengerOut:
    passenger = (
        await db.execute(
            select(Passenger).where(
                Passenger.id == passenger_id, Passenger.user_id == user.id
            )
        )
    ).scalar_one_or_none()
    if not passenger:
        raise HTTPException(status_code=404, detail="Passenger not found")

    if payload.is_primary and not passenger.is_primary:
        others = (
            await db.execute(
                select(Passenger).where(
                    Passenger.user_id == user.id, Passenger.is_primary.is_(True)
                )
            )
        ).scalars().all()
        for p in others:
            p.is_primary = False

    passenger.nickname = payload.nickname
    passenger.passport_given_name = payload.passport_given_name.strip().upper()
    passenger.passport_family_name = payload.passport_family_name.strip().upper()
    passenger.birth_date = payload.birth_date
    passenger.gender = payload.gender
    passenger.nationality = payload.nationality.upper()
    passenger.phone = payload.phone.strip()
    passenger.is_primary = payload.is_primary

    if payload.passport_number:
        passenger.passport_number_enc = encrypt_sensitive(payload.passport_number.strip())
    if payload.passport_expiry:
        passenger.passport_expiry_enc = encrypt_sensitive(payload.passport_expiry.isoformat())

    await db.commit()
    await db.refresh(passenger)
    return _to_out(passenger)


@router.delete("/{passenger_id}", status_code=204)
async def delete_passenger(
    passenger_id: uuid.UUID,
    user: User = Depends(get_current_user_or_device),
    db: AsyncSession = Depends(get_db),
) -> None:
    passenger = (
        await db.execute(
            select(Passenger).where(
                Passenger.id == passenger_id, Passenger.user_id == user.id
            )
        )
    ).scalar_one_or_none()
    if not passenger:
        raise HTTPException(status_code=404, detail="Passenger not found")
    await db.delete(passenger)
    await db.commit()
