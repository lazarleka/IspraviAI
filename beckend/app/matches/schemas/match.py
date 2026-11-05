from __future__ import annotations

from typing import Literal

from pydantic import Field

from app.decks.models.deck import DeckStatus
from app.decks.schemas.card import CardAnswerSchema
from app.matches.models.challenge import ChallengeStatus
from app.matches.models.match import MatchStatus
from app.matches.models.match_answer import MatchAction
from app.users.schemas.user import PublicUserSchema
from app.utils.schemas import CamelCaseModel, CamelCaseResponseModel, UtcDatetime


class ChallengeCreateSchema(CamelCaseModel):
    opponent_id: int
    topic: str = Field(min_length=3, max_length=200)
    card_count: Literal[5, 10, 15] = 10


class ChallengeResponseSchema(CamelCaseResponseModel):
    id: int
    challenger: PublicUserSchema
    opponent: PublicUserSchema
    topic: str
    card_count: int
    status: ChallengeStatus
    deck_status: DeckStatus
    match_id: int | None
    expires_at: UtcDatetime
    created_at: UtcDatetime


class PendingChallengesSchema(CamelCaseResponseModel):
    incoming: list[ChallengeResponseSchema]
    outgoing: list[ChallengeResponseSchema]


class MatchResponseSchema(CamelCaseResponseModel):
    id: int
    challenge_id: int
    deck_id: int
    topic: str
    player1: PublicUserSchema
    player2: PublicUserSchema
    player1_score: int
    player2_score: int
    status: MatchStatus
    winner_id: int | None
    started_at: UtcDatetime | None
    finished_at: UtcDatetime | None


class MatchAnswerSchema(CamelCaseResponseModel):
    card_id: int
    user_id: int
    action: MatchAction
    selected_index: int | None
    correct: bool
    response_ms: int | None
    points: int


class MatchCardResultSchema(CamelCaseResponseModel):
    card: CardAnswerSchema
    answers: list[MatchAnswerSchema]


class MatchResultSchema(CamelCaseResponseModel):
    match: MatchResponseSchema
    cards: list[MatchCardResultSchema]
