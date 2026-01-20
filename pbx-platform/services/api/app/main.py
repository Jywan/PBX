from __future__ import annotations

from fastapi import FastAPI

from app.core.config import load_settings
from app.db.session import init_db
from app.routes.health import router as health_router
from app.routes.calls import router as calls_router

def create_app() -> FastAPI:
    settings = load_settings()
    init_db(settings)

    app = FastAPI(title=settings.api_title, version=settings.api_version)
    app.include_router(health_router, prefix="/api")
    app.include_router(calls_router, prefix="/api")
    return app

app = create_app() 