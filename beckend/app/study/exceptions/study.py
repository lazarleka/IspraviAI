from __future__ import annotations

from app.utils.exceptions import ConflictException, NotFoundException


class CardNotFoundException(NotFoundException):
    def __init__(self) -> None:
        super().__init__(message="Card not found", code="card_not_found")


class DeckNotReadyException(ConflictException):
    def __init__(self) -> None:
        super().__init__(message="Deck is not ready", code="deck_not_ready")
