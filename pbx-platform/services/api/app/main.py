from fastapi import FastAPI
from app.core.config import get_settings

from app.routes import calls, users, companies

# 설정 로드
settings = get_settings()

def create_application() -> FastAPI:
    application = FastAPI(
        title=settings.api_title,
        version=settings.api_version,
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