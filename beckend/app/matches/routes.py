from __future__ import annotations

from fastapi import APIRouter

from app.matches.api.match import router as match_router

router = APIRouter(tags=["Matches"])
router.include_router(match_router)
