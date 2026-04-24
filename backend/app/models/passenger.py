import uuid
from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Passenger(Base):
    """탑승자 프로필. 유저 1명이 여러 탑승자를 저장 가능."""

    __tablename__ = "passengers"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    nickname: Mapped[str] = mapped_column(String(32), nullable=False, default="나")
    passport_given_name: Mapped[str] = mapped_column(String(64), nullable=False)
    passport_family_name: Mapped[str] = mapped_column(String(64), nullable=False)
    birth_date: Mapped[date] = mapped_column(Date, nullable=False)
    gender: Mapped[str] = mapped_column(String(1), nullable=False)
    nationality: Mapped[str] = mapped_column(String(3), nullable=False, default="KOR")
    phone: Mapped[str] = mapped_column(String(32), nullable=False)
    passport_number_enc: Mapped[str | None] = mapped_column(String(512), nullable=True)
    passport_expiry_enc: Mapped[str | None] = mapped_column(String(512), nullable=True)
    is_primary: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
