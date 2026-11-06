from __future__ import annotations

from app.utils.exceptions import ConflictException, UnauthenticatedException


class InvalidCredentialsException(UnauthenticatedException):
    def __init__(self) -> None:
        # One message for every failed login: the API must not reveal which accounts exist.
        super().__init__(message="Invalid email, username or password", code="invalid_credentials")


class InvalidTokenException(UnauthenticatedException):
    def __init__(self) -> None:
        super().__init__(message="Invalid or expired token", code="invalid_token")


class NotAuthenticatedException(UnauthenticatedException):
    def __init__(self) -> None:
        super().__init__(message="Authentication required", code="not_authenticated")


class EmailAlreadyRegisteredException(ConflictException):
    def __init__(self) -> None:
        message = "Email is already registered"
        super().__init__(
            message=message, code="email_already_registered", field_errors={"email": message}
        )


class UsernameTakenException(ConflictException):
    def __init__(self) -> None:
        message = "Username is already taken"
        super().__init__(message=message, code="username_taken", field_errors={"username": message})
