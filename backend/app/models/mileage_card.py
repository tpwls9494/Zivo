import uuid

from sqlalchemy import ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class MileageCard(Base):
    __tablename__ = "mileage_cards"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    carrier_iata: Mapped[str] = mapped_column(String(3), nullable=False)  # "KE", "OZ", ...
    card_number: Mapped[str] = mapped_column(String(64), nullable=False)
