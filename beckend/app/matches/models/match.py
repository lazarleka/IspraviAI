from __future__ import annotations

from datetime import datetime
from enum import StrEnum
from typing import TYPE_CHECKING

from sqlalchemy import TIMESTAMP, CheckConstraint, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base

if TYPE_CHECKING:
    from app.matches.models.challenge import Challenge
    from app.users.models.user import User


class MatchStatus(StrEnum):
    WAITING = "waiting"
    IN_PROGRESS = "in_progress"
    FINISHED = "finished"
    ABANDONED = "abandoned"


class Match(Base):
    __tablename__ = "matches"
    __table_args__ = (
        CheckConstraint(
            "status IN ('waiting', 'in_progress', 'finished', 'abandoned')", name="status_known"
        ),
        CheckConstraint("player1_id != player2_id", name="different_players"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    challenge_id: Mapped[int] = mapped_column(
        ForeignKey("challenges.id", ondelete="CASCADE"), unique=True
    )
    deck_id: Mapped[int] = mapped_column(ForeignKey("decks.id", ondelete="CASCADE"), unique=True)
    player1_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    player2_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    player1_score: Mapped[int] = mapped_column(default=0)
    player2_score: Mapped[int] = mapped_column(default=0)
    status: Mapped[MatchStatus] = mapped_column(String(12), default=MatchStatus.WAITING)
    winner_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    started_at: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True))
    finished_at: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True))

    challenge: Mapped[Challenge] = relationship("Challenge", back_populates="match")
    player1: Mapped[User] = relationship("User", foreign_keys=[player1_id])
    player2: Mapped[User] = relationship("User", foreign_keys=[player2_id])
