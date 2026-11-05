from __future__ import annotations

from datetime import datetime
from enum import StrEnum
from typing import TYPE_CHECKING

from sqlalchemy import TIMESTAMP, CheckConstraint, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base

if TYPE_CHECKING:
    from app.decks.models.deck import Deck
    from app.matches.models.match import Match
    from app.users.models.user import User


class ChallengeStatus(StrEnum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    DECLINED = "declined"
    EXPIRED = "expired"
    CANCELLED = "cancelled"


class Challenge(Base):
    __tablename__ = "challenges"
    __table_args__ = (
        CheckConstraint("challenger_id != opponent_id", name="different_players"),
        CheckConstraint("card_count IN (5, 10, 15)", name="card_count_known"),
        CheckConstraint(
            "status IN ('pending', 'accepted', 'declined', 'expired', 'cancelled')",
            name="status_known",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    challenger_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    opponent_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    deck_id: Mapped[int] = mapped_column(ForeignKey("decks.id", ondelete="CASCADE"), unique=True)
    topic: Mapped[str] = mapped_column(String(200))
    card_count: Mapped[int]
    status: Mapped[ChallengeStatus] = mapped_column(String(12), default=ChallengeStatus.PENDING)
    expires_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True))
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )

    challenger: Mapped[User] = relationship("User", foreign_keys=[challenger_id])
    opponent: Mapped[User] = relationship("User", foreign_keys=[opponent_id])
    deck: Mapped[Deck] = relationship("Deck")
    match: Mapped[Match | None] = relationship("Match", back_populates="challenge", uselist=False)
