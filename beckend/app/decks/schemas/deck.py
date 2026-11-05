from __future__ import annotations

from pydantic import Field

from app.decks.models.deck import DeckKind, DeckSourceType, DeckStatus, DeckSubject
from app.utils.schemas import CamelCaseModel, CamelCaseResponseModel, UtcDatetime


class DeckCreateRequestSchema(CamelCaseModel):
    topic: str = Field(min_length=3, max_length=200)
    title: str | None = Field(default=None, min_length=3, max_length=80)
    subject: DeckSubject | None = None
    requested_cards: int = Field(ge=5, le=20)


class DeckResponseSchema(CamelCaseResponseModel):
    id: int
    title: str
    subject: DeckSubject
    source_type: DeckSourceType
    topic: str | None
    file_name: str | None
    kind: DeckKind
    status: DeckStatus
    requested_cards: int
    card_count: int
    progress: int
    due_count: int
    owner_id: int
    created_at: UtcDatetime
