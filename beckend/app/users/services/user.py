from __future__ import annotations

from typing import Protocol

from app.auth.schemas.auth import CurrentUser
from app.users.repositories.user import IUserRepository
from app.users.schemas.user import PublicUserSchema
from app.utils.di import inject
from app.utils.pagination import Page, PaginationParams


class IUserService(Protocol):
    def search(
        self, search: str, pagination_params: PaginationParams, current_user: CurrentUser
    ) -> Page[PublicUserSchema]: ...


@inject(alias=IUserService)
class UserService(IUserService):
    def __init__(self, user_repository: IUserRepository) -> None:
        self._user_repository = user_repository

    def search(
        self, search: str, pagination_params: PaginationParams, current_user: CurrentUser
    ) -> Page[PublicUserSchema]:
        users = self._user_repository.search(
            search=search.lower(),
            exclude_user_id=current_user.id,
            pagination_params=pagination_params,
        )
        return Page(
            total=users.total,
            items=[PublicUserSchema.model_validate(user) for user in users.items],
            pages=users.pages,
        )
