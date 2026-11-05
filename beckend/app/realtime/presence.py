from __future__ import annotations

from typing import Protocol

from app.utils.di import inject


class IPresence(Protocol):
    def is_online(self, user_id: int) -> bool: ...


@inject(alias=IPresence)
class OfflinePresence(IPresence):
    def is_online(self, user_id: int) -> bool:
        del user_id
        return False
