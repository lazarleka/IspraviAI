from __future__ import annotations

from app.utils.exceptions import NotFoundException


class UserNotFoundException(NotFoundException):
    def __init__(self) -> None:
        super().__init__(message="User not found", code="user_not_found")
