from __future__ import annotations

from fastapi import APIRouter

from app.study.api.study import router as study_router

router = APIRouter(tags=["Study"])
router.include_router(study_router)
