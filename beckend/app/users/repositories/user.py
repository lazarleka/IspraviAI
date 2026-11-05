from __future__ import annotations

from typing import Protocol

from sqlalchemy import select

from app.database.session_factory import ISessionFactory
from app.users.models.user import User
from app.utils.di import inject
from app.utils.pagination import Page, PaginationParams, paginate


class IUserRepository(Protocol):
    def search(
        self, search: str, exclude_user_id: int, pagination_params: PaginationParams
    ) -> Page[User]: ...


@inject(alias=IUserRepository)
class UserRepository(IUserRepository):
    def __init__(self, session_factory: ISessionFactory) -> None:
        self._session_factory = session_factory

    def search(
        self, search: str, exclude_user_id: int, pagination_params: PaginationParams
    ) -> Page[User]:
        db = self._session_factory()
        query = (
            select(User)
            .where(User.id != exclude_user_id, User.username.startswith(search))
            .order_by(User.username, User.id)
        )
        return paginate(query=query, pagination_params=pagination_params, db=db)
