from __future__ import annotations

from fastapi import status

from app.utils.exceptions import ForbiddenException, HTTPExceptionWithCode, NotFoundException


class DeckNotFoundException(NotFoundException):
    def __init__(self) -> None:
        super().__init__(message="Deck not found", code="deck_not_found")


class NotDeckOwnerException(ForbiddenException):
    def __init__(self) -> None:
        super().__init__(message="Only the owner can access this deck", code="not_deck_owner")


class FileTooLargeException(HTTPExceptionWithCode):
    def __init__(self) -> None:
        super().__init__(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File is too large",
            code="file_too_large",
        )


class UnsupportedFileTypeException(HTTPExceptionWithCode):
    def __init__(self) -> None:
        super().__init__(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Supported file types are PDF, TXT and MD",
            code="unsupported_file_type",
        )
