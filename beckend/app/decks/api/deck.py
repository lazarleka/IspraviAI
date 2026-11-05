from __future__ import annotations

from typing import Annotated

from fastapi import BackgroundTasks, Depends, File, Form, UploadFile, status

from app.auth.schemas.auth import CurrentUser
from app.database.session_handler import DBAPIRouter
from app.decks.models.deck import DeckSubject
from app.decks.schemas.deck import DeckCreateRequestSchema, DeckResponseSchema
from app.decks.services.deck import IDeckService
from app.deps import get_current_user, get_di_entity
from app.utils.pagination import Page, PaginationParams, get_pagination_params

router = DBAPIRouter(prefix="/decks")


@router.get(path="", summary="List your study decks")
def list_decks(
    pagination_params: Annotated[PaginationParams, Depends(get_pagination_params)],
    deck_service: Annotated[IDeckService, Depends(get_di_entity(IDeckService))],
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
) -> Page[DeckResponseSchema]:
    return deck_service.list(pagination_params=pagination_params, current_user=current_user)


@router.post(path="", status_code=status.HTTP_201_CREATED, summary="Create a topic deck")
def create_deck(
    data: DeckCreateRequestSchema,
    background_tasks: BackgroundTasks,
    deck_service: Annotated[IDeckService, Depends(get_di_entity(IDeckService))],
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
) -> DeckResponseSchema:
    return deck_service.create(
        data=data, current_user=current_user, background_tasks=background_tasks
    )


@router.post(
    path="/upload", status_code=status.HTTP_201_CREATED, summary="Create a deck from a file"
)
def upload_deck(
    background_tasks: BackgroundTasks,
    file: Annotated[UploadFile, File()],
    requested_cards: Annotated[int, Form(alias="requestedCards", ge=5, le=20)],
    deck_service: Annotated[IDeckService, Depends(get_di_entity(IDeckService))],
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
    title: Annotated[str | None, Form(min_length=3, max_length=80)] = None,
    subject: Annotated[DeckSubject | None, Form()] = None,
) -> DeckResponseSchema:
    return deck_service.upload(
        file=file,
        title=title,
        subject=subject,
        requested_cards=requested_cards,
        current_user=current_user,
        background_tasks=background_tasks,
    )


@router.get(path="/{deck_id}", summary="Get a deck")
def get_deck(
    deck_id: int,
    deck_service: Annotated[IDeckService, Depends(get_di_entity(IDeckService))],
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
) -> DeckResponseSchema:
    return deck_service.get(deck_id=deck_id, current_user=current_user)


@router.delete(
    path="/{deck_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_model=None,
    summary="Delete a deck",
)
def delete_deck(
    deck_id: int,
    deck_service: Annotated[IDeckService, Depends(get_di_entity(IDeckService))],
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
) -> None:
    deck_service.delete(deck_id=deck_id, current_user=current_user)
