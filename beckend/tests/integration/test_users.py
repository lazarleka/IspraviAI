from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from tests.integration.conftest import register

pytestmark = pytest.mark.integration


def test_profile_stats_starts_at_zero(client: TestClient) -> None:
    auth = register(client, "ana@example.com", "ana")

    response = client.get("/api/users/me/stats", headers=auth)

    assert response.status_code == 200
    assert response.json() == {
        "matchesPlayed": 0,
        "wins": 0,
        "losses": 0,
        "draws": 0,
        "winRate": 0,
        "totalScore": 0,
        "bestScore": 0,
        "cardsReviewed": 0,
        "correctAnswers": 0,
        "wrongAnswers": 0,
        "accuracy": 0,
    }


def test_update_profile_persists_preferences(client: TestClient) -> None:
    auth = register(client, "ana@example.com", "ana")

    response = client.patch(
        "/api/users/me",
        headers=auth,
        json={
            "displayName": "Ana Petrović",
            "username": "ana_p",
            "avatarColor": "green",
            "dailyGoal": 20,
            "soundEnabled": False,
            "animationsEnabled": False,
        },
    )

    assert response.status_code == 200
    assert response.json() == {
        **response.json(),
        "displayName": "Ana Petrović",
        "username": "ana_p",
        "avatarColor": "green",
        "dailyGoal": 20,
        "soundEnabled": False,
        "animationsEnabled": False,
    }
    me = client.get("/api/auth/me", headers=auth)
    assert me.json()["username"] == "ana_p"
    assert me.json()["dailyGoal"] == 20


def test_update_profile_rejects_taken_username(client: TestClient) -> None:
    auth = register(client, "ana@example.com", "ana")
    register(client, "marko@example.com", "marko")

    response = client.patch("/api/users/me", headers=auth, json={"username": "marko"})

    assert response.status_code == 409
    assert response.json()["code"] == "username_taken"


def test_update_profile_requires_authentication(client: TestClient) -> None:
    response = client.patch("/api/users/me", json={"displayName": "Ana"})

    assert response.status_code == 401


def test_update_profile_validates_daily_goal(
    client: TestClient, auth_headers: dict[str, str]
) -> None:
    response = client.patch("/api/users/me", headers=auth_headers, json={"dailyGoal": 100})

    assert response.status_code == 422
    assert "dailyGoal" in response.json()["fieldErrors"]


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
