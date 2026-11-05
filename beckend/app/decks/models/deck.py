from __future__ import annotations

from datetime import datetime
from enum import StrEnum
from typing import TYPE_CHECKING

from sqlalchemy import TIMESTAMP, CheckConstraint, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base

if TYPE_CHECKING:
    from app.decks.models.card import Card
    from app.users.models.user import User


class DeckSubject(StrEnum):
    BIOLOGY = "biology"
    HISTORY = "history"
    PROGRAMMING = "programming"
    MATH = "math"
    PHYSICS = "physics"
    CHEMISTRY = "chemistry"
    LANGUAGE = "language"
    OTHER = "other"


class DeckSourceType(StrEnum):
    TOPIC = "topic"
    FILE = "file"


class DeckKind(StrEnum):
    STUDY = "study"
    MATCH = "match"


class DeckStatus(StrEnum):
    GENERATING = "generating"
    READY = "ready"
    FAILED = "failed"


_SUBJECTS = ", ".join(f"'{value}'" for value in DeckSubject)
_SOURCE_TYPES = ", ".join(f"'{value}'" for value in DeckSourceType)
_KINDS = ", ".join(f"'{value}'" for value in DeckKind)
_STATUSES = ", ".join(f"'{value}'" for value in DeckStatus)


class Deck(Base):
    __tablename__ = "decks"
    __table_args__ = (
        CheckConstraint(f"subject IN ({_SUBJECTS})", name="subject_known"),
        CheckConstraint(f"source_type IN ({_SOURCE_TYPES})", name="source_type_known"),
        CheckConstraint(f"kind IN ({_KINDS})", name="kind_known"),
        CheckConstraint(f"status IN ({_STATUSES})", name="status_known"),
        CheckConstraint(
            "requested_cards >= 5 AND requested_cards <= 20", name="requested_cards_range"
        ),
        CheckConstraint(
            "(source_type = 'topic' AND topic IS NOT NULL AND file_name IS NULL) OR "
            "(source_type = 'file' AND topic IS NULL AND file_name IS NOT NULL)",
            name="source_fields_match_type",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(80))
    subject: Mapped[DeckSubject] = mapped_column(String(20))
    source_type: Mapped[DeckSourceType] = mapped_column(String(10))
    topic: Mapped[str | None] = mapped_column(String(200))
    file_name: Mapped[str | None] = mapped_column(String(255))
    kind: Mapped[DeckKind] = mapped_column(String(10), default=DeckKind.STUDY)
    status: Mapped[DeckStatus] = mapped_column(String(12), default=DeckStatus.GENERATING)
    requested_cards: Mapped[int]
    source_text: Mapped[str] = mapped_column(Text)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )

    owner: Mapped[User] = relationship("User", back_populates="decks")
    cards: Mapped[list[Card]] = relationship(
        "Card", back_populates="deck", cascade="all, delete-orphan", passive_deletes=True
    )
