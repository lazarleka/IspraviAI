from __future__ import annotations

from pydantic import EmailStr

from app.utils.schemas import CamelCaseResponseModel, UtcDatetime


class UserResponseSchema(CamelCaseResponseModel):
    id: int
    email: EmailStr
    username: str
    display_name: str
    created_at: UtcDatetime


class PublicUserSchema(CamelCaseResponseModel):
    id: int
    username: str
    display_name: str
