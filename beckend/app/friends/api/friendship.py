from __future__ import annotations

from typing import Annotated

from fastapi import Depends, status

from app.auth.schemas.auth import CurrentUser
from app.database.session_handler import DBAPIRouter
from app.deps import get_current_user, get_di_entity
from app.friends.schemas.friendship import (
    FriendRequestCreateSchema,
    FriendRequestsSchema,
    FriendshipResponseSchema,
)
from app.friends.services.friendship import IFriendshipService
from app.utils.pagination import Page, PaginationParams, get_pagination_params

router = DBAPIRouter(prefix="/friends")


@router.get(path="", summary="List accepted friends")
def list_friends(
    pagination: Annotated[PaginationParams, Depends(get_pagination_params)],
    service: Annotated[IFriendshipService, Depends(get_di_entity(IFriendshipService))],
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
) -> Page[FriendshipResponseSchema]:
    return service.list(pagination=pagination, current_user=current_user)


@router.get(path="/requests", summary="List friend requests")
def list_requests(
    service: Annotated[IFriendshipService, Depends(get_di_entity(IFriendshipService))],
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
) -> FriendRequestsSchema:
    return service.requests(current_user=current_user)


@router.post(path="/requests", status_code=status.HTTP_201_CREATED, summary="Send friend request")
def create_request(
    data: FriendRequestCreateSchema,
    service: Annotated[IFriendshipService, Depends(get_di_entity(IFriendshipService))],
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
) -> FriendshipResponseSchema:
    return service.create(data=data, current_user=current_user)


@router.post(path="/requests/{friendship_id}/accept", summary="Accept friend request")
def accept_request(
    friendship_id: int,
    service: Annotated[IFriendshipService, Depends(get_di_entity(IFriendshipService))],
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
) -> FriendshipResponseSchema:
    return service.accept(friendship_id=friendship_id, current_user=current_user)


@router.delete(
    path="/{friendship_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_model=None,
    summary="Remove friend or request",
)
def delete_friendship(
    friendship_id: int,
    service: Annotated[IFriendshipService, Depends(get_di_entity(IFriendshipService))],
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
) -> None:
    service.delete(friendship_id=friendship_id, current_user=current_user)
