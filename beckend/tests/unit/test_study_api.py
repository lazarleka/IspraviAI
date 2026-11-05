from __future__ import annotations

from unittest.mock import Mock

import pytest
from fastapi.testclient import TestClient

from app.study.exceptions.study import CardNotFoundException, DeckNotReadyException
from app.study.schemas.study import NextCardsSchema, StudyTodaySchema

pytestmark = pytest.mark.unit


def test_today_returns_queue(client: TestClient, study_service: Mock) -> None:
    study_service.today.return_value = StudyTodaySchema(due_count=0, decks=[])

    response = client.get("/api/study/today", headers={"Authorization": "Bearer token"})

    assert response.status_code == 200
    assert response.json() == {"dueCount": 0, "decks": []}


def test_next_rejects_generating_deck(client: TestClient, study_service: Mock) -> None:
    study_service.next.side_effect = DeckNotReadyException()

    response = client.get("/api/study/decks/1/next", headers={"Authorization": "Bearer token"})

    assert response.status_code == 409
    assert response.json()["code"] == "deck_not_ready"


def test_next_validates_size(client: TestClient, study_service: Mock) -> None:
    study_service.next.return_value = NextCardsSchema(items=[])

    response = client.get(
        "/api/study/decks/1/next?size=0", headers={"Authorization": "Bearer token"}
    )

    assert response.status_code == 422
    study_service.next.assert_not_called()


def test_answer_unknown_card_is_404(client: TestClient, study_service: Mock) -> None:
    study_service.answer.side_effect = CardNotFoundException()

    response = client.post(
        "/api/study/cards/999/answer",
        json={"selectedIndex": 0, "attempt": 1},
        headers={"Authorization": "Bearer token"},
    )

    assert response.status_code == 404


def test_answer_validates_attempt(client: TestClient, study_service: Mock) -> None:
    response = client.post(
        "/api/study/cards/1/answer",
        json={"selectedIndex": 0, "attempt": 3},
        headers={"Authorization": "Bearer token"},
    )

    assert response.status_code == 422
    study_service.answer.assert_not_called()
