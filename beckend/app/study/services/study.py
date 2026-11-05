from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Protocol

from app.auth.schemas.auth import CurrentUser
from app.decks.exceptions.deck import DeckNotFoundException, NotDeckOwnerException
from app.decks.models.card import Card
from app.decks.models.deck import Deck, DeckStatus
from app.decks.repositories.deck import IDeckRepository
from app.decks.schemas.card import CardAnswerSchema, CardQuestionSchema
from app.study.exceptions.study import CardNotFoundException, DeckNotReadyException
from app.study.models.card_progress import CardProgress
from app.study.repositories.study import IStudyRepository
from app.study.schemas.study import (
    CardAnswerRequestSchema,
    CardAnswerResultSchema,
    CardReportRequestSchema,
    NextCardsSchema,
    StudyDeckTodaySchema,
    StudyTodaySchema,
)
from app.study.services.stats import IStudyStatsService, StudyStatsService
from app.utils.di import inject
from app.utils.pagination import PaginationParams

INTERVAL_BY_BOX = {
    1: timedelta(0),
    2: timedelta(days=3),
    3: timedelta(days=7),
    4: timedelta(days=14),
}


class IStudyService(Protocol):
    def today(self, current_user: CurrentUser) -> StudyTodaySchema: ...

    def next(self, deck_id: int, size: int, current_user: CurrentUser) -> NextCardsSchema: ...

    def answer(
        self, card_id: int, data: CardAnswerRequestSchema, current_user: CurrentUser
    ) -> CardAnswerResultSchema: ...

    def report(
        self, card_id: int, data: CardReportRequestSchema, current_user: CurrentUser
    ) -> None: ...


@inject(alias=IStudyService)
class StudyService(IStudyService):
    def __init__(
        self,
        study_repository: IStudyRepository,
        deck_repository: IDeckRepository,
        stats_service: IStudyStatsService,
    ) -> None:
        self._study_repository = study_repository
        self._deck_repository = deck_repository
        self._stats_service = stats_service

    def today(self, current_user: CurrentUser) -> StudyTodaySchema:
        decks = self._deck_repository.list_for_owner(
            current_user.id, PaginationParams(page=1, size=500)
        )
        items = [
            StudyDeckTodaySchema(
                deck_id=deck.id,
                title=deck.title,
                subject=deck.subject,
                due_count=self._stats_service.get_deck_stats(deck, current_user.id)[1],
            )
            for deck in decks.items
            if deck.status == DeckStatus.READY
        ]
        return StudyTodaySchema(
            due_count=sum(item.due_count for item in items),
            decks=items,
        )

    def next(self, deck_id: int, size: int, current_user: CurrentUser) -> NextCardsSchema:
        deck = self._get_owned_deck(deck_id, current_user)
        if deck.status != DeckStatus.READY:
            raise DeckNotReadyException
        cards = self._stats_service.pick_variants(deck.cards, current_user.id)
        progress = self._study_repository.get_progress_for_cards(
            current_user.id, [card.id for card in cards]
        )
        now = datetime.now(UTC)
        cards.sort(
            key=lambda card: (
                0
                if (item := progress.get(card.id)) is None
                or StudyStatsService.normalize_time(item.due_at) <= now
                else 1
            )
        )
        return NextCardsSchema(
            items=[CardQuestionSchema.model_validate(card) for card in cards[:size]]
        )

    def answer(
        self, card_id: int, data: CardAnswerRequestSchema, current_user: CurrentUser
    ) -> CardAnswerResultSchema:
        card = self._get_owned_card(card_id, current_user)
        correct = data.selected_index == card.wrong_index
        finished = correct or data.attempt == 2
        now = datetime.now(UTC)
        progress = self._study_repository.get_progress(current_user.id, card.id)
        if progress is None:
            progress = self._study_repository.add_progress(
                CardProgress(user_id=current_user.id, card_id=card.id, due_at=now)
            )

        if correct:
            progress.correct_count += 1
        else:
            progress.wrong_count += 1
        if finished:
            if correct and data.attempt == 1:
                progress.box = min(progress.box + 1, 4)
            elif not correct:
                progress.box = 1
            progress.due_at = now + INTERVAL_BY_BOX[progress.box]
            progress.last_seen_at = now

        points = 10 if correct and data.attempt == 1 else 5 if correct else 0
        answer = CardAnswerSchema.model_validate(card) if finished else None
        return CardAnswerResultSchema(correct=correct, points=points, card=answer)

    def report(
        self, card_id: int, data: CardReportRequestSchema, current_user: CurrentUser
    ) -> None:
        del data
        card = self._get_owned_card(card_id, current_user)
        progress = self._study_repository.get_progress(current_user.id, card.id)
        if progress is None:
            progress = self._study_repository.add_progress(
                CardProgress(user_id=current_user.id, card_id=card.id)
            )
        progress.reported = True

    def _get_owned_deck(self, deck_id: int, current_user: CurrentUser) -> Deck:
        deck = self._deck_repository.get_by_id(deck_id)
        if deck is None:
            raise DeckNotFoundException
        if deck.owner_id != current_user.id:
            raise NotDeckOwnerException
        return deck

    def _get_owned_card(self, card_id: int, current_user: CurrentUser) -> Card:
        card = self._study_repository.get_card(card_id)
        if card is None:
            raise CardNotFoundException
        if card.deck.owner_id != current_user.id:
            raise NotDeckOwnerException
        return card
