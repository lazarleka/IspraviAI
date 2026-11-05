from __future__ import annotations

from unittest.mock import Mock

import pytest
from fastapi.testclient import TestClient

from app.friends.exceptions.friendship import NotRequestReceiverException
from app.friends.schemas.friendship import FriendRequestsSchema

pytestmark = pytest.mark.unit


def test_requests_returns_groups(client: TestClient, friendship_service: Mock) -> None:
    friendship_service.requests.return_value = FriendRequestsSchema(incoming=[], outgoing=[])

    response = client.get("/api/friends/requests", headers={"Authorization": "Bearer token"})

    assert response.status_code == 200
    assert response.json() == {"incoming": [], "outgoing": []}


def test_create_validates_username(client: TestClient, friendship_service: Mock) -> None:
    response = client.post(
        "/api/friends/requests",
        json={"username": "A!"},
        headers={"Authorization": "Bearer token"},
    )

    assert response.status_code == 422
    friendship_service.create.assert_not_called()


def test_only_receiver_can_accept(client: TestClient, friendship_service: Mock) -> None:
    friendship_service.accept.side_effect = NotRequestReceiverException()

    response = client.post(
        "/api/friends/requests/1/accept", headers={"Authorization": "Bearer token"}
    )

    assert response.status_code == 403
    assert response.json()["code"] == "not_request_receiver"
