from __future__ import annotations

from datetime import datetime

from pydantic import AliasChoices, BaseModel, EmailStr, Field

from app.users.schemas.user import UserResponseSchema
from app.utils.schemas import CamelCaseModel


class RegisterRequestSchema(CamelCaseModel):
    email: EmailStr
    # bcrypt reads at most 72 bytes of a password, so longer ones are rejected instead of silently cut.
    password: str = Field(min_length=8, max_length=72)
    display_name: str = Field(min_length=1, max_length=60)
    username: str = Field(min_length=3, max_length=20, pattern=r"^[a-z0-9_]+$")


class LoginRequestSchema(CamelCaseModel):
    identifier: str = Field(
        min_length=3,
        max_length=254,
        validation_alias=AliasChoices("identifier", "email"),
    )
    password: str = Field(min_length=1, max_length=72)


class AuthenticationResponseSchema(CamelCaseModel):
    token: str
    user: UserResponseSchema


class CurrentUser(BaseModel):
    """The signed-in user as every endpoint sees it: taken from the token, checked against the database."""

    id: int
    email: str
    username: str
    display_name: str
    avatar_color: str
    daily_goal: int
    sound_enabled: bool
    animations_enabled: bool
    created_at: datetime


class TokenPayload(BaseModel):
    sub: str
    exp: int
    iat: int
