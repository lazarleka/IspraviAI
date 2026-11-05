from __future__ import annotations

from typing import Protocol

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database.session_factory import ISessionFactory
from app.decks.models.card import Card
from app.decks.models.deck import Deck, DeckKind
from app.utils.di import inject
from app.utils.pagination import Page, PaginationParams, paginate


class IDeckRepository(Protocol):
    def list_for_owner(self, owner_id: int, pagination_params: PaginationParams) -> Page[Deck]: ...

    def get_by_id(self, deck_id: int) -> Deck | None: ...

    def add(self, deck: Deck) -> Deck: ...

    def add_cards(self, cards: list[Card]) -> None: ...

    def delete(self, deck: Deck) -> None: ...


@inject(alias=IDeckRepository)
class DeckRepository(IDeckRepository):
    def __init__(self, session_factory: ISessionFactory) -> None:
        self._session_factory = session_factory

    def list_for_owner(self, owner_id: int, pagination_params: PaginationParams) -> Page[Deck]:
        db = self._session_factory()
        query = (
            select(Deck)
            .options(selectinload(Deck.cards))
            .where(Deck.owner_id == owner_id, Deck.kind == DeckKind.STUDY)
            .order_by(Deck.created_at.desc(), Deck.id.desc())
        )
        return paginate(query=query, pagination_params=pagination_params, db=db)

    def get_by_id(self, deck_id: int) -> Deck | None:
        db = self._session_factory()
        return db.scalar(select(Deck).options(selectinload(Deck.cards)).where(Deck.id == deck_id))

    def add(self, deck: Deck) -> Deck:
        db = self._session_factory()
        db.add(deck)
        db.flush()
        return deck

    def add_cards(self, cards: list[Card]) -> None:
        db = self._session_factory()
        db.add_all(cards)
        db.flush()

    def delete(self, deck: Deck) -> None:
        db = self._session_factory()
        db.delete(deck)
        db.flush()
