from __future__ import annotations

import asyncio
from collections import defaultdict
from typing import Any

from anyio import BrokenResourceError, ClosedResourceError
from fastapi import WebSocket

from app.realtime.presence import IPresence


class ConnectionRegistry(IPresence):
    def __init__(self) -> None:
        self._connections: dict[int, set[WebSocket]] = defaultdict(set)
        self._loop: asyncio.AbstractEventLoop | None = None

    async def add(self, user_id: int, websocket: WebSocket) -> bool:
        self._loop = asyncio.get_running_loop()
        was_offline = not self._connections[user_id]
        self._connections[user_id].add(websocket)
        return was_offline

    def remove(self, user_id: int, websocket: WebSocket) -> bool:
        connections = self._connections.get(user_id)
        if connections is None:
            return False
        connections.discard(websocket)
        if connections:
            return False
        self._connections.pop(user_id, None)
        return True

    def is_online(self, user_id: int) -> bool:
        return bool(self._connections.get(user_id))

    async def send_to_user_async(self, user_id: int, message: dict[str, Any]) -> None:
        dead: list[WebSocket] = []
        for websocket in tuple(self._connections.get(user_id, ())):
            try:
                await websocket.send_json(message)
            except (BrokenResourceError, ClosedResourceError, RuntimeError):
                dead.append(websocket)
        for websocket in dead:
            self.remove(user_id, websocket)

    def send_to_user(self, user_id: int, message: dict[str, Any]) -> None:
        if self._loop is None or not self._loop.is_running():
            return
        asyncio.run_coroutine_threadsafe(self.send_to_user_async(user_id, message), self._loop)
