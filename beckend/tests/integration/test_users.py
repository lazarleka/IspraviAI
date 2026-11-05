from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from tests.integration.conftest import register

pytestmark = pytest.mark.integration


def test_search_users_matches_prefix_and_excludes_self(client: TestClient) -> None:
    auth = register(client, "marko@example.com", "marko")
    register(client, "marko.v@example.com", "marko_v")
    register(client, "marija@example.com", "marija")
    register(client, "ana@example.com", "ana")

    response = client.get("/api/users?search=mark", headers=auth)

    assert response.status_code == 200
    assert response.json() == {
        "total": 1,
        "items": [{"id": 2, "username": "marko_v", "displayName": "marko_v"}],
        "pages": 1,
    }


def test_search_users_is_case_insensitive(client: TestClient) -> None:
    auth = register(client, "ana@example.com", "ana")
    register(client, "marko@example.com", "marko_v")

    response = client.get("/api/users?search=MAR", headers=auth)

    assert response.status_code == 200
    assert [item["username"] for item in response.json()["items"]] == ["marko_v"]


def test_search_users_requires_authentication(client: TestClient) -> None:
    response = client.get("/api/users?search=ma")

    assert response.status_code == 401


def test_search_users_requires_two_characters(
    client: TestClient, auth_headers: dict[str, str]
) -> None:
    response = client.get("/api/users?search=m", headers=auth_headers)

    assert response.status_code == 422
    assert "search" in response.json()["fieldErrors"]
