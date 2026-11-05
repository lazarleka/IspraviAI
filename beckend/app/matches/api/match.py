from __future__ import annotations

from typing import Annotated

from fastapi import BackgroundTasks, Depends, status

from app.auth.schemas.auth import CurrentUser
from app.database.session_handler import DBAPIRouter
from app.deps import get_current_user, get_di_entity
from app.matches.schemas.match import (
    ChallengeCreateSchema,
    ChallengeResponseSchema,
    MatchResponseSchema,
    MatchResultSchema,
    PendingChallengesSchema,
)
from app.matches.services.match import IMatchService
from app.utils.pagination import Page, PaginationParams, get_pagination_params

router = DBAPIRouter()


@router.post(path="/challenges", status_code=status.HTTP_201_CREATED, summary="Create challenge")
def create_challenge(
    data: ChallengeCreateSchema,
    tasks: BackgroundTasks,
    service: Annotated[IMatchService, Depends(get_di_entity(IMatchService))],
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
) -> ChallengeResponseSchema:
    return service.create_challenge(data=data, current_user=current_user, tasks=tasks)


@router.get(path="/challenges/pending", summary="List pending challenges")
def pending_challenges(
    service: Annotated[IMatchService, Depends(get_di_entity(IMatchService))],
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
) -> PendingChallengesSchema:
    return service.pending(current_user=current_user)


@router.post(path="/challenges/{challenge_id}/accept", summary="Accept challenge")
def accept_challenge(
    challenge_id: int,
    service: Annotated[IMatchService, Depends(get_di_entity(IMatchService))],
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
) -> ChallengeResponseSchema:
    return service.accept(challenge_id=challenge_id, current_user=current_user)


@router.post(path="/challenges/{challenge_id}/decline", summary="Decline challenge")
def decline_challenge(
    challenge_id: int,
    service: Annotated[IMatchService, Depends(get_di_entity(IMatchService))],
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
) -> ChallengeResponseSchema:
    return service.decline(challenge_id=challenge_id, current_user=current_user)


@router.delete(
    path="/challenges/{challenge_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_model=None,
    summary="Cancel challenge",
)
def cancel_challenge(
    challenge_id: int,
    service: Annotated[IMatchService, Depends(get_di_entity(IMatchService))],
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
) -> None:
    service.cancel(challenge_id=challenge_id, current_user=current_user)


@router.get(path="/matches", summary="List finished matches")
def list_matches(
    pagination: Annotated[PaginationParams, Depends(get_pagination_params)],
    service: Annotated[IMatchService, Depends(get_di_entity(IMatchService))],
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
) -> Page[MatchResponseSchema]:
    return service.list_matches(pagination=pagination, current_user=current_user)


@router.get(path="/matches/{match_id}", summary="Get match")
def get_match(
    match_id: int,
    service: Annotated[IMatchService, Depends(get_di_entity(IMatchService))],
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
) -> MatchResponseSchema:
    return service.get_match(match_id=match_id, current_user=current_user)


@router.get(path="/matches/{match_id}/result", summary="Get match result")
def get_match_result(
    match_id: int,
    service: Annotated[IMatchService, Depends(get_di_entity(IMatchService))],
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
) -> MatchResultSchema:
    return service.result(match_id=match_id, current_user=current_user)
