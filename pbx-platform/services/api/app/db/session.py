from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.core.config import get_settings

# 1. 설정 로드
settings = get_settings()

# 2. 비동기 엔진 생성
# echo-True: 실행되는 SQL 쿼리를 터미널에 출력 (개발용)
# future=True: SQLAlchemy 2.0 스타일 사용
engine = create_async_engine(
    settings.database_url,
    echo=True,
    future=True,
)

# 3. 세션 팩토리 생성
# expire_on_commit=False: 커밋 후에도 객체 데이터를 메모리에 유지 (비동기에서 필수)
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)

# 4. FastAPI Dependency (의존성 주입용 함수)
# 라우터에서 'db: AsyncSession = Depends(get_db)' 형태로 사용
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()