from __future__ import annotations

from pydantic import Field

from app.friends.models.friendship import FriendshipStatus
from app.users.schemas.user import PublicUserSchema
from app.utils.schemas import CamelCaseModel, CamelCaseResponseModel, UtcDatetime


class FriendRequestCreateSchema(CamelCaseModel):
    username: str = Field(min_length=3, max_length=20, pattern=r"^[a-z0-9_]+$")


class FriendshipResponseSchema(CamelCaseResponseModel):
    id: int
    requested_by_id: int
    status: FriendshipStatus
    friend: PublicUserSchema
    online: bool
    created_at: UtcDatetime
    accepted_at: UtcDatetime | None


class FriendRequestsSchema(CamelCaseResponseModel):
    incoming: list[FriendshipResponseSchema]
    outgoing: list[FriendshipResponseSchema]
