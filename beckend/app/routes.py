from __future__ import annotations

from fastapi import APIRouter

from app.auth.routes import router as auth_router
from app.decks.routes import router as decks_router
from app.friends.routes import router as friends_router
from app.matches.routes import router as matches_router
from app.realtime.routes import router as realtime_router
from app.study.routes import router as study_router
from app.users.routes import router as users_router

api_router = APIRouter(prefix="/api")

api_router.include_router(auth_router)
api_router.include_router(decks_router)
api_router.include_router(friends_router)
api_router.include_router(matches_router)
api_router.include_router(realtime_router)
api_router.include_router(study_router)
api_router.include_router(users_router)
