from __future__ import annotations

from dataclasses import dataclass
from typing import AsyncIterator, Optional

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy import text

@dataclass(frozen=True)
class DatabaseConfig:
    database_url: str
    echo: bool = False
    pool_pre_ping: bool = True

class Database:
    def __init__(self, cfg: DatabaseConfig) -> None:
        self.cfg = cfg
        self._engine: Optional[AsyncEngine] = None
        self._sessionmaker: Optional[async_sessionmaker[AsyncSession]] = None

    def init(self) -> None:
        if self._engine is not None:
            return
        
        self._engine = create_async_engine(
            self.cfg.database_url,
            echo=self.cfg.echo,
            pool_pre_ping=self.cfg.pool_pre_ping,
        )

        self._sessionmaker = async_sessionmaker(
            bind=self._engine,
            expire_on_commit=False,
            autoflush=False,
            autocommit=False,
        )

    @property
    def engine(self) -> AsyncEngine:
        if self._engine is None:
            raise RuntimeError("Database not initialized. Call db.init() first.")
        return self._engine
    
    def session(self) -> AsyncSession:
        if self._sessionmaker is None:
            raise RuntimeError("Database not initialized. Call db.init() first")
        return self._sessionmaker()
    
    async def session_scope(self) -> AsyncIterator[AsyncSession]:
        s = self.session()

        try:
            yield s
            await s.commit()
        except Exception:
            await s.rollback()
            raise
        finally:
            await s.close()

    async def ping(self) -> bool:
        async with self.engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        return True
    
    async def close(self) -> None:
        if self._engine is not None:
            await self._engine.dispose()
            self._engine = None
            self._sessionmaker = None