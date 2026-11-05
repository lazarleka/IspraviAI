from __future__ import annotations

from typing import Protocol

from sqlalchemy import or_, select
from sqlalchemy.orm import joinedload

from app.database.session_factory import ISessionFactory
from app.friends.models.friendship import Friendship, FriendshipStatus
from app.users.models.user import User
from app.utils.di import inject
from app.utils.pagination import Page, PaginationParams, paginate


class IFriendshipRepository(Protocol):
    def get_by_id(self, friendship_id: int) -> Friendship | None: ...

    def get_pair(self, first_id: int, second_id: int) -> Friendship | None: ...

    def get_user_by_username(self, username: str) -> User | None: ...

    def list_accepted(self, user_id: int, pagination: PaginationParams) -> Page[Friendship]: ...

    def list_pending(self, user_id: int) -> list[Friendship]: ...

    def add(self, friendship: Friendship) -> Friendship: ...

    def delete(self, friendship: Friendship) -> None: ...


@inject(alias=IFriendshipRepository)
class FriendshipRepository(IFriendshipRepository):
    def __init__(self, session_factory: ISessionFactory) -> None:
        self._session_factory = session_factory

    def get_by_id(self, friendship_id: int) -> Friendship | None:
        return self._session_factory().scalar(
            select(Friendship)
            .options(joinedload(Friendship.user_low), joinedload(Friendship.user_high))
            .where(Friendship.id == friendship_id)
        )

    def get_pair(self, first_id: int, second_id: int) -> Friendship | None:
        low_id, high_id = sorted((first_id, second_id))
        return self._session_factory().scalar(
            select(Friendship)
            .options(joinedload(Friendship.user_low), joinedload(Friendship.user_high))
            .where(
                Friendship.user_low_id == low_id,
                Friendship.user_high_id == high_id,
            )
        )

    def get_user_by_username(self, username: str) -> User | None:
        return self._session_factory().scalar(select(User).where(User.username == username))

    def list_accepted(self, user_id: int, pagination: PaginationParams) -> Page[Friendship]:
        query = (
            select(Friendship)
            .options(joinedload(Friendship.user_low), joinedload(Friendship.user_high))
            .where(
                or_(Friendship.user_low_id == user_id, Friendship.user_high_id == user_id),
                Friendship.status == FriendshipStatus.ACCEPTED,
            )
            .order_by(Friendship.accepted_at.desc(), Friendship.id.desc())
        )
        return paginate(query=query, pagination_params=pagination, db=self._session_factory())

    def list_pending(self, user_id: int) -> list[Friendship]:
        return list(
            self._session_factory()
            .scalars(
                select(Friendship)
                .options(joinedload(Friendship.user_low), joinedload(Friendship.user_high))
                .where(
                    or_(
                        Friendship.user_low_id == user_id,
                        Friendship.user_high_id == user_id,
                    ),
                    Friendship.status == FriendshipStatus.PENDING,
                )
                .order_by(Friendship.created_at.desc(), Friendship.id.desc())
            )
            .all()
        )

    def add(self, friendship: Friendship) -> Friendship:
        db = self._session_factory()
        db.add(friendship)
        db.flush()
        return friendship

    def delete(self, friendship: Friendship) -> None:
        db = self._session_factory()
        db.delete(friendship)
        db.flush()
