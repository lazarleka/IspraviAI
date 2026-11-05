from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from tests.integration.conftest import register

pytestmark = pytest.mark.integration


def make_friends(client: TestClient) -> tuple[dict[str, str], dict[str, str], int]:
    ana = register(client, "ana@example.com", "ana")
    marko = register(client, "marko@example.com", "marko")
    sent = client.post("/api/friends/requests", json={"username": "marko"}, headers=ana)
    friendship_id = int(sent.json()["id"])
    client.post(f"/api/friends/requests/{friendship_id}/accept", headers=marko)
    return ana, marko, 2


def test_challenge_accept_and_get_match(client: TestClient) -> None:
    ana, marko, marko_id = make_friends(client)

    created = client.post(
        "/api/challenges",
        json={"opponentId": marko_id, "topic": "Fotosinteza", "cardCount": 5},
        headers=ana,
    )
    assert created.status_code == 201, created.text
    challenge_id = int(created.json()["id"])
    assert created.json()["deckStatus"] == "generating"

    pending = client.get("/api/challenges/pending", headers=marko)
    assert pending.json()["incoming"][0]["deckStatus"] == "ready"

    accepted = client.post(f"/api/challenges/{challenge_id}/accept", headers=marko)
    assert accepted.status_code == 200, accepted.text
    match_id = int(accepted.json()["matchId"])

    match = client.get(f"/api/matches/{match_id}", headers=ana)
    assert match.status_code == 200
    assert match.json()["topic"] == "Fotosinteza"
    assert client.get(f"/api/matches/{match_id}/result", headers=ana).status_code == 409


def test_challenge_requires_friendship_and_prevents_duplicate(client: TestClient) -> None:
    ana = register(client, "ana@example.com", "ana")
    register(client, "marko@example.com", "marko")
    body = {"opponentId": 2, "topic": "Istorija", "cardCount": 5}
    denied = client.post("/api/challenges", json=body, headers=ana)
    assert denied.status_code == 403
    assert denied.json()["code"] == "not_friends"


def test_duplicate_pending_challenge_is_409(client: TestClient) -> None:
    ana, _, marko_id = make_friends(client)
    body = {"opponentId": marko_id, "topic": "Istorija", "cardCount": 5}
    assert client.post("/api/challenges", json=body, headers=ana).status_code == 201
    duplicate = client.post("/api/challenges", json=body, headers=ana)
    assert duplicate.status_code == 409
    assert duplicate.json()["code"] == "challenge_already_pending"


def test_only_opponent_accepts_and_challenger_cancels(client: TestClient) -> None:
    ana, marko, marko_id = make_friends(client)
    created = client.post(
        "/api/challenges",
        json={"opponentId": marko_id, "topic": "Istorija", "cardCount": 5},
        headers=ana,
    )
    challenge_id = int(created.json()["id"])

    assert client.post(f"/api/challenges/{challenge_id}/accept", headers=ana).status_code == 403
    assert client.delete(f"/api/challenges/{challenge_id}", headers=marko).status_code == 403
    assert client.delete(f"/api/challenges/{challenge_id}", headers=ana).status_code == 204


def test_challenge_validates_and_requires_auth(client: TestClient) -> None:
    assert client.get("/api/challenges/pending").status_code == 401
    ana = register(client, "ana@example.com", "ana")
    invalid = client.post(
        "/api/challenges",
        json={"opponentId": 2, "topic": "x", "cardCount": 7},
        headers=ana,
    )
    assert invalid.status_code == 422
