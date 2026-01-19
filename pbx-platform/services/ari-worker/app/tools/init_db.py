import asyncio

from pbx_common.db import Database, DatabaseConfig
from pbx_common.models import Base

DATABASE_URL = "postgresql+asyncpg://pbx:pbxpassword@localhost:5432/pbx"

async def main():
    db = Database(
        DatabaseConfig(
            database_url=DATABASE_URL,
            echo=True,
        )
    )
    db.init()

    async with db.engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    print("tables created successfully")

    await db.close()

if __name__ == "__main__":
    asyncio.run(main())