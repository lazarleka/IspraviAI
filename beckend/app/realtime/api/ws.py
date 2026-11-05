from __future__ import annotations

import asyncio
from contextlib import suppress
from typing import Any, cast

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from starlette.concurrency import run_in_threadpool

from app.auth.schemas.auth import CurrentUser
from app.auth.services.auth import IAuthService
from app.database.session_handler import db_session_handler
from app.friends.repositories.friendship import IFriendshipRepository
from app.matches.engine.room import MatchEngine
from app.realtime.registry import ConnectionRegistry
from app.utils.di import get_from_di_container
from app.utils.pagination import PaginationParams

router = APIRouter()


@db_session_handler
def authenticate(token: str) -> CurrentUser:
    return get_from_di_container(IAuthService).get_current_user(token)


@db_session_handler
def friend_ids(user_id: int) -> list[int]:
    rows = get_from_di_container(IFriendshipRepository).list_accepted(
        user_id, PaginationParams(page=1, size=500)
    )
    return [
        row.user_high_id if row.user_low_id == user_id else row.user_low_id for row in rows.items
    ]


async def notify_presence(user_id: int, online: bool, registry: ConnectionRegistry) -> None:
    ids = await run_in_threadpool(friend_ids, user_id)
    message = {"type": "presence", "userId": user_id, "online": online}
    await asyncio.gather(*(registry.send_to_user_async(friend_id, message) for friend_id in ids))


async def authenticate_first_message(websocket: WebSocket) -> CurrentUser | None:
    first = cast(dict[str, Any], await asyncio.wait_for(websocket.receive_json(), timeout=5))
    if first.get("type") != "auth" or not isinstance(first.get("token"), str):
        return None
    try:
        return await run_in_threadpool(authenticate, cast(str, first["token"]))
    except Exception:
        return None


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket) -> None:
    await websocket.accept()
    registry = get_from_di_container(ConnectionRegistry)
    user: CurrentUser | None = None
    try:
        user = await authenticate_first_message(websocket)
        if user is None:
            await websocket.close(code=4401)
            return

        became_online = await registry.add(user.id, websocket)
        await websocket.send_json({"type": "auth_ok", "userId": user.id})
        if became_online:
            await notify_presence(user.id, True, registry)

        while True:
            message = cast(dict[str, Any], await websocket.receive_json())
            if message.get("type") == "ping":
                await websocket.send_json({"type": "pong"})
            elif str(message.get("type", "")).startswith("match_"):
                await get_from_di_container(MatchEngine).handle(user.id, message)
    except (TimeoutError, WebSocketDisconnect):
        if user is None:
            with suppress(RuntimeError):
                await websocket.close(code=4401)
    finally:
        if user is not None:
            await get_from_di_container(MatchEngine).disconnected(user.id)
        if user is not None and registry.remove(user.id, websocket):
            await notify_presence(user.id, False, registry)
