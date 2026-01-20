from __future__ import annotations

from typing import AsyncIterator
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import session_factory

async def get_db() -> AsyncIterator[AsyncSession]:
    SessionLocal = session_factory()
    async with SessionLocal() as s:
        yield s