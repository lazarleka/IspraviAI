from __future__ import annotations

import logging

from app.database.session_handler import db_session_handler
from app.decks.generation.generator import ICardGenerator
from app.decks.models.card import Card
from app.decks.models.deck import DeckStatus
from app.decks.repositories.deck import IDeckRepository
from app.utils.di import get_from_di_container

logger = logging.getLogger(__name__)


@db_session_handler
def generate_deck_cards(deck_id: int) -> None:
    repository = get_from_di_container(IDeckRepository)
    generator = get_from_di_container(ICardGenerator)
    deck = repository.get_by_id(deck_id)
    if deck is None:
        return

    try:
        candidates = generator.generate(deck.source_text, deck.requested_cards)
        cards = [
            Card(deck_id=deck.id, **candidate.model_dump())
            for candidate in candidates[: deck.requested_cards]
        ]
        if len(cards) < 5:
            deck.status = DeckStatus.FAILED
            return
        repository.add_cards(cards)
        deck.status = DeckStatus.READY
    except Exception:
        logger.exception("Deck generation failed for deck %s", deck_id)
        deck.status = DeckStatus.FAILED
