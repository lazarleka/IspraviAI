from __future__ import annotations

from datetime import UTC, datetime
from typing import Protocol

from app.decks.models.card import Card
from app.decks.models.deck import Deck
from app.study.models.card_progress import CardProgress
from app.study.repositories.study import IStudyRepository
from app.utils.di import inject


class IStudyStatsService(Protocol):
    def get_deck_stats(self, deck: Deck, user_id: int) -> tuple[int, int]: ...

    def pick_variants(self, cards: list[Card], user_id: int) -> list[Card]: ...


@inject(alias=IStudyStatsService)
class StudyStatsService(IStudyStatsService):
    def __init__(self, study_repository: IStudyRepository) -> None:
        self._study_repository = study_repository

    def get_deck_stats(self, deck: Deck, user_id: int) -> tuple[int, int]:
        progress = self._study_repository.get_progress_for_cards(
            user_id, [card.id for card in deck.cards]
        )
        known = sum(
            1 for card in deck.cards if progress.get(card.id) and progress[card.id].box >= 3
        )
        percentage = round(known * 100 / len(deck.cards)) if deck.cards else 0
        variants = self._pick_variants(deck.cards, progress)
        now = datetime.now(UTC)
        due_count = sum(
            1
            for card in variants
            if (item := progress.get(card.id)) is None
            or (not item.reported and self.normalize_time(item.due_at) <= now)
        )
        return percentage, due_count

    def pick_variants(self, cards: list[Card], user_id: int) -> list[Card]:
        progress = self._study_repository.get_progress_for_cards(
            user_id, [card.id for card in cards]
        )
        return self._pick_variants(cards, progress)

    @classmethod
    def _pick_variants(cls, cards: list[Card], progress: dict[int, CardProgress]) -> list[Card]:
        by_fact: dict[str, list[Card]] = {}
        for card in cards:
            item = progress.get(card.id)
            if item is not None and item.reported:
                continue
            by_fact.setdefault(card.fact_key, []).append(card)

        return [
            min(
                variants,
                key=lambda card: (
                    cls.normalize_time(progress[card.id].last_seen_at)
                    if card.id in progress
                    else cls.normalize_time(None)
                ),
            )
            for variants in by_fact.values()
        ]

    @staticmethod
    def normalize_time(value: datetime | None) -> datetime:
        if value is None:
            return datetime.min.replace(tzinfo=UTC)
        return value.replace(tzinfo=UTC) if value.tzinfo is None else value.astimezone(UTC)
