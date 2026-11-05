from __future__ import annotations

from datetime import datetime

from sqlalchemy import TIMESTAMP, Boolean, CheckConstraint, ForeignKey, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class CardProgress(Base):
    __tablename__ = "card_progress"
    __table_args__ = (
        UniqueConstraint("user_id", "card_id"),
        CheckConstraint("box >= 1 AND box <= 4", name="box_range"),
        CheckConstraint("correct_count >= 0", name="correct_count_non_negative"),
        CheckConstraint("wrong_count >= 0", name="wrong_count_non_negative"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    card_id: Mapped[int] = mapped_column(ForeignKey("cards.id", ondelete="CASCADE"), index=True)
    box: Mapped[int] = mapped_column(default=1)
    due_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())
    correct_count: Mapped[int] = mapped_column(default=0)
    wrong_count: Mapped[int] = mapped_column(default=0)
    last_seen_at: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True))
    reported: Mapped[bool] = mapped_column(Boolean, default=False)
