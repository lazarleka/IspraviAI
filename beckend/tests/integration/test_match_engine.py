from __future__ import annotations

import asyncio
from typing import Any, cast

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select

import app.matches.engine.room as room_module
from app.database.session_factory import ISessionFactory
from app.matches.engine.room import MatchEngine
from app.matches.models.match_answer import MatchAction, MatchAnswer
from app.realtime.registry import ConnectionRegistry
from app.utils.di import get_from_di_container

pytestmark = pytest.mark.integration


class FakeRegistry:
    def __init__(self) -> None:
        self.messages: dict[int, list[dict[str, Any]]] = {}

    async def send_to_user_async(self, user_id: int, message: dict[str, Any]) -> None:
        self.messages.setdefault(user_id, []).append(message)


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


def test_two_players_start_and_score_live_card(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(room_module, "COUNTDOWN_SECONDS", 0)
    monkeypatch.setattr(room_module, "BETWEEN_SECONDS", 60)
    _, ana_headers = register_with_token(client, "ana@example.com", "ana")
    _, marko_headers = register_with_token(client, "marko@example.com", "marko")

    request = client.post("/api/friends/requests", json={"username": "marko"}, headers=ana_headers)
    friendship_id = int(request.json()["id"])
    client.post(f"/api/friends/requests/{friendship_id}/accept", headers=marko_headers)
    challenge = client.post(
        "/api/challenges",
        json={"opponentId": 2, "topic": "Fotosinteza", "cardCount": 5},
        headers=ana_headers,
    )
    accepted = client.post(
        f"/api/challenges/{challenge.json()['id']}/accept", headers=marko_headers
    )
    match_id = int(accepted.json()["matchId"])

    registry = FakeRegistry()
    engine = MatchEngine(cast(ConnectionRegistry, registry))

    async def play_card() -> None:
        await engine.join(1, match_id)
        await engine.join(2, match_id)
        for _ in range(20):
            if any(message["type"] == "card_start" for message in registry.messages[1]):
                break
            await asyncio.sleep(0.01)
        card_start = next(
            message for message in registry.messages[1] if message["type"] == "card_start"
        )
        card = cast(dict[str, Any], card_start["card"])
        assert "wrongIndex" not in card

        await engine.join(1, match_id)
        assert sum(message["type"] == "card_start" for message in registry.messages[1]) == 2

        await engine.tap(1, match_id, card["id"], 1)
        assert not any(
            message["type"] in {"answer_result", "card_end", "opponent_action"}
            for messages in registry.messages.values()
            for message in messages
        )
        await engine.dont_know(2, match_id, card["id"])

    asyncio.run(play_card())
    answer = next(message for message in registry.messages[1] if message["type"] == "answer_result")
    ana_end = next(message for message in registry.messages[1] if message["type"] == "card_end")
    marko_end = next(message for message in registry.messages[2] if message["type"] == "card_end")
    assert answer["correct"] is True
    assert cast(int, answer["points"]) >= 10
    assert ana_end["type"] == marko_end["type"] == "card_end"
    assert ana_end["winnerId"] == 1
    assert cast(dict[str, Any], ana_end["card"])["wrongIndex"] == 1
    with get_from_di_container(ISessionFactory)() as session:
        answers = list(
            session.scalars(select(MatchAnswer).where(MatchAnswer.match_id == match_id)).all()
        )
    assert len(answers) == 2
    assert {answer.action for answer in answers} == {MatchAction.TAP, MatchAction.DONT_KNOW}
