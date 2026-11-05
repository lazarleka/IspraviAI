from __future__ import annotations

from typing import Literal

from pydantic import Field

from app.decks.schemas.card import CardAnswerSchema, CardQuestionSchema
from app.utils.schemas import CamelCaseModel, CamelCaseResponseModel


class StudyDeckTodaySchema(CamelCaseResponseModel):
    deck_id: int
    title: str
    subject: str
    due_count: int


class StudyTodaySchema(CamelCaseResponseModel):
    due_count: int
    decks: list[StudyDeckTodaySchema]


class NextCardsSchema(CamelCaseResponseModel):
    items: list[CardQuestionSchema]


class CardAnswerRequestSchema(CamelCaseModel):
    selected_index: int | None = Field(default=None, ge=0)
    attempt: Literal[1, 2]


class CardAnswerResultSchema(CamelCaseResponseModel):
    correct: bool
    points: int
    card: CardAnswerSchema | None


class CardReportRequestSchema(CamelCaseModel):
    reason: str | None = Field(default=None, max_length=200)
