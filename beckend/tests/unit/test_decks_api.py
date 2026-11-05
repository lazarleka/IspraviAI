from __future__ import annotations

from datetime import UTC, datetime
from unittest.mock import Mock

import pytest
from fastapi.testclient import TestClient

from app.decks.exceptions.deck import DeckNotFoundException, NotDeckOwnerException
from app.decks.models.deck import DeckKind, DeckSourceType, DeckStatus, DeckSubject
from app.decks.schemas.deck import DeckResponseSchema
from app.utils.pagination import Page

pytestmark = pytest.mark.unit


def deck_response(deck_id: int = 1) -> DeckResponseSchema:
    return DeckResponseSchema(
        id=deck_id,
        title="Fotosinteza",
        subject=DeckSubject.BIOLOGY,
        source_type=DeckSourceType.TOPIC,
        topic="Fotosinteza",
        file_name=None,
        kind=DeckKind.STUDY,
        status=DeckStatus.GENERATING,
        requested_cards=10,
        card_count=0,
        progress=0,
        due_count=0,
        owner_id=1,
        created_at=datetime(2026, 11, 4, tzinfo=UTC),
    )


def test_create_deck_returns_201(client: TestClient, deck_service: Mock) -> None:
    deck_service.create.return_value = deck_response()

    response = client.post(
        "/api/decks",
        json={"topic": "Fotosinteza", "requestedCards": 10},
        headers={"Authorization": "Bearer token"},
    )

    assert response.status_code == 201
    assert response.json()["status"] == "generating"
    call = deck_service.create.call_args.kwargs
    assert call["data"].requested_cards == 10
    assert call["current_user"].id == 1


def test_create_deck_validates_card_count(client: TestClient, deck_service: Mock) -> None:
    response = client.post(
        "/api/decks",
        json={"topic": "Fotosinteza", "requestedCards": 4},
        headers={"Authorization": "Bearer token"},
    )

    assert response.status_code == 422
    deck_service.create.assert_not_called()


def test_list_decks_returns_page(client: TestClient, deck_service: Mock) -> None:
    deck_service.list.return_value = Page(total=1, items=[deck_response()], pages=1)

    response = client.get("/api/decks", headers={"Authorization": "Bearer token"})

    assert response.status_code == 200
    assert response.json()["items"][0]["requestedCards"] == 10


def test_get_unknown_deck_is_404(client: TestClient, deck_service: Mock) -> None:
    deck_service.get.side_effect = DeckNotFoundException()

    response = client.get("/api/decks/99", headers={"Authorization": "Bearer token"})

    assert response.status_code == 404
    assert response.json()["code"] == "deck_not_found"


def test_delete_other_users_deck_is_403(client: TestClient, deck_service: Mock) -> None:
    deck_service.delete.side_effect = NotDeckOwnerException()

    response = client.delete("/api/decks/1", headers={"Authorization": "Bearer token"})

    assert response.status_code == 403
    assert response.json()["code"] == "not_deck_owner"
