from __future__ import annotations

from unittest.mock import Mock

import pytest
from fastapi.testclient import TestClient

from app.users.schemas.user import PublicUserSchema
from app.utils.pagination import Page

pytestmark = pytest.mark.unit


def test_search_users_returns_page(client: TestClient, user_service: Mock) -> None:
    user_service.search.return_value = Page(
        total=1,
        items=[PublicUserSchema(id=2, username="marko_v", display_name="Marko Vuković")],
        pages=1,
    )

    response = client.get(
        "/api/users?search=mar&page=1&size=10", headers={"Authorization": "Bearer token"}
    )

    assert response.status_code == 200
    assert response.json() == {
        "total": 1,
        "items": [{"id": 2, "username": "marko_v", "displayName": "Marko Vuković"}],
        "pages": 1,
    }
    call = user_service.search.call_args.kwargs
    assert call["search"] == "mar"
    assert call["pagination_params"].page == 1
    assert call["pagination_params"].size == 10
    assert call["current_user"].id == 1


def test_search_users_requires_authentication(client: TestClient, auth_service: Mock) -> None:
    from app.auth.exceptions.auth import NotAuthenticatedException

    auth_service.get_current_user.side_effect = NotAuthenticatedException()

    response = client.get("/api/users?search=ma")

    assert response.status_code == 401


def test_search_users_requires_two_characters(client: TestClient, user_service: Mock) -> None:
    response = client.get("/api/users?search=m", headers={"Authorization": "Bearer token"})

    assert response.status_code == 422
    assert "search" in response.json()["fieldErrors"]
    user_service.search.assert_not_called()
