from __future__ import annotations

from unittest.mock import Mock

import pytest
from fastapi.testclient import TestClient

from app.auth.exceptions.auth import UsernameTakenException
from app.users.schemas.user import PublicUserSchema, UserResponseSchema, UserStatsSchema
from app.utils.pagination import Page
from tests.utils import create_current_user

pytestmark = pytest.mark.unit


def test_profile_stats_returns_summary(client: TestClient, user_service: Mock) -> None:
    user_service.stats.return_value = UserStatsSchema(
        matches_played=4,
        wins=3,
        losses=1,
        draws=0,
        win_rate=75,
        total_score=120,
        best_score=45,
        cards_reviewed=30,
        correct_answers=24,
        wrong_answers=6,
        accuracy=80,
    )

    response = client.get("/api/users/me/stats", headers={"Authorization": "Bearer token"})

    assert response.status_code == 200
    assert response.json()["winRate"] == 75
    assert response.json()["cardsReviewed"] == 30
    assert user_service.stats.call_args.kwargs["current_user"].id == 1


def test_profile_stats_requires_authentication(client: TestClient, auth_service: Mock) -> None:
    from app.auth.exceptions.auth import NotAuthenticatedException

    auth_service.get_current_user.side_effect = NotAuthenticatedException()

    response = client.get("/api/users/me/stats")

    assert response.status_code == 401


def test_update_profile_returns_updated_user(client: TestClient, user_service: Mock) -> None:
    updated = create_current_user(1, "test@example.com", "ana_nova")
    updated.display_name = "Ana Nova"
    updated.avatar_color = "purple"
    updated.daily_goal = 20
    updated.sound_enabled = False
    user_service.update_profile.return_value = UserResponseSchema.model_validate(updated)

    response = client.patch(
        "/api/users/me",
        headers={"Authorization": "Bearer token"},
        json={
            "displayName": "Ana Nova",
            "username": "ana_nova",
            "avatarColor": "purple",
            "dailyGoal": 20,
            "soundEnabled": False,
        },
    )

    assert response.status_code == 200
    assert response.json()["displayName"] == "Ana Nova"
    assert response.json()["avatarColor"] == "purple"
    call = user_service.update_profile.call_args.kwargs
    assert call["data"].username == "ana_nova"
    assert call["current_user"].id == 1


def test_update_profile_requires_authentication(client: TestClient, auth_service: Mock) -> None:
    from app.auth.exceptions.auth import NotAuthenticatedException

    auth_service.get_current_user.side_effect = NotAuthenticatedException()

    response = client.patch("/api/users/me", json={"displayName": "Ana"})

    assert response.status_code == 401


def test_update_profile_rejects_invalid_username(client: TestClient, user_service: Mock) -> None:
    response = client.patch(
        "/api/users/me",
        headers={"Authorization": "Bearer token"},
        json={"username": "Ana Ne Moze"},
    )

    assert response.status_code == 422
    assert "username" in response.json()["fieldErrors"]
    user_service.update_profile.assert_not_called()


def test_update_profile_returns_username_conflict(client: TestClient, user_service: Mock) -> None:
    user_service.update_profile.side_effect = UsernameTakenException()

    response = client.patch(
        "/api/users/me",
        headers={"Authorization": "Bearer token"},
        json={"username": "zauzeto"},
    )

    assert response.status_code == 409
    assert response.json()["fieldErrors"] == {"username": "Username is already taken"}


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
