from __future__ import annotations

from enum import StrEnum
from typing import TYPE_CHECKING

from sqlalchemy import JSON, CheckConstraint, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base

if TYPE_CHECKING:
    from app.decks.models.deck import Deck


class CardKind(StrEnum):
    TEXT = "text"
    CODE = "code"


class CardErrorType(StrEnum):
    FACT = "fact"
    CALCULATION = "calculation"
    LOGIC = "logic"
    FAKE_SOURCE = "fake_source"
    EXAGGERATION = "exaggeration"
    CODE_BUG = "code_bug"


_KINDS = ", ".join(f"'{value}'" for value in CardKind)
_ERROR_TYPES = ", ".join(f"'{value}'" for value in CardErrorType)


class Card(Base):
    __tablename__ = "cards"
    __table_args__ = (
        CheckConstraint(f"kind IN ({_KINDS})", name="kind_known"),
        CheckConstraint(
            f"error_type IS NULL OR error_type IN ({_ERROR_TYPES})", name="error_type_known"
        ),
        CheckConstraint("wrong_index IS NULL OR wrong_index >= 0", name="wrong_index_non_negative"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    deck_id: Mapped[int] = mapped_column(ForeignKey("decks.id", ondelete="CASCADE"), index=True)
    kind: Mapped[CardKind] = mapped_column(String(10))
    language: Mapped[str | None] = mapped_column(String(30))
    segments: Mapped[list[str]] = mapped_column(JSON)
    wrong_index: Mapped[int | None]
    correct_text: Mapped[str | None] = mapped_column(String(200))
    explanation: Mapped[str] = mapped_column(String(300))
    error_type: Mapped[CardErrorType | None] = mapped_column(String(20))
    source_ref: Mapped[str | None] = mapped_column(String(200))
    fact_key: Mapped[str] = mapped_column(String(100), index=True)

    deck: Mapped[Deck] = relationship("Deck", back_populates="cards")
