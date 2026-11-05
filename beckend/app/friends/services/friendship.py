from __future__ import annotations

from datetime import UTC, datetime
from typing import Protocol

from sqlalchemy.exc import IntegrityError

from app.auth.schemas.auth import CurrentUser
from app.friends.exceptions.friendship import (
    AlreadyFriendsException,
    CannotBefriendYourselfException,
    FriendshipNotFoundException,
    NotRequestReceiverException,
    RequestAlreadySentException,
    UserNotFoundException,
)
from app.friends.models.friendship import Friendship, FriendshipStatus
from app.friends.repositories.friendship import IFriendshipRepository
from app.friends.schemas.friendship import (
    FriendRequestCreateSchema,
    FriendRequestsSchema,
    FriendshipResponseSchema,
)
from app.realtime.presence import IPresence
from app.users.models.user import User
from app.users.schemas.user import PublicUserSchema
from app.utils.di import inject
from app.utils.pagination import Page, PaginationParams


class IFriendshipService(Protocol):
    def list(
        self, pagination: PaginationParams, current_user: CurrentUser
    ) -> Page[FriendshipResponseSchema]: ...

    def requests(self, current_user: CurrentUser) -> FriendRequestsSchema: ...

    def create(
        self, data: FriendRequestCreateSchema, current_user: CurrentUser
    ) -> FriendshipResponseSchema: ...

    def accept(self, friendship_id: int, current_user: CurrentUser) -> FriendshipResponseSchema: ...

    def delete(self, friendship_id: int, current_user: CurrentUser) -> None: ...


@inject(alias=IFriendshipService)
class FriendshipService(IFriendshipService):
    def __init__(self, repository: IFriendshipRepository, presence: IPresence) -> None:
        self._repository = repository
        self._presence = presence

    def list(
        self, pagination: PaginationParams, current_user: CurrentUser
    ) -> Page[FriendshipResponseSchema]:
        rows = self._repository.list_accepted(current_user.id, pagination)
        return Page(
            total=rows.total,
            items=[self._response(row, current_user.id) for row in rows.items],
            pages=rows.pages,
        )

    def requests(self, current_user: CurrentUser) -> FriendRequestsSchema:
        rows = self._repository.list_pending(current_user.id)
        return FriendRequestsSchema(
            incoming=[
                self._response(row, current_user.id)
                for row in rows
                if row.requested_by_id != current_user.id
            ],
            outgoing=[
                self._response(row, current_user.id)
                for row in rows
                if row.requested_by_id == current_user.id
            ],
        )

    def create(
        self, data: FriendRequestCreateSchema, current_user: CurrentUser
    ) -> FriendshipResponseSchema:
        user = self._repository.get_user_by_username(data.username.lower())
        if user is None:
            raise UserNotFoundException
        if user.id == current_user.id:
            raise CannotBefriendYourselfException
        existing = self._repository.get_pair(current_user.id, user.id)
        if existing is not None:
            if existing.status == FriendshipStatus.ACCEPTED:
                raise AlreadyFriendsException
            raise RequestAlreadySentException
        low_id, high_id = sorted((current_user.id, user.id))
        try:
            friendship = self._repository.add(
                Friendship(
                    user_low_id=low_id,
                    user_high_id=high_id,
                    requested_by_id=current_user.id,
                )
            )
        except IntegrityError as error:
            raise RequestAlreadySentException from error
        return self._response(friendship, current_user.id, friend=user)

    def accept(self, friendship_id: int, current_user: CurrentUser) -> FriendshipResponseSchema:
        friendship = self._get_participating(friendship_id, current_user)
        if friendship.requested_by_id == current_user.id:
            raise NotRequestReceiverException
        friendship.status = FriendshipStatus.ACCEPTED
        friendship.accepted_at = datetime.now(UTC)
        return self._response(friendship, current_user.id)

    def delete(self, friendship_id: int, current_user: CurrentUser) -> None:
        self._repository.delete(self._get_participating(friendship_id, current_user))

    def _get_participating(self, friendship_id: int, current_user: CurrentUser) -> Friendship:
        friendship = self._repository.get_by_id(friendship_id)
        if friendship is None or current_user.id not in {
            friendship.user_low_id,
            friendship.user_high_id,
        }:
            raise FriendshipNotFoundException
        return friendship

    def _response(
        self, friendship: Friendship, viewer_id: int, friend: User | None = None
    ) -> FriendshipResponseSchema:
        resolved_friend = friend or (
            friendship.user_high if friendship.user_low_id == viewer_id else friendship.user_low
        )
        return FriendshipResponseSchema(
            id=friendship.id,
            requested_by_id=friendship.requested_by_id,
            status=friendship.status,
            friend=PublicUserSchema.model_validate(resolved_friend),
            online=self._presence.is_online(resolved_friend.id),
            created_at=friendship.created_at,
            accepted_at=friendship.accepted_at,
        )
