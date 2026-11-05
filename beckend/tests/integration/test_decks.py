from __future__ import annotations

from io import BytesIO
from typing import cast

import pytest
from fastapi.testclient import TestClient
from pypdf import PdfWriter

pytestmark = pytest.mark.integration


def create_deck(client: TestClient, headers: dict[str, str]) -> dict[str, object]:
    response = client.post(
        "/api/decks",
        json={"topic": "Fotosinteza kod biljaka", "requestedCards": 10},
        headers=headers,
    )
    assert response.status_code == 201, response.text
    return cast(dict[str, object], response.json())


def test_create_generates_cards_and_lists_deck(
    client: TestClient, auth_headers: dict[str, str]
) -> None:
    created = create_deck(client, auth_headers)

    assert created["status"] == "generating"
    loaded = client.get(f"/api/decks/{created['id']}", headers=auth_headers)
    assert loaded.status_code == 200
    assert loaded.json()["status"] == "ready"
    assert loaded.json()["cardCount"] == 10
    assert loaded.json()["subject"] == "biology"

    listed = client.get("/api/decks", headers=auth_headers)
    assert listed.status_code == 200
    assert listed.json()["total"] == 1


def test_deck_requires_authentication(client: TestClient) -> None:
    response = client.post("/api/decks", json={"topic": "Fotosinteza", "requestedCards": 10})

    assert response.status_code == 401


def test_create_validates_input(client: TestClient, auth_headers: dict[str, str]) -> None:
    response = client.post(
        "/api/decks",
        json={"topic": "x", "requestedCards": 21},
        headers=auth_headers,
    )

    assert response.status_code == 422
    assert set(response.json()["fieldErrors"]) == {"topic", "requestedCards"}


def test_only_owner_can_get_or_delete_deck(
    client: TestClient,
    auth_headers: dict[str, str],
    other_auth_headers: dict[str, str],
) -> None:
    created = create_deck(client, auth_headers)
    deck_url = f"/api/decks/{created['id']}"

    assert client.get(deck_url, headers=other_auth_headers).status_code == 403
    assert client.delete(deck_url, headers=other_auth_headers).status_code == 403
    assert client.delete(deck_url, headers=auth_headers).status_code == 204
    assert client.get(deck_url, headers=auth_headers).status_code == 404


def test_upload_txt_creates_deck(client: TestClient, auth_headers: dict[str, str]) -> None:
    response = client.post(
        "/api/decks/upload",
        data={"requestedCards": "5"},
        files={"file": ("biljke.md", b"Fotosinteza kod biljaka", "text/markdown")},
        headers=auth_headers,
    )

    assert response.status_code == 201, response.text
    assert response.json()["fileName"] == "biljke.md"


def test_upload_pdf_creates_deck(client: TestClient, auth_headers: dict[str, str]) -> None:
    buffer = BytesIO()
    writer = PdfWriter()
    writer.add_blank_page(width=200, height=200)
    writer.write(buffer)

    response = client.post(
        "/api/decks/upload",
        data={"requestedCards": "5"},
        files={"file": ("skripta.pdf", buffer.getvalue(), "application/pdf")},
        headers=auth_headers,
    )

    assert response.status_code == 201, response.text
    assert response.json()["fileName"] == "skripta.pdf"


def test_upload_rejects_unsupported_type(client: TestClient, auth_headers: dict[str, str]) -> None:
    response = client.post(
        "/api/decks/upload",
        data={"requestedCards": "5"},
        files={"file": ("notes.docx", b"data", "application/octet-stream")},
        headers=auth_headers,
    )

    assert response.status_code == 415, response.text
    assert response.json()["code"] == "unsupported_file_type"
