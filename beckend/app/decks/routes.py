from __future__ import annotations

from fastapi import APIRouter

from app.decks.api.deck import router as deck_router

router = APIRouter(tags=["Decks"])
router.include_router(deck_router)
