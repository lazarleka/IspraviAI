from __future__ import annotations

import re
from io import BytesIO
from pathlib import Path
from typing import Protocol

from fastapi import BackgroundTasks, UploadFile
from pypdf import PdfReader
from pypdf.errors import PdfReadError

from app.auth.schemas.auth import CurrentUser
from app.config.settings import Settings
from app.decks.exceptions.deck import (
    DeckNotFoundException,
    FileTooLargeException,
    NotDeckOwnerException,
    UnsupportedFileTypeException,
)
from app.decks.generation.pipeline import generate_deck_cards
from app.decks.models.deck import Deck, DeckSourceType, DeckSubject
from app.decks.repositories.deck import IDeckRepository
from app.decks.schemas.deck import DeckCreateRequestSchema, DeckResponseSchema
from app.study.services.stats import IStudyStatsService
from app.utils.di import inject
from app.utils.pagination import Page, PaginationParams


class IDeckService(Protocol):
    def list(
        self, pagination_params: PaginationParams, current_user: CurrentUser
    ) -> Page[DeckResponseSchema]: ...

    def get(self, deck_id: int, current_user: CurrentUser) -> DeckResponseSchema: ...

    def create(
        self,
        data: DeckCreateRequestSchema,
        current_user: CurrentUser,
        background_tasks: BackgroundTasks,
    ) -> DeckResponseSchema: ...

    def upload(
        self,
        file: UploadFile,
        title: str | None,
        subject: DeckSubject | None,
        requested_cards: int,
        current_user: CurrentUser,
        background_tasks: BackgroundTasks,
    ) -> DeckResponseSchema: ...

    def delete(self, deck_id: int, current_user: CurrentUser) -> None: ...


@inject(alias=IDeckService)
class DeckService(IDeckService):
    def __init__(
        self,
        deck_repository: IDeckRepository,
        settings: Settings,
        study_stats_service: IStudyStatsService,
    ) -> None:
        self._deck_repository = deck_repository
        self._settings = settings
        self._study_stats_service = study_stats_service

    def list(
        self, pagination_params: PaginationParams, current_user: CurrentUser
    ) -> Page[DeckResponseSchema]:
        decks = self._deck_repository.list_for_owner(current_user.id, pagination_params)
        return Page(
            total=decks.total,
            items=[self._response(deck, current_user.id) for deck in decks.items],
            pages=decks.pages,
        )

    def get(self, deck_id: int, current_user: CurrentUser) -> DeckResponseSchema:
        deck = self._get_owned(deck_id, current_user)
        return self._response(deck, current_user.id)

    def create(
        self,
        data: DeckCreateRequestSchema,
        current_user: CurrentUser,
        background_tasks: BackgroundTasks,
    ) -> DeckResponseSchema:
        topic = data.topic.strip()
        deck = Deck(
            title=(data.title or topic)[:80].strip(),
            subject=data.subject or self._guess_subject(topic),
            source_type=DeckSourceType.TOPIC,
            topic=topic,
            file_name=None,
            requested_cards=data.requested_cards,
            source_text=topic[: self._settings.MAX_SOURCE_CHARS],
            owner_id=current_user.id,
        )
        deck = self._deck_repository.add(deck)
        background_tasks.add_task(generate_deck_cards, deck.id)
        return self._response(deck, current_user.id)

    def upload(
        self,
        file: UploadFile,
        title: str | None,
        subject: DeckSubject | None,
        requested_cards: int,
        current_user: CurrentUser,
        background_tasks: BackgroundTasks,
    ) -> DeckResponseSchema:
        filename = file.filename or "upload"
        extension = Path(filename).suffix.lower()
        if extension not in {".pdf", ".txt", ".md"}:
            raise UnsupportedFileTypeException
        maximum = self._settings.MAX_UPLOAD_MB * 1024 * 1024
        content = file.file.read(maximum + 1)
        if len(content) > maximum:
            raise FileTooLargeException
        source_text = self._extract_text(content, extension)
        base_title = re.sub(r"[-_]+", " ", Path(filename).stem).strip()
        deck = Deck(
            title=(title or base_title)[:80].strip(),
            subject=subject or self._guess_subject(f"{base_title} {source_text[:500]}"),
            source_type=DeckSourceType.FILE,
            topic=None,
            file_name=filename[:255],
            requested_cards=requested_cards,
            source_text=source_text[: self._settings.MAX_SOURCE_CHARS],
            owner_id=current_user.id,
        )
        deck = self._deck_repository.add(deck)
        background_tasks.add_task(generate_deck_cards, deck.id)
        return self._response(deck, current_user.id)

    def delete(self, deck_id: int, current_user: CurrentUser) -> None:
        self._deck_repository.delete(self._get_owned(deck_id, current_user))

    def _get_owned(self, deck_id: int, current_user: CurrentUser) -> Deck:
        deck = self._deck_repository.get_by_id(deck_id)
        if deck is None:
            raise DeckNotFoundException
        if deck.owner_id != current_user.id:
            raise NotDeckOwnerException
        return deck

    @staticmethod
    def _extract_text(content: bytes, extension: str) -> str:
        if extension == ".pdf":
            try:
                return "\n".join(
                    page.extract_text() or "" for page in PdfReader(BytesIO(content)).pages
                )
            except (PdfReadError, ValueError) as error:
                raise UnsupportedFileTypeException from error
        try:
            return content.decode("utf-8")
        except UnicodeDecodeError as error:
            raise UnsupportedFileTypeException from error

    @staticmethod
    def _guess_subject(text: str) -> DeckSubject:
        normalized = text.lower()
        rules = (
            (DeckSubject.BIOLOGY, r"ćelij|biljk|fotosint|biolog|organ"),
            (DeckSubject.PROGRAMMING, r"\b(c|java|python)\b|program|rekurz|niz|petlj|funkcij"),
            (DeckSubject.HISTORY, r"ustan|rat|vijek|istorij|kralj"),
            (DeckSubject.PHYSICS, r"njutn|sila|fizik|brzin|energij|struj"),
            (DeckSubject.CHEMISTRY, r"hemij|atom|molekul|reakcij"),
            (DeckSubject.MATH, r"matemat|jednačin|integral|izvod|trougl|razlom"),
        )
        return next(
            (subject for subject, pattern in rules if re.search(pattern, normalized)),
            DeckSubject.OTHER,
        )

    def _response(self, deck: Deck, user_id: int) -> DeckResponseSchema:
        progress, due_count = self._study_stats_service.get_deck_stats(deck, user_id)
        return DeckResponseSchema(
            id=deck.id,
            title=deck.title,
            subject=deck.subject,
            source_type=deck.source_type,
            topic=deck.topic,
            file_name=deck.file_name,
            kind=deck.kind,
            status=deck.status,
            requested_cards=deck.requested_cards,
            card_count=len(deck.cards),
            progress=progress,
            due_count=due_count,
            owner_id=deck.owner_id,
            created_at=deck.created_at,
        )
