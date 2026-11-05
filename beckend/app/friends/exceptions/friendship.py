from __future__ import annotations

from fastapi import status

from app.utils.exceptions import (
    ConflictException,
    ForbiddenException,
    HTTPExceptionWithCode,
    NotFoundException,
)


class UserNotFoundException(NotFoundException):
    def __init__(self) -> None:
        super().__init__(message="User not found", code="user_not_found")


class FriendshipNotFoundException(NotFoundException):
    def __init__(self) -> None:
        super().__init__(message="Friendship not found", code="friendship_not_found")


class AlreadyFriendsException(ConflictException):
    def __init__(self) -> None:
        super().__init__(message="You are already friends", code="already_friends")


class RequestAlreadySentException(ConflictException):
    def __init__(self) -> None:
        super().__init__(message="Friend request already sent", code="request_already_sent")


class NotRequestReceiverException(ForbiddenException):
    def __init__(self) -> None:
        super().__init__(
            message="Only the receiver can accept this request", code="not_request_receiver"
        )


class CannotBefriendYourselfException(HTTPExceptionWithCode):
    def __init__(self) -> None:
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="You cannot befriend yourself",
            code="cannot_befriend_yourself",
        )
