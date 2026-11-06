from __future__ import annotations

from typing import Literal

from pydantic import EmailStr, Field

from app.utils.schemas import CamelCaseModel, CamelCaseResponseModel, UtcDatetime

AvatarColor = Literal["blue", "amber", "green", "purple", "rose"]


class UserResponseSchema(CamelCaseResponseModel):
    id: int
    email: EmailStr
    username: str
    display_name: str
    avatar_color: AvatarColor
    daily_goal: int
    sound_enabled: bool
    animations_enabled: bool
    created_at: UtcDatetime


class UserUpdateSchema(CamelCaseModel):
    display_name: str | None = Field(default=None, min_length=1, max_length=60)
    username: str | None = Field(default=None, min_length=3, max_length=20, pattern=r"^[a-z0-9_]+$")
    avatar_color: AvatarColor | None = None
    daily_goal: int | None = Field(default=None, ge=5, le=50)
    sound_enabled: bool | None = None
    animations_enabled: bool | None = None


class UserStatsSchema(CamelCaseResponseModel):
    matches_played: int
    wins: int
    losses: int
    draws: int
    win_rate: int
    total_score: int
    best_score: int
    cards_reviewed: int
    correct_answers: int
    wrong_answers: int
    accuracy: int


class PublicUserSchema(CamelCaseResponseModel):
    id: int
    username: str
    display_name: str
