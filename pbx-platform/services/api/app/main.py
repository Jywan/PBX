import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.routes import calls, users, companies, signaling, permissions

# 설정 로드
settings = get_settings()

def create_application() -> FastAPI:
    application = FastAPI(
        title=settings.api_title,
        version=settings.api_version,
    )

    frontend_url = os.getenv("FRONTEND_URL")

    # CORS 설정 추가
    application.add_middleware(
        CORSMiddleware,
        allow_origins=[frontend_url],
        allow_credentials=True,
        allow_methods=["*"],    # GET, POST, PUT, DELETE 등 모든 메서드 허용
        allow_headers=["*"],    # 모든 헤더 허용
    )

    # API 라우터
    application.include_router(calls.router)
    application.include_router(users.router)
    application.include_router(companies.router)
    application.include_router(permissions.router)

    # WebSocket 라우터
    application.include_router(signaling.router)


    return application

app = create_application()

