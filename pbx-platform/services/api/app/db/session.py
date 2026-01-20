from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import Settings

_engine = None
_SessionLocal: async_sessionmaker[AsyncSession] | None = None

def init_db(setting: Settings) -> None:
    global _engine, _SessionLocal
    if _engine is not None:
        return
    
    _engine = create_async_engine(setting.database_url, echo=False, pool_pre_ping=True)
    _SessionLocal = async_sessionmaker(bind=_engine, expire_on_commit=False)

def session_factory() -> async_sessionmaker[AsyncSession]:
    if _SessionLocal is None:
        raise RuntimeError("DB not initialized, Call init_db() first.")
    return _SessionLocal