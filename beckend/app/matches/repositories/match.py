from __future__ import annotations

from typing import Protocol

from sqlalchemy import or_, select
from sqlalchemy.orm import joinedload
from sqlalchemy.sql import Select

from app.database.session_factory import ISessionFactory
from app.decks.models.deck import Deck
from app.matches.models.challenge import Challenge, ChallengeStatus
from app.matches.models.match import Match, MatchStatus
from app.matches.models.match_answer import MatchAnswer
from app.utils.di import inject
from app.utils.pagination import Page, PaginationParams, paginate


class IMatchRepository(Protocol):
    def add_challenge(self, challenge: Challenge) -> Challenge: ...
    def get_challenge(self, challenge_id: int) -> Challenge | None: ...
    def pending_for_user(self, user_id: int) -> list[Challenge]: ...
    def pending_between(self, first_id: int, second_id: int) -> Challenge | None: ...
    def add_match(self, match: Match) -> Match: ...
    def get_match(self, match_id: int) -> Match | None: ...
    def list_finished(self, user_id: int, pagination: PaginationParams) -> Page[Match]: ...
    def answers_for_match(self, match_id: int) -> list[MatchAnswer]: ...
    def add_answers(self, answers: list[MatchAnswer]) -> None: ...


@inject(alias=IMatchRepository)
class MatchRepository(IMatchRepository):
    def __init__(self, session_factory: ISessionFactory) -> None:
        self._session_factory = session_factory

    @staticmethod
    def _challenge_query() -> Select[Challenge]:
        return select(Challenge).options(
            joinedload(Challenge.challenger),
            joinedload(Challenge.opponent),
            joinedload(Challenge.deck),
            joinedload(Challenge.match),
        )

    @staticmethod
    def _match_query() -> Select[Match]:
        return select(Match).options(
            joinedload(Match.player1),
            joinedload(Match.player2),
            joinedload(Match.challenge).joinedload(Challenge.deck).selectinload(Deck.cards),
        )

    def add_challenge(self, challenge: Challenge) -> Challenge:
        db = self._session_factory()
        db.add(challenge)
        db.flush()
        return challenge

    def get_challenge(self, challenge_id: int) -> Challenge | None:
        return self._session_factory().scalar(
            self._challenge_query().where(Challenge.id == challenge_id)
        )

    def pending_for_user(self, user_id: int) -> list[Challenge]:
        return list(
            self._session_factory()
            .scalars(
                self._challenge_query()
                .where(
                    or_(Challenge.challenger_id == user_id, Challenge.opponent_id == user_id),
                    Challenge.status == ChallengeStatus.PENDING,
                )
                .order_by(Challenge.created_at.desc())
            )
            .all()
        )

    def pending_between(self, first_id: int, second_id: int) -> Challenge | None:
        return self._session_factory().scalar(
            select(Challenge).where(
                or_(
                    (Challenge.challenger_id == first_id) & (Challenge.opponent_id == second_id),
                    (Challenge.challenger_id == second_id) & (Challenge.opponent_id == first_id),
                ),
                Challenge.status == ChallengeStatus.PENDING,
            )
        )

    def add_match(self, match: Match) -> Match:
        db = self._session_factory()
        db.add(match)
        db.flush()
        return match

    def get_match(self, match_id: int) -> Match | None:
        return self._session_factory().scalar(self._match_query().where(Match.id == match_id))

    def list_finished(self, user_id: int, pagination: PaginationParams) -> Page[Match]:
        query = (
            self._match_query()
            .where(
                or_(Match.player1_id == user_id, Match.player2_id == user_id),
                Match.status.in_([MatchStatus.FINISHED, MatchStatus.ABANDONED]),
            )
            .order_by(Match.finished_at.desc(), Match.id.desc())
        )
        return paginate(query=query, pagination_params=pagination, db=self._session_factory())

    def answers_for_match(self, match_id: int) -> list[MatchAnswer]:
        return list(
            self._session_factory()
            .scalars(select(MatchAnswer).where(MatchAnswer.match_id == match_id))
            .all()
        )

    def add_answers(self, answers: list[MatchAnswer]) -> None:
        db = self._session_factory()
        db.add_all(answers)
        db.flush()
