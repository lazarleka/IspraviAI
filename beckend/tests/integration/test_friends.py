from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from tests.integration.conftest import register

pytestmark = pytest.mark.integration


def test_friend_request_accept_list_and_remove(client: TestClient) -> None:
    ana = register(client, "ana@example.com", "ana")
    marko = register(client, "marko@example.com", "marko")

    sent = client.post("/api/friends/requests", json={"username": "marko"}, headers=ana)
    assert sent.status_code == 201, sent.text
    friendship_id = int(sent.json()["id"])
    assert sent.json()["online"] is False

    requests = client.get("/api/friends/requests", headers=marko)
    assert requests.status_code == 200
    assert requests.json()["incoming"][0]["friend"]["username"] == "ana"

    accepted = client.post(f"/api/friends/requests/{friendship_id}/accept", headers=marko)
    assert accepted.status_code == 200
    assert accepted.json()["status"] == "accepted"

    friends = client.get("/api/friends", headers=ana)
    assert friends.status_code == 200
    assert friends.json()["items"][0]["friend"]["username"] == "marko"

    assert client.delete(f"/api/friends/{friendship_id}", headers=ana).status_code == 204


def test_duplicate_and_self_requests_have_domain_errors(client: TestClient) -> None:
    ana = register(client, "ana@example.com", "ana")
    register(client, "marko@example.com", "marko")
    first = client.post("/api/friends/requests", json={"username": "marko"}, headers=ana)
    assert first.status_code == 201

    duplicate = client.post("/api/friends/requests", json={"username": "marko"}, headers=ana)
    assert duplicate.status_code == 409
    assert duplicate.json()["code"] == "request_already_sent"

    yourself = client.post("/api/friends/requests", json={"username": "ana"}, headers=ana)
    assert yourself.status_code == 422
    assert yourself.json()["code"] == "cannot_befriend_yourself"


def test_sender_cannot_accept_and_stranger_cannot_delete(client: TestClient) -> None:
    ana = register(client, "ana@example.com", "ana")
    register(client, "marko@example.com", "marko")
    stranger = register(client, "jelena@example.com", "jelena")
    sent = client.post("/api/friends/requests", json={"username": "marko"}, headers=ana)
    friendship_id = int(sent.json()["id"])

    denied = client.post(f"/api/friends/requests/{friendship_id}/accept", headers=ana)
    assert denied.status_code == 403
    assert client.delete(f"/api/friends/{friendship_id}", headers=stranger).status_code == 404


def test_friend_routes_require_auth_and_validate(client: TestClient) -> None:
    assert client.get("/api/friends").status_code == 401
    invalid = client.post(
        "/api/friends/requests",
        json={"username": "X!"},
        headers=register(client, "ana@example.com", "ana"),
    )
    assert invalid.status_code == 422
