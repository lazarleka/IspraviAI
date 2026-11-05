from __future__ import annotations

from fastapi import APIRouter

from app.realtime.api.ws import router as websocket_router

router = APIRouter(tags=["Realtime"])
router.include_router(websocket_router)
