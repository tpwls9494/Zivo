import uuid
from datetime import date

from sqlalchemy import Date, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class UserProfile(Base):
    """여권 기반 개인정보. 여권번호와 만료일은 AES-256-GCM 암호화 저장."""

    __tablename__ = "user_profiles"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    passport_given_name: Mapped[str] = mapped_column(String(64), nullable=False)
    passport_family_name: Mapped[str] = mapped_column(String(64), nullable=False)
    birth_date: Mapped[date] = mapped_column(Date, nullable=False)
    gender: Mapped[str] = mapped_column(String(1), nullable=False)  # M / F
    nationality: Mapped[str] = mapped_column(String(3), nullable=False, default="KOR")
    phone: Mapped[str] = mapped_column(String(32), nullable=False)
    # 암호화된 base64 문자열. app.core.security.encrypt_sensitive 사용.
    passport_number_enc: Mapped[str | None] = mapped_column(String(512), nullable=True)
    passport_expiry_enc: Mapped[str | None] = mapped_column(String(512), nullable=True)
