from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import TIMESTAMP, Boolean, CheckConstraint, Index, Integer, String, func, true
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base

if TYPE_CHECKING:
    from app.decks.models.deck import Deck


class User(Base):
    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint(
            "length(username) >= 3 AND length(username) <= 20",
            name="username_length",
        ),
        CheckConstraint(
            "avatar_color IN ('blue', 'amber', 'green', 'purple', 'rose')",
            name="avatar_color_allowed",
        ),
        CheckConstraint("daily_goal >= 5 AND daily_goal <= 50", name="daily_goal_range"),
        Index("ix_users_email", "email"),
        Index("ix_users_username", "username"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(254), unique=True)
    username: Mapped[str] = mapped_column(String(20), unique=True)
    password_hash: Mapped[str] = mapped_column(String(128))
    display_name: Mapped[str] = mapped_column(String(60))
    avatar_color: Mapped[str] = mapped_column(String(12), server_default="amber")
    daily_goal: Mapped[int] = mapped_column(Integer, server_default="10")
    sound_enabled: Mapped[bool] = mapped_column(Boolean, server_default=true())
    animations_enabled: Mapped[bool] = mapped_column(Boolean, server_default=true())
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )

    decks: Mapped[list[Deck]] = relationship(
        "Deck", back_populates="owner", cascade="all, delete-orphan", passive_deletes=True
    )
