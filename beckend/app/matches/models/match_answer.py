from __future__ import annotations

from enum import StrEnum

from sqlalchemy import CheckConstraint, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class MatchAction(StrEnum):
    TAP = "tap"
    DONT_KNOW = "dont_know"
    TIMEOUT = "timeout"


class MatchAnswer(Base):
    __tablename__ = "match_answers"
    __table_args__ = (
        UniqueConstraint("match_id", "card_id", "user_id"),
        CheckConstraint("action IN ('tap', 'dont_know', 'timeout')", name="action_known"),
        CheckConstraint("response_ms IS NULL OR response_ms >= 0", name="response_ms_non_negative"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    match_id: Mapped[int] = mapped_column(ForeignKey("matches.id", ondelete="CASCADE"), index=True)
    card_id: Mapped[int] = mapped_column(ForeignKey("cards.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    action: Mapped[MatchAction] = mapped_column(String(12))
    selected_index: Mapped[int | None]
    correct: Mapped[bool]
    response_ms: Mapped[int | None]
    points: Mapped[int]
