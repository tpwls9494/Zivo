import uuid

from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class UserDefault(Base):
    """검색 자동완성용 기본 설정."""

    __tablename__ = "user_defaults"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    default_origin: Mapped[str] = mapped_column(String(3), default="ICN", nullable=False)
    preferred_cabin: Mapped[str] = mapped_column(String(16), default="economy", nullable=False)
    adults: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    # "carry_only" | "checked" | "any"
    baggage_preference: Mapped[str] = mapped_column(String(16), default="any", nullable=False)
