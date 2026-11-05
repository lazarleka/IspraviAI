from __future__ import annotations

from typing import Annotated

from fastapi import Depends, Query, status

from app.auth.schemas.auth import CurrentUser
from app.database.session_handler import DBAPIRouter
from app.deps import get_current_user, get_di_entity
from app.study.schemas.study import (
    CardAnswerRequestSchema,
    CardAnswerResultSchema,
    CardReportRequestSchema,
    NextCardsSchema,
    StudyTodaySchema,
)
from app.study.services.study import IStudyService

router = DBAPIRouter(prefix="/study")


@router.get(path="/today", summary="Get today's study queue")
def get_today(
    study_service: Annotated[IStudyService, Depends(get_di_entity(IStudyService))],
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
) -> StudyTodaySchema:
    return study_service.today(current_user=current_user)


@router.get(path="/decks/{deck_id}/next", summary="Get the next cards for a deck")
def get_next_cards(
    deck_id: int,
    study_service: Annotated[IStudyService, Depends(get_di_entity(IStudyService))],
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
    size: Annotated[int, Query(ge=1, le=20)] = 10,
) -> NextCardsSchema:
    return study_service.next(deck_id=deck_id, size=size, current_user=current_user)


@router.post(path="/cards/{card_id}/answer", summary="Answer a study card")
def answer_card(
    card_id: int,
    data: CardAnswerRequestSchema,
    study_service: Annotated[IStudyService, Depends(get_di_entity(IStudyService))],
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
) -> CardAnswerResultSchema:
    return study_service.answer(card_id=card_id, data=data, current_user=current_user)


@router.post(
    path="/cards/{card_id}/report",
    status_code=status.HTTP_204_NO_CONTENT,
    response_model=None,
    summary="Report a study card",
)
def report_card(
    card_id: int,
    data: CardReportRequestSchema,
    study_service: Annotated[IStudyService, Depends(get_di_entity(IStudyService))],
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
) -> None:
    study_service.report(card_id=card_id, data=data, current_user=current_user)
