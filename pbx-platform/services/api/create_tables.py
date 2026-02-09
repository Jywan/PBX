import asyncio
import os
from dotenv import load_dotenv

# 1. 환경 변수 로드 (경로는 프로젝트 구조에 따라 ../../.env 등으로 조절)
load_dotenv("../../.env")

# 2. 필요한 모듈 임포트
from pbx_common.db import Database, DatabaseConfig
from pbx_common.models import __all__ 

async def create_tables():
    # 3. DB 설정 및 초기화
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("DATABASE_URL을 찾을 수 없습니다.")
        return

    cfg = DatabaseConfig(database_url=db_url, echo=True)
    db = Database(cfg)
    db.init()  # 엔진 초기화

    print(f"Connecting to: {db_url}")

    # 4. 실제 테이블 생성 실행
    try:
        async with db.engine.begin() as conn:
            # Base.metadata에 등록된 모든 테이블(User, Call 등)을 생성
            await conn.run_sync(Base.metadata.create_all)
        print("모든 테이블이 성공적으로 생성되었습니다!")
    except Exception as e:
        print(f"에러 발생: {e}")
    finally:
        await db.close()

if __name__ == "__main__":
    asyncio.run(create_tables())