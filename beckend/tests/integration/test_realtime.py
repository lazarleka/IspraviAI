from __future__ import annotations

import pytest
from fastapi.testclient import TestClient
from starlette.websockets import WebSocketDisconnect

from tests.integration.conftest import register

pytestmark = pytest.mark.integration


def register_with_token(
    client: TestClient, email: str, username: str
) -> tuple[str, dict[str, str]]:
    response = client.post(
        "/api/auth/register",
        json={
            "email": email,
            "password": "secret123",
            "displayName": username,
            "username": username,
        },
    )
    assert response.status_code == 201, response.text
    token = str(response.json()["token"])
    return token, {"Authorization": f"Bearer {token}"}


def test_websocket_auth_and_ping(client: TestClient) -> None:
    token, _ = register_with_token(client, "ana@example.com", "ana")

    with client.websocket_connect("/api/ws") as websocket:
        websocket.send_json({"type": "auth", "token": token})
        assert websocket.receive_json() == {"type": "auth_ok", "userId": 1}
        websocket.send_json({"type": "ping"})
        assert websocket.receive_json() == {"type": "pong"}


def test_websocket_rejects_invalid_auth(client: TestClient) -> None:
    with client.websocket_connect("/api/ws") as websocket:
        websocket.send_json({"type": "auth", "token": "invalid"})
        with pytest.raises(WebSocketDisconnect) as error:
            websocket.receive_json()
        assert error.value.code == 4401


def test_friend_online_reflects_open_websocket(client: TestClient) -> None:
    ana_token, ana = register_with_token(client, "ana@example.com", "ana")
    marko = register(client, "marko@example.com", "marko")
    sent = client.post("/api/friends/requests", json={"username": "marko"}, headers=ana)
    friendship_id = int(sent.json()["id"])
    client.post(f"/api/friends/requests/{friendship_id}/accept", headers=marko)

    with client.websocket_connect("/api/ws") as websocket:
        websocket.send_json({"type": "auth", "token": ana_token})
        assert websocket.receive_json()["type"] == "auth_ok"
        friends = client.get("/api/friends", headers=marko)
        assert friends.json()["items"][0]["online"] is True

    friends = client.get("/api/friends", headers=marko)
    assert friends.json()["items"][0]["online"] is False
