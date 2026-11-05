from __future__ import annotations

from pydantic import Field, model_validator

from app.decks.models.card import CardErrorType, CardKind
from app.utils.schemas import CamelCaseModel, CamelCaseResponseModel

INVALID_SEGMENTS = "segments must contain 1-200 characters"
INVALID_CORRECT_CARD = "a correct card cannot include a correction or error type"
INVALID_WRONG_INDEX = "wrongIndex must point to a segment"
INVALID_CORRECTION = "correctText must differ from the wrong segment"
MISSING_ERROR_TYPE = "an incorrect card requires errorType"


class CardCandidateSchema(CamelCaseModel):
    fact_key: str = Field(min_length=1, max_length=100)
    kind: CardKind
    language: str | None = Field(default=None, max_length=30)
    segments: list[str] = Field(min_length=2, max_length=8)
    wrong_index: int | None = Field(default=None, ge=0)
    correct_text: str | None = Field(default=None, max_length=200)
    explanation: str = Field(min_length=1, max_length=300)
    error_type: CardErrorType | None = None
    source_ref: str | None = Field(default=None, max_length=200)

    @model_validator(mode="after")
    def validate_answer(self) -> CardCandidateSchema:
        if any(not segment.strip() or len(segment) > 200 for segment in self.segments):
            raise ValueError(INVALID_SEGMENTS)
        if self.wrong_index is None:
            if self.correct_text is not None or self.error_type is not None:
                raise ValueError(INVALID_CORRECT_CARD)
            return self
        if self.wrong_index >= len(self.segments):
            raise ValueError(INVALID_WRONG_INDEX)
        if not self.correct_text or self.segments[self.wrong_index] == self.correct_text:
            raise ValueError(INVALID_CORRECTION)
        if self.error_type is None:
            raise ValueError(MISSING_ERROR_TYPE)
        return self


class CardQuestionSchema(CamelCaseResponseModel):
    id: int
    deck_id: int
    kind: CardKind
    language: str | None
    segments: list[str]


class CardAnswerSchema(CardQuestionSchema):
    wrong_index: int | None
    correct_text: str | None
    explanation: str
    error_type: CardErrorType | None
    source_ref: str | None
