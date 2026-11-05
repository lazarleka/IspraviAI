from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Protocol

from fastapi import BackgroundTasks

from app.auth.schemas.auth import CurrentUser
from app.decks.generation.pipeline import generate_deck_cards
from app.decks.models.deck import Deck, DeckKind, DeckSourceType, DeckStatus
from app.decks.repositories.deck import IDeckRepository
from app.decks.schemas.card import CardAnswerSchema
from app.friends.models.friendship import FriendshipStatus
from app.friends.repositories.friendship import IFriendshipRepository
from app.matches.exceptions.match import (
    ChallengeAlreadyPendingException,
    ChallengeExpiredException,
    ChallengeNotFoundException,
    DeckGenerationFailedException,
    MatchNotFinishedException,
    MatchNotFoundException,
    NotChallengeOpponentException,
    NotChallengerException,
    NotFriendsException,
    NotMatchPlayerException,
)
from app.matches.models.challenge import Challenge, ChallengeStatus
from app.matches.models.match import Match, MatchStatus
from app.matches.repositories.match import IMatchRepository
from app.matches.schemas.match import (
    ChallengeCreateSchema,
    ChallengeResponseSchema,
    MatchAnswerSchema,
    MatchCardResultSchema,
    MatchResponseSchema,
    MatchResultSchema,
    PendingChallengesSchema,
)
from app.realtime.registry import ConnectionRegistry
from app.users.schemas.user import PublicUserSchema
from app.utils.di import inject
from app.utils.pagination import Page, PaginationParams


class IMatchService(Protocol):
    def create_challenge(
        self, data: ChallengeCreateSchema, current_user: CurrentUser, tasks: BackgroundTasks
    ) -> ChallengeResponseSchema: ...
    def pending(self, current_user: CurrentUser) -> PendingChallengesSchema: ...
    def accept(self, challenge_id: int, current_user: CurrentUser) -> ChallengeResponseSchema: ...
    def decline(self, challenge_id: int, current_user: CurrentUser) -> ChallengeResponseSchema: ...
    def cancel(self, challenge_id: int, current_user: CurrentUser) -> None: ...
    def list_matches(
        self, pagination: PaginationParams, current_user: CurrentUser
    ) -> Page[MatchResponseSchema]: ...
    def get_match(self, match_id: int, current_user: CurrentUser) -> MatchResponseSchema: ...
    def result(self, match_id: int, current_user: CurrentUser) -> MatchResultSchema: ...


@inject(alias=IMatchService)
class MatchService(IMatchService):
    def __init__(
        self,
        repository: IMatchRepository,
        friendship_repository: IFriendshipRepository,
        deck_repository: IDeckRepository,
        registry: ConnectionRegistry,
    ) -> None:
        self._repository = repository
        self._friendship_repository = friendship_repository
        self._deck_repository = deck_repository
        self._registry = registry

    def create_challenge(
        self, data: ChallengeCreateSchema, current_user: CurrentUser, tasks: BackgroundTasks
    ) -> ChallengeResponseSchema:
        friendship = self._friendship_repository.get_pair(current_user.id, data.opponent_id)
        if friendship is None or friendship.status != FriendshipStatus.ACCEPTED:
            raise NotFriendsException
        if self._repository.pending_between(current_user.id, data.opponent_id) is not None:
            raise ChallengeAlreadyPendingException
        challenger = (
            friendship.user_low
            if friendship.user_low_id == current_user.id
            else friendship.user_high
        )
        opponent = (
            friendship.user_high
            if friendship.user_low_id == current_user.id
            else friendship.user_low
        )
        topic = data.topic.strip()
        deck = self._deck_repository.add(
            Deck(
                title=topic[:80],
                subject="other",
                source_type=DeckSourceType.TOPIC,
                topic=topic,
                file_name=None,
                kind=DeckKind.MATCH,
                requested_cards=data.card_count,
                source_text=topic,
                owner_id=current_user.id,
            )
        )
        challenge = self._repository.add_challenge(
            Challenge(
                challenger_id=current_user.id,
                opponent_id=data.opponent_id,
                deck_id=deck.id,
                topic=topic,
                card_count=data.card_count,
                expires_at=datetime.now(UTC) + timedelta(minutes=2),
                challenger=challenger,
                opponent=opponent,
                deck=deck,
            )
        )
        tasks.add_task(generate_deck_cards, deck.id)
        response = self._challenge_response(challenge)
        self._push(data.opponent_id, "challenge_received", response)
        return response

    def pending(self, current_user: CurrentUser) -> PendingChallengesSchema:
        rows = self._repository.pending_for_user(current_user.id)
        now = datetime.now(UTC)
        for row in rows:
            if self._utc(row.expires_at) <= now:
                row.status = ChallengeStatus.EXPIRED
        active = [row for row in rows if row.status == ChallengeStatus.PENDING]
        return PendingChallengesSchema(
            incoming=[
                self._challenge_response(row)
                for row in active
                if row.opponent_id == current_user.id
            ],
            outgoing=[
                self._challenge_response(row)
                for row in active
                if row.challenger_id == current_user.id
            ],
        )

    def accept(self, challenge_id: int, current_user: CurrentUser) -> ChallengeResponseSchema:
        challenge = self._get_challenge(challenge_id)
        self._ensure_opponent(challenge, current_user)
        self._ensure_active(challenge)
        if challenge.deck.status == DeckStatus.FAILED:
            raise DeckGenerationFailedException
        match = self._repository.add_match(
            Match(
                challenge_id=challenge.id,
                deck_id=challenge.deck_id,
                player1_id=challenge.challenger_id,
                player2_id=challenge.opponent_id,
                player1=challenge.challenger,
                player2=challenge.opponent,
            )
        )
        challenge.status = ChallengeStatus.ACCEPTED
        challenge.match = match
        response = self._challenge_response(challenge)
        self._push(challenge.challenger_id, "challenge_updated", response)
        return response

    def decline(self, challenge_id: int, current_user: CurrentUser) -> ChallengeResponseSchema:
        challenge = self._get_challenge(challenge_id)
        self._ensure_opponent(challenge, current_user)
        self._ensure_active(challenge)
        challenge.status = ChallengeStatus.DECLINED
        response = self._challenge_response(challenge)
        self._push(challenge.challenger_id, "challenge_updated", response)
        return response

    def cancel(self, challenge_id: int, current_user: CurrentUser) -> None:
        challenge = self._get_challenge(challenge_id)
        if challenge.challenger_id != current_user.id:
            raise NotChallengerException
        self._ensure_active(challenge)
        challenge.status = ChallengeStatus.CANCELLED
        self._push(challenge.opponent_id, "challenge_updated", self._challenge_response(challenge))

    def list_matches(
        self, pagination: PaginationParams, current_user: CurrentUser
    ) -> Page[MatchResponseSchema]:
        rows = self._repository.list_finished(current_user.id, pagination)
        return Page(
            total=rows.total,
            items=[self._match_response(row) for row in rows.items],
            pages=rows.pages,
        )

    def get_match(self, match_id: int, current_user: CurrentUser) -> MatchResponseSchema:
        return self._match_response(self._get_player_match(match_id, current_user))

    def result(self, match_id: int, current_user: CurrentUser) -> MatchResultSchema:
        match = self._get_player_match(match_id, current_user)
        if match.status not in {MatchStatus.FINISHED, MatchStatus.ABANDONED}:
            raise MatchNotFinishedException
        answers = self._repository.answers_for_match(match.id)
        return MatchResultSchema(
            match=self._match_response(match),
            cards=[
                MatchCardResultSchema(
                    card=CardAnswerSchema.model_validate(card),
                    answers=[
                        MatchAnswerSchema.model_validate(a) for a in answers if a.card_id == card.id
                    ],
                )
                for card in match.challenge.deck.cards
            ],
        )

    def _get_challenge(self, challenge_id: int) -> Challenge:
        challenge = self._repository.get_challenge(challenge_id)
        if challenge is None:
            raise ChallengeNotFoundException
        return challenge

    @staticmethod
    def _ensure_opponent(challenge: Challenge, user: CurrentUser) -> None:
        if challenge.opponent_id != user.id:
            raise NotChallengeOpponentException

    @classmethod
    def _ensure_active(cls, challenge: Challenge) -> None:
        if challenge.status != ChallengeStatus.PENDING or cls._utc(
            challenge.expires_at
        ) <= datetime.now(UTC):
            challenge.status = ChallengeStatus.EXPIRED
            raise ChallengeExpiredException

    def _get_player_match(self, match_id: int, user: CurrentUser) -> Match:
        match = self._repository.get_match(match_id)
        if match is None:
            raise MatchNotFoundException
        if user.id not in {match.player1_id, match.player2_id}:
            raise NotMatchPlayerException
        return match

    @staticmethod
    def _challenge_response(challenge: Challenge) -> ChallengeResponseSchema:
        return ChallengeResponseSchema(
            id=challenge.id,
            challenger=PublicUserSchema.model_validate(challenge.challenger),
            opponent=PublicUserSchema.model_validate(challenge.opponent),
            topic=challenge.topic,
            card_count=challenge.card_count,
            status=challenge.status,
            deck_status=challenge.deck.status,
            match_id=challenge.match.id if challenge.match else None,
            expires_at=challenge.expires_at,
            created_at=challenge.created_at,
        )

    @staticmethod
    def _match_response(match: Match) -> MatchResponseSchema:
        return MatchResponseSchema(
            id=match.id,
            challenge_id=match.challenge_id,
            deck_id=match.deck_id,
            topic=match.challenge.topic,
            player1=PublicUserSchema.model_validate(match.player1),
            player2=PublicUserSchema.model_validate(match.player2),
            player1_score=match.player1_score,
            player2_score=match.player2_score,
            status=match.status,
            winner_id=match.winner_id,
            started_at=match.started_at,
            finished_at=match.finished_at,
        )

    def _push(self, user_id: int, message_type: str, challenge: ChallengeResponseSchema) -> None:
        self._registry.send_to_user(
            user_id,
            {"type": message_type, "challenge": challenge.model_dump(by_alias=True, mode="json")},
        )

    @staticmethod
    def _utc(value: datetime) -> datetime:
        return value.replace(tzinfo=UTC) if value.tzinfo is None else value.astimezone(UTC)
