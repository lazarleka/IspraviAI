from __future__ import annotations

import asyncio
from dataclasses import dataclass, field
from datetime import UTC, datetime
from time import monotonic
from typing import Any

from starlette.concurrency import run_in_threadpool

from app.database.session_handler import db_session_handler
from app.decks.schemas.card import CardAnswerSchema, CardQuestionSchema
from app.matches.models.match import MatchStatus
from app.matches.models.match_answer import MatchAction, MatchAnswer
from app.matches.repositories.match import IMatchRepository
from app.matches.schemas.match import MatchResponseSchema
from app.realtime.registry import ConnectionRegistry
from app.users.schemas.user import PublicUserSchema
from app.utils.di import get_from_di_container

CARD_SECONDS = 20
BETWEEN_SECONDS = 3
COUNTDOWN_SECONDS = 3


@dataclass
class PlayerState:
    done: bool = False
    answer: MatchAnswer | None = None


@dataclass
class Room:
    match: MatchResponseSchema
    cards: list[CardAnswerSchema]
    joined: set[int] = field(default_factory=set)
    scores: dict[int, int] = field(default_factory=dict)
    streaks: dict[int, int] = field(default_factory=dict)
    players: dict[int, PlayerState] = field(default_factory=dict)
    index: int = 0
    card_started: float = 0
    card_ended: bool = True
    started: bool = False
    ready_at: datetime | None = None
    timer: asyncio.Task[None] | None = None
    disconnect_timers: dict[int, asyncio.Task[None]] = field(default_factory=dict)
    lock: asyncio.Lock = field(default_factory=asyncio.Lock)


@db_session_handler
def load_room(match_id: int) -> tuple[MatchResponseSchema, list[CardAnswerSchema]] | None:
    match = get_from_di_container(IMatchRepository).get_match(match_id)
    if match is None:
        return None
    response = MatchResponseSchema(
        id=match.id,
        challenge_id=match.challenge_id,
        deck_id=match.deck_id,
        topic=match.challenge.topic,
        player1=PublicUserSchema.model_validate(match.player1),
        player2=PublicUserSchema.model_validate(match.player2),
        player1_score=match.player1_score,
        player2_score=match.player2_score,
        status=match.status,
        winner_id=match.winner_id,
        started_at=match.started_at,
        finished_at=match.finished_at,
    )
    return response, [CardAnswerSchema.model_validate(card) for card in match.challenge.deck.cards]


@db_session_handler
def persist_card(match_id: int, scores: dict[int, int], answers: list[MatchAnswer]) -> None:
    repository = get_from_di_container(IMatchRepository)
    match = repository.get_match(match_id)
    if match is None:
        return
    match.player1_score = scores[match.player1_id]
    match.player2_score = scores[match.player2_id]
    repository.add_answers(answers)


@db_session_handler
def persist_status(match_id: int, status: MatchStatus, winner_id: int | None = None) -> None:
    match = get_from_di_container(IMatchRepository).get_match(match_id)
    if match is None:
        return
    match.status = status
    if status == MatchStatus.IN_PROGRESS:
        match.started_at = datetime.now(UTC)
    if status in {MatchStatus.FINISHED, MatchStatus.ABANDONED}:
        match.finished_at = datetime.now(UTC)
        match.winner_id = winner_id


class MatchEngine:
    def __init__(self, registry: ConnectionRegistry) -> None:
        self._registry = registry
        self._rooms: dict[int, Room] = {}

    async def handle(self, user_id: int, message: dict[str, Any]) -> None:
        message_type = message.get("type")
        match_id = message.get("matchId")
        if not isinstance(match_id, int):
            await self._error(user_id, "match_not_found", "Match not found")
            return
        if message_type == "match_join":
            await self.join(user_id, match_id)
        elif message_type == "match_tap":
            await self.tap(user_id, match_id, message.get("cardId"), message.get("selectedIndex"))
        elif message_type == "match_dont_know":
            await self.dont_know(user_id, match_id, message.get("cardId"))

    async def join(self, user_id: int, match_id: int) -> None:
        room = await self._get_room(match_id)
        if room is None:
            await self._error(user_id, "match_not_found", "Match not found")
            return
        player_ids = {room.match.player1.id, room.match.player2.id}
        if user_id not in player_ids:
            await self._error(user_id, "not_match_player", "Only players can join")
            return
        room.joined.add(user_id)
        grace = room.disconnect_timers.pop(user_id, None)
        if grace is not None:
            grace.cancel()
        if room.started:
            await self._send_current_state(room, user_id)
            return
        if room.joined != player_ids:
            return
        room.started = True
        starts_at = datetime.fromtimestamp(datetime.now(UTC).timestamp() + COUNTDOWN_SECONDS, UTC)
        room.ready_at = starts_at
        await self._broadcast(
            room,
            {
                "type": "match_ready",
                "matchId": match_id,
                "startsAt": starts_at.isoformat().replace("+00:00", "Z"),
            },
        )
        await run_in_threadpool(persist_status, match_id, MatchStatus.IN_PROGRESS)
        room.timer = asyncio.create_task(self._delayed_start(room))

    async def _send_current_state(self, room: Room, user_id: int) -> None:
        card = self._current_card(room)
        if room.card_started and not room.card_ended and card is not None:
            remaining = max(0.0, CARD_SECONDS - (monotonic() - room.card_started))
            ends_at = datetime.fromtimestamp(datetime.now(UTC).timestamp() + remaining, UTC)
            await self._registry.send_to_user_async(
                user_id,
                {
                    "type": "card_start",
                    "matchId": room.match.id,
                    "index": room.index,
                    "total": len(room.cards),
                    "card": self._question(card),
                    "endsAt": ends_at.isoformat().replace("+00:00", "Z"),
                },
            )
        elif room.ready_at is not None:
            await self._registry.send_to_user_async(
                user_id,
                {
                    "type": "match_ready",
                    "matchId": room.match.id,
                    "startsAt": room.ready_at.isoformat().replace("+00:00", "Z"),
                },
            )

    async def disconnected(self, user_id: int) -> None:
        for room in self._rooms.values():
            if not room.started or user_id not in {room.match.player1.id, room.match.player2.id}:
                continue
            room.joined.discard(user_id)
            await self._send_opponent(
                room,
                user_id,
                {"type": "opponent_disconnected", "matchId": room.match.id, "graceSeconds": 15},
            )
            room.disconnect_timers[user_id] = asyncio.create_task(
                self._abandon_after_grace(room, user_id)
            )

    async def _abandon_after_grace(self, room: Room, user_id: int) -> None:
        await asyncio.sleep(15)
        if user_id in room.joined:
            return
        winner = (
            room.match.player2.id if user_id == room.match.player1.id else room.match.player1.id
        )
        room.match.status = MatchStatus.ABANDONED
        room.match.winner_id = winner
        await run_in_threadpool(persist_status, room.match.id, MatchStatus.ABANDONED, winner)
        await self._broadcast(
            room,
            {
                "type": "match_end",
                "matchId": room.match.id,
                "winnerId": winner,
                "status": "abandoned",
                "scores": {str(key): value for key, value in room.scores.items()},
            },
        )

    async def tap(self, user_id: int, match_id: int, card_id: Any, selected_index: Any) -> None:
        room = self._rooms.get(match_id)
        if room is None or not isinstance(card_id, int):
            await self._error(user_id, "match_not_found", "Match not found")
            return
        async with room.lock:
            card = self._current_card(room)
            if card is None or card.id != card_id or room.card_ended:
                await self._error(user_id, "card_already_ended", "Card already ended")
                return
            state = room.players.get(user_id)
            if state is None or state.done:
                await self._error(user_id, "already_answered", "Already answered")
                return
            if selected_index is not None and not isinstance(selected_index, int):
                return
            response_ms = min(CARD_SECONDS * 1000, round((monotonic() - room.card_started) * 1000))
            correct = selected_index == card.wrong_index
            points = (
                10 + round(5 * (CARD_SECONDS * 1000 - response_ms) / (CARD_SECONDS * 1000))
                if correct
                else -5
            )
            if correct:
                room.streaks[user_id] += 1
                if room.streaks[user_id] % 3 == 0:
                    points += 5
            room.scores[user_id] += points
            answer = MatchAnswer(
                match_id=match_id,
                card_id=card.id,
                user_id=user_id,
                action=MatchAction.TAP,
                selected_index=selected_index,
                correct=correct,
                response_ms=response_ms,
                points=points,
            )
            state.done = True
            state.answer = answer
            await self._registry.send_to_user_async(
                user_id,
                {
                    "type": "answer_result",
                    "matchId": match_id,
                    "cardId": card.id,
                    "correct": correct,
                    "points": points,
                },
            )
            if correct:
                await self._end_card(room, user_id, "correct")
            else:
                await self._send_opponent(
                    room,
                    user_id,
                    {
                        "type": "opponent_action",
                        "matchId": match_id,
                        "cardId": card.id,
                        "action": "wrong",
                    },
                )
                if all(player.done for player in room.players.values()):
                    await self._end_card(room, None, "both_done")

    async def dont_know(self, user_id: int, match_id: int, card_id: Any) -> None:
        room = self._rooms.get(match_id)
        if room is None or not isinstance(card_id, int):
            return
        async with room.lock:
            card = self._current_card(room)
            state = room.players.get(user_id)
            if card is None or card.id != card_id or state is None or state.done or room.card_ended:
                return
            state.done = True
            state.answer = MatchAnswer(
                match_id=match_id,
                card_id=card.id,
                user_id=user_id,
                action=MatchAction.DONT_KNOW,
                selected_index=None,
                correct=False,
                response_ms=round((monotonic() - room.card_started) * 1000),
                points=0,
            )
            await self._send_opponent(
                room,
                user_id,
                {
                    "type": "opponent_action",
                    "matchId": match_id,
                    "cardId": card.id,
                    "action": "dont_know",
                },
            )
            if all(player.done for player in room.players.values()):
                await self._end_card(room, None, "both_done")

    async def _get_room(self, match_id: int) -> Room | None:
        if match_id in self._rooms:
            return self._rooms[match_id]
        loaded = await run_in_threadpool(load_room, match_id)
        if loaded is None:
            return None
        match, cards = loaded
        ids = (match.player1.id, match.player2.id)
        room = Room(
            match=match,
            cards=cards,
            scores={ids[0]: match.player1_score, ids[1]: match.player2_score},
            streaks={ids[0]: 0, ids[1]: 0},
        )
        self._rooms[match_id] = room
        return room

    async def _delayed_start(self, room: Room) -> None:
        await asyncio.sleep(COUNTDOWN_SECONDS)
        await self._start_card(room)

    async def _start_card(self, room: Room) -> None:
        card = self._current_card(room)
        if card is None:
            await self._finish(room)
            return
        room.card_started = monotonic()
        room.card_ended = False
        room.players = {room.match.player1.id: PlayerState(), room.match.player2.id: PlayerState()}
        ends_at = datetime.fromtimestamp(datetime.now(UTC).timestamp() + CARD_SECONDS, UTC)
        await self._broadcast(
            room,
            {
                "type": "card_start",
                "matchId": room.match.id,
                "index": room.index,
                "total": len(room.cards),
                "card": self._question(card),
                "endsAt": ends_at.isoformat().replace("+00:00", "Z"),
            },
        )
        room.timer = asyncio.create_task(self._timeout(room, card.id))

    async def _timeout(self, room: Room, card_id: int) -> None:
        await asyncio.sleep(CARD_SECONDS)
        async with room.lock:
            card = self._current_card(room)
            if not room.card_ended and card is not None and card.id == card_id:
                await self._end_card(room, None, "timeout")

    async def _end_card(self, room: Room, winner_id: int | None, reason: str) -> None:
        card = self._current_card(room)
        if card is None or room.card_ended:
            return
        room.card_ended = True
        current = asyncio.current_task()
        if room.timer is not None and room.timer is not current:
            room.timer.cancel()
        answers = [state.answer for state in room.players.values() if state.answer is not None]
        for user_id, state in room.players.items():
            if user_id != winner_id:
                room.streaks[user_id] = 0
            if state.answer is None:
                answers.append(
                    MatchAnswer(
                        match_id=room.match.id,
                        card_id=card.id,
                        user_id=user_id,
                        action=MatchAction.TIMEOUT,
                        selected_index=None,
                        correct=False,
                        response_ms=None,
                        points=0,
                    )
                )
        await run_in_threadpool(persist_card, room.match.id, room.scores.copy(), answers)
        await self._broadcast(
            room,
            {
                "type": "card_end",
                "matchId": room.match.id,
                "cardId": card.id,
                "winnerId": winner_id,
                "reason": reason,
                "card": card.model_dump(by_alias=True, mode="json"),
                "scores": {str(k): v for k, v in room.scores.items()},
            },
        )
        room.index += 1
        room.timer = asyncio.create_task(self._next_after_pause(room))

    async def _next_after_pause(self, room: Room) -> None:
        await asyncio.sleep(BETWEEN_SECONDS)
        await self._start_card(room)

    async def _finish(self, room: Room) -> None:
        first, second = room.match.player1.id, room.match.player2.id
        winner = (
            None
            if room.scores[first] == room.scores[second]
            else first if room.scores[first] > room.scores[second] else second
        )
        room.match.status = MatchStatus.FINISHED
        room.match.winner_id = winner
        await run_in_threadpool(persist_status, room.match.id, MatchStatus.FINISHED, winner)
        await self._broadcast(
            room,
            {
                "type": "match_end",
                "matchId": room.match.id,
                "winnerId": winner,
                "status": "finished",
                "scores": {str(k): v for k, v in room.scores.items()},
            },
        )

    def _current_card(self, room: Room) -> CardAnswerSchema | None:
        return room.cards[room.index] if room.index < len(room.cards) else None

    @staticmethod
    def _question(card: CardAnswerSchema) -> dict[str, Any]:
        return CardQuestionSchema(
            id=card.id,
            deck_id=card.deck_id,
            kind=card.kind,
            language=card.language,
            segments=card.segments,
        ).model_dump(by_alias=True, mode="json")

    async def _broadcast(self, room: Room, message: dict[str, Any]) -> None:
        await asyncio.gather(
            self._registry.send_to_user_async(room.match.player1.id, message),
            self._registry.send_to_user_async(room.match.player2.id, message),
        )

    async def _send_opponent(self, room: Room, actor_id: int, message: dict[str, Any]) -> None:
        opponent = (
            room.match.player2.id if actor_id == room.match.player1.id else room.match.player1.id
        )
        await self._registry.send_to_user_async(opponent, message)

    async def _error(self, user_id: int, code: str, detail: str) -> None:
        await self._registry.send_to_user_async(
            user_id, {"type": "error", "code": code, "detail": detail}
        )
