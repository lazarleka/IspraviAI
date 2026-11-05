from __future__ import annotations

from collections.abc import Sequence
from typing import Protocol

from sqlalchemy import select

from app.database.session_factory import ISessionFactory
from app.decks.models.card import Card
from app.study.models.card_progress import CardProgress
from app.utils.di import inject


class IStudyRepository(Protocol):
    def get_card(self, card_id: int) -> Card | None: ...

    def get_progress(self, user_id: int, card_id: int) -> CardProgress | None: ...

    def get_progress_for_cards(
        self, user_id: int, card_ids: Sequence[int]
    ) -> dict[int, CardProgress]: ...

    def add_progress(self, progress: CardProgress) -> CardProgress: ...


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
