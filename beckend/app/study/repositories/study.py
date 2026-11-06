from __future__ import annotations

from collections.abc import Sequence
from dataclasses import dataclass
from typing import Protocol

from sqlalchemy import func, select

from app.database.session_factory import ISessionFactory
from app.decks.models.card import Card
from app.study.models.card_progress import CardProgress
from app.utils.di import inject


@dataclass(frozen=True)
class StudyStats:
    cards_reviewed: int
    correct_answers: int
    wrong_answers: int


class IStudyRepository(Protocol):
    def get_card(self, card_id: int) -> Card | None: ...

    def get_progress(self, user_id: int, card_id: int) -> CardProgress | None: ...

    def get_progress_for_cards(
        self, user_id: int, card_ids: Sequence[int]
    ) -> dict[int, CardProgress]: ...

    def add_progress(self, progress: CardProgress) -> CardProgress: ...
    def stats_for_user(self, user_id: int) -> StudyStats: ...


@inject(alias=IStudyRepository)
class StudyRepository(IStudyRepository):
    def __init__(self, session_factory: ISessionFactory) -> None:
        self._session_factory = session_factory

    def get_card(self, card_id: int) -> Card | None:
        return self._session_factory().get(Card, card_id)

    def get_progress(self, user_id: int, card_id: int) -> CardProgress | None:
        return self._session_factory().scalar(
            select(CardProgress).where(
                CardProgress.user_id == user_id, CardProgress.card_id == card_id
            )
        )

    def get_progress_for_cards(
        self, user_id: int, card_ids: Sequence[int]
    ) -> dict[int, CardProgress]:
        if not card_ids:
            return {}
        rows = self._session_factory().scalars(
            select(CardProgress).where(
                CardProgress.user_id == user_id, CardProgress.card_id.in_(card_ids)
            )
        )
        return {progress.card_id: progress for progress in rows}

    def add_progress(self, progress: CardProgress) -> CardProgress:
        db = self._session_factory()
        db.add(progress)
        db.flush()
        return progress

    def stats_for_user(self, user_id: int) -> StudyStats:
        row = (
            self._session_factory()
            .execute(
                select(
                    func.coalesce(
                        func.sum(CardProgress.correct_count + CardProgress.wrong_count), 0
                    ),
                    func.coalesce(func.sum(CardProgress.correct_count), 0),
                    func.coalesce(func.sum(CardProgress.wrong_count), 0),
                ).where(CardProgress.user_id == user_id)
            )
            .one()
        )
        return StudyStats(
            cards_reviewed=int(row[0]),
            correct_answers=int(row[1]),
            wrong_answers=int(row[2]),
        )
