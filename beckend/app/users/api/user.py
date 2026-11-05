from __future__ import annotations

from typing import Annotated

from fastapi import Depends, Query

from app.auth.schemas.auth import CurrentUser
from app.database.session_handler import DBAPIRouter
from app.deps import get_current_user, get_di_entity
from app.users.schemas.user import PublicUserSchema
from app.users.services.user import IUserService
from app.utils.pagination import Page, PaginationParams, get_pagination_params

router = DBAPIRouter(prefix="/users")


@router.get(path="", summary="Search users by username")
def search_users(
    search: Annotated[str, Query(min_length=2, max_length=20)],
    pagination_params: Annotated[PaginationParams, Depends(get_pagination_params)],
    user_service: Annotated[IUserService, Depends(get_di_entity(IUserService))],
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
) -> Page[PublicUserSchema]:
    return user_service.search(
        search=search, pagination_params=pagination_params, current_user=current_user
    )
