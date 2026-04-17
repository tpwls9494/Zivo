from __future__ import annotations

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import encrypt_sensitive, mask_passport
from app.db.session import get_db
from app.models.user_default import UserDefault
from app.models.user_profile import UserProfile
from app.schemas.profile import EmptyProfileOut, ProfileIn, ProfileOut
from app.schemas.user_default import UserDefaultOut
from app.services.user import get_or_create_user

router = APIRouter()


def _require_device_id(x_device_id: str | None = Header(default=None, alias="X-Device-Id")) -> str:
    if not x_device_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="X-Device-Id header required"
        )
    return x_device_id


def _defaults_out(row: UserDefault) -> UserDefaultOut:
    return UserDefaultOut(
        default_origin=row.default_origin,
        preferred_cabin=row.preferred_cabin,  # type: ignore[arg-type]
        adults=row.adults,
        baggage_preference=row.baggage_preference,  # type: ignore[arg-type]
    )


@router.get("", response_model=ProfileOut | EmptyProfileOut, response_model_exclude_none=True)
async def get_profile(
    device_id: str = Depends(_require_device_id),
    db: AsyncSession = Depends(get_db),
) -> ProfileOut | EmptyProfileOut:
    user = await get_or_create_user(db, device_id)

    defaults_row = (
        await db.execute(select(UserDefault).where(UserDefault.user_id == user.id))
    ).scalar_one_or_none()
    if defaults_row is None:
        defaults_row = UserDefault(user_id=user.id)
        db.add(defaults_row)
        await db.flush()
    await db.commit()
    defaults_out = _defaults_out(defaults_row)

    profile = (
        await db.execute(select(UserProfile).where(UserProfile.user_id == user.id))
    ).scalar_one_or_none()
    if profile is None:
        return EmptyProfileOut(defaults=defaults_out)

    # 여권번호·만료일은 복호화하지 않고 저장 여부·마스킹만 노출.
    # 복호화는 실제 예약 플로우(Day 5) 에서만 수행.
    passport_masked: str | None = None
    if profile.passport_number_enc:
        # 마스킹만 필요하므로 평문 전체를 복원하지 않고 자리수 대체로 충분하지만,
        # 정확한 자리수/앞뒤 문자 표시를 위해 복호화 후 mask_passport 유틸 적용.
        from app.core.security import decrypt_sensitive  # local import to limit surface

        passport_masked = mask_passport(decrypt_sensitive(profile.passport_number_enc))

    return ProfileOut(
        passport_given_name=profile.passport_given_name,
        passport_family_name=profile.passport_family_name,
        birth_date=profile.birth_date,
        gender=profile.gender,  # type: ignore[arg-type]
        nationality=profile.nationality,
        phone=profile.phone,
        passport_number_masked=passport_masked,
        passport_expiry=None,  # 응답에 만료일 평문 노출하지 않음
        defaults=defaults_out,
    )


@router.put("", response_model=ProfileOut, response_model_exclude_none=True)
async def upsert_profile(
    payload: ProfileIn,
    device_id: str = Depends(_require_device_id),
    db: AsyncSession = Depends(get_db),
) -> ProfileOut:
    user = await get_or_create_user(db, device_id)

    profile = (
        await db.execute(select(UserProfile).where(UserProfile.user_id == user.id))
    ).scalar_one_or_none()
    if profile is None:
        profile = UserProfile(
            user_id=user.id,
            passport_given_name=payload.passport_given_name.strip().upper(),
            passport_family_name=payload.passport_family_name.strip().upper(),
            birth_date=payload.birth_date,
            gender=payload.gender,
            nationality=payload.nationality.upper(),
            phone=payload.phone.strip(),
        )
        db.add(profile)
    else:
        profile.passport_given_name = payload.passport_given_name.strip().upper()
        profile.passport_family_name = payload.passport_family_name.strip().upper()
        profile.birth_date = payload.birth_date
        profile.gender = payload.gender
        profile.nationality = payload.nationality.upper()
        profile.phone = payload.phone.strip()

    if payload.passport_number:
        profile.passport_number_enc = encrypt_sensitive(payload.passport_number.strip())
    if payload.passport_expiry:
        profile.passport_expiry_enc = encrypt_sensitive(payload.passport_expiry.isoformat())

    defaults_row = (
        await db.execute(select(UserDefault).where(UserDefault.user_id == user.id))
    ).scalar_one_or_none()
    if defaults_row is None:
        defaults_row = UserDefault(user_id=user.id)
        db.add(defaults_row)
    if payload.defaults is not None:
        defaults_row.default_origin = payload.defaults.default_origin.upper()
        defaults_row.preferred_cabin = payload.defaults.preferred_cabin
        defaults_row.adults = payload.defaults.adults
        defaults_row.baggage_preference = payload.defaults.baggage_preference

    await db.commit()
    await db.refresh(profile)
    await db.refresh(defaults_row)

    passport_masked: str | None = None
    if payload.passport_number:
        passport_masked = mask_passport(payload.passport_number.strip())
    elif profile.passport_number_enc:
        from app.core.security import decrypt_sensitive

        passport_masked = mask_passport(decrypt_sensitive(profile.passport_number_enc))

    return ProfileOut(
        passport_given_name=profile.passport_given_name,
        passport_family_name=profile.passport_family_name,
        birth_date=profile.birth_date,
        gender=profile.gender,  # type: ignore[arg-type]
        nationality=profile.nationality,
        phone=profile.phone,
        passport_number_masked=passport_masked,
        passport_expiry=None,
        defaults=_defaults_out(defaults_row),
    )
