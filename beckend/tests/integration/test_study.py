from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

pytestmark = pytest.mark.integration


def create_deck_and_get_card(client: TestClient, headers: dict[str, str]) -> tuple[int, int]:
    created = client.post(
        "/api/decks",
        json={"topic": "Fotosinteza kod biljaka", "requestedCards": 5},
        headers=headers,
    )
    assert created.status_code == 201, created.text
    deck_id = int(created.json()["id"])
    cards = client.get(f"/api/study/decks/{deck_id}/next", headers=headers)
    assert cards.status_code == 200, cards.text
    return deck_id, int(cards.json()["items"][0]["id"])


def test_next_hides_answers_and_correct_answer_reveals_them(
    client: TestClient, auth_headers: dict[str, str]
) -> None:
    deck_id, card_id = create_deck_and_get_card(client, auth_headers)
    question = client.get(f"/api/study/decks/{deck_id}/next", headers=auth_headers).json()["items"][
        0
    ]
    assert "wrongIndex" not in question
    assert "correctText" not in question

    answered = client.post(
        f"/api/study/cards/{card_id}/answer",
        json={"selectedIndex": 1, "attempt": 1},
        headers=auth_headers,
    )

    assert answered.status_code == 200
    assert answered.json()["correct"] is True
    assert answered.json()["points"] == 10
    assert answered.json()["card"]["wrongIndex"] == 1


def test_wrong_first_attempt_does_not_reveal_answer(
    client: TestClient, auth_headers: dict[str, str]
) -> None:
    _, card_id = create_deck_and_get_card(client, auth_headers)

    response = client.post(
        f"/api/study/cards/{card_id}/answer",
        json={"selectedIndex": 0, "attempt": 1},
        headers=auth_headers,
    )

    assert response.status_code == 200
    assert response.json() == {"correct": False, "points": 0, "card": None}


def test_today_and_report(client: TestClient, auth_headers: dict[str, str]) -> None:
    _, card_id = create_deck_and_get_card(client, auth_headers)

    today = client.get("/api/study/today", headers=auth_headers)
    assert today.status_code == 200
    assert today.json()["dueCount"] == 5

    reported = client.post(f"/api/study/cards/{card_id}/report", json={}, headers=auth_headers)
    assert reported.status_code == 204


def test_other_user_cannot_study_deck(
    client: TestClient,
    auth_headers: dict[str, str],
    other_auth_headers: dict[str, str],
) -> None:
    deck_id, card_id = create_deck_and_get_card(client, auth_headers)

    assert (
        client.get(f"/api/study/decks/{deck_id}/next", headers=other_auth_headers).status_code
        == 403
    )
    assert (
        client.post(
            f"/api/study/cards/{card_id}/answer",
            json={"selectedIndex": 1, "attempt": 1},
            headers=other_auth_headers,
        ).status_code
        == 403
    )


def test_study_validates_and_requires_authentication(
    client: TestClient, auth_headers: dict[str, str]
) -> None:
    _, card_id = create_deck_and_get_card(client, auth_headers)

    assert client.get("/api/study/today").status_code == 401
    invalid = client.post(
        f"/api/study/cards/{card_id}/answer",
        json={"selectedIndex": -1, "attempt": 3},
        headers=auth_headers,
    )
    assert invalid.status_code == 422
