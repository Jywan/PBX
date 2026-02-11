import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.core.config import get_settings
from app.routes import calls, users, companies, signaling, permissions, auth

# 설정 로드
settings = get_settings()

# Rate Limiter 인스턴스 생성
limiter = Limiter(key_func=get_remote_address)

def create_application() -> FastAPI:
    application = FastAPI(
        title=settings.api_title,
        version=settings.api_version,
    )

    # Rate Limiter
    application.state.limiter = limiter
    application.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

    frontend_url = os.getenv("FRONTEND_URL")

    # CORS 설정 추가
    application.add_middleware(
        CORSMiddleware,
        allow_origins=[frontend_url] if frontend_url else [],
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization", "Accept", "Origin", "User-Agent", "DNT", "Cache-Control", "X-Requested-With",
                        "Sec-WebSocket-key", "Sec-WebSocket-Version", "Sec-WebSocket-Protocol", "Sec-WebSocket-Extensions", "Upgrade",
                        "Connection"],
        expose_headers=["Content-Length", "Content-Range"],
        max_age=3600 # preflight 요청 캐시 시간 (1시간)
    )

    # API 라우터
    application.include_router(calls.router)
    application.include_router(users.router)
    application.include_router(companies.router)
    application.include_router(permissions.router)
    application.include_router(auth.router)

    # WebSocket 라우터
    application.include_router(signaling.router)

    return application

app = create_application()

