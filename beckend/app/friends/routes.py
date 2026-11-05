from __future__ import annotations

from fastapi import APIRouter

from app.friends.api.friendship import router as friendship_router

router = APIRouter(tags=["Friends"])
router.include_router(friendship_router)
