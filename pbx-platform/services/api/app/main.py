import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.routes import calls, users, companies

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

    # 라우터 추가 공간
    application.include_router(calls.router, prefix="/api/v1", tags=["calls"])
    application.include_router(users.router, prefix="/api/v1", tags=["users"])
    application.include_router(companies.router, prefix="/api/v1", tags=["companies"])

    return application

app = create_application()

# 헬스 체크
@app.get("/")
async def root():
    return {"message": "PBX API Server is Running"}