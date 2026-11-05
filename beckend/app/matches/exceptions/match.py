from __future__ import annotations

from app.utils.exceptions import ConflictException, ForbiddenException, NotFoundException


class NotFriendsException(ForbiddenException):
    def __init__(self) -> None:
        super().__init__(message="Only friends can challenge each other", code="not_friends")


class ChallengeAlreadyPendingException(ConflictException):
    def __init__(self) -> None:
        super().__init__(message="A challenge is already pending", code="challenge_already_pending")


class ChallengeNotFoundException(NotFoundException):
    def __init__(self) -> None:
        super().__init__(message="Challenge not found", code="challenge_not_found")


class NotChallengeOpponentException(ForbiddenException):
    def __init__(self) -> None:
        super().__init__(
            message="Only the opponent can update this challenge", code="not_challenge_opponent"
        )


class NotChallengerException(ForbiddenException):
    def __init__(self) -> None:
        super().__init__(message="Only the challenger can cancel", code="not_challenger")


class ChallengeExpiredException(ConflictException):
    def __init__(self) -> None:
        super().__init__(message="Challenge expired", code="challenge_expired")


class DeckGenerationFailedException(ConflictException):
    def __init__(self) -> None:
        super().__init__(message="Deck generation failed", code="deck_generation_failed")


class MatchNotFoundException(NotFoundException):
    def __init__(self) -> None:
        super().__init__(message="Match not found", code="match_not_found")


class NotMatchPlayerException(ForbiddenException):
    def __init__(self) -> None:
        super().__init__(message="Only players can access this match", code="not_match_player")


class MatchNotFinishedException(ConflictException):
    def __init__(self) -> None:
        super().__init__(message="Match is not finished", code="match_not_finished")
