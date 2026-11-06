from __future__ import annotations

import pytest
from fastapi.testclient import TestClient


def test_register_then_me(client: TestClient) -> None:
    response = client.post(
        "/api/auth/register",
        json={
            "email": "Ana@Example.com",
            "password": "secret123",
            "displayName": "Ana",
            "username": "ana",
        },
    )

    assert response.status_code == 201
    body = response.json()
    assert body["user"]["email"] == "ana@example.com"  # stored lowercase
    assert body["user"]["username"] == "ana"
    assert "password" not in body["user"]
    assert "passwordHash" not in body["user"]

    me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {body['token']}"})
    assert me.status_code == 200
    assert me.json()["displayName"] == "Ana"


@pytest.mark.usefixtures("auth_headers")
def test_register_twice_is_409(client: TestClient) -> None:
    response = client.post(
        "/api/auth/register",
        json={
            "email": "ana@example.com",
            "password": "secret123",
            "displayName": "Ana 2",
            "username": "ana_2",
        },
    )

    assert response.status_code == 409
    assert response.json()["fieldErrors"] == {"email": "Email is already registered"}


@pytest.mark.usefixtures("auth_headers")
def test_register_duplicate_username_is_409(client: TestClient) -> None:
    response = client.post(
        "/api/auth/register",
        json={
            "email": "different@example.com",
            "password": "secret123",
            "displayName": "Other Ana",
            "username": "ana",
        },
    )

    assert response.status_code == 409
    assert response.json() == {
        "detail": "Username is already taken",
        "code": "username_taken",
        "fieldErrors": {"username": "Username is already taken"},
    }


def test_register_rejects_invalid_username(client: TestClient) -> None:
    response = client.post(
        "/api/auth/register",
        json={
            "email": "ana@example.com",
            "password": "secret123",
            "displayName": "Ana",
            "username": "Ana!",
        },
    )

    assert response.status_code == 422
    assert "username" in response.json()["fieldErrors"]


@pytest.mark.usefixtures("auth_headers")
def test_login_ok_and_wrong_password(client: TestClient) -> None:
    ok = client.post(
        "/api/auth/login", json={"identifier": "ana@example.com", "password": "secret123"}
    )
    assert ok.status_code == 200
    assert ok.json()["token"]

    by_username = client.post(
        "/api/auth/login", json={"identifier": "ANA", "password": "secret123"}
    )
    assert by_username.status_code == 200
    assert by_username.json()["user"]["email"] == "ana@example.com"

    wrong = client.post("/api/auth/login", json={"identifier": "ana", "password": "nope"})
    assert wrong.status_code == 401
    assert wrong.json() == {
        "detail": "Invalid email, username or password",
        "code": "invalid_credentials",
    }


def test_login_unknown_email_gives_the_same_401(client: TestClient) -> None:
    response = client.post(
        "/api/auth/login",
        json={"identifier": "nobody@example.com", "password": "secret123"},
    )

    assert response.status_code == 401
    assert response.json()["code"] == "invalid_credentials"


def test_me_with_garbage_token_is_401(client: TestClient) -> None:
    response = client.get("/api/auth/me", headers={"Authorization": "Bearer not-a-jwt"})

    assert response.status_code == 401
    assert response.json()["code"] == "invalid_token"
