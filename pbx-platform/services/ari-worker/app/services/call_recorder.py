from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from pbx_common.models import Call, CallEvent

class CallRecorder:
    def __init__(self, session_factory: async_sessionmaker[AsyncSession]):
        self._SessionLocal = session_factory

    async def ensure_call_row(
            self, 
            call_id: uuid.UUID,
            caller_exten: Optional[str],
            callee_exten: Optional[str],
            caller_channel_id: Optional[str],
    ) -> None:
        async with self._SessionLocal() as s:
            exists = await s.execute(select(Call.id).where(Call.id == call_id))
            if exists.scalar_one_or_none():
                return
            
            s.add(
                Call(
                    id=call_id,
                    caller_exten=caller_exten,
                    callee_exten=callee_exten,
                    caller_channel_id=caller_channel_id,
                    status="new",
                    direction="internal",
                    started_at=datetime.now().astimezone(),
                )
            )
            await s.commit()
    
    async def add_event(
            self,
            call_id: Optional[uuid.UUID],
            ts: Optional[datetime],
            etype: Optional[str],
            channel_id: Optional[str],
            bridge_id: Optional[str],
            raw: dict,
    ) -> None:
        async with self._SessionLocal() as s:
            s.add(
                CallEvent(
                    call_id=call_id,
                    ts=ts,
                    type=etype,
                    channel_id=channel_id,
                    bridge_id=bridge_id,
                    raw=raw,
                )
            )
            await s.commit()
    
    async def mark_failed(self, call_id: uuid.UUID, reason: str,) -> None:
        async with self._SessionLocal() as s:
            await s.execute(
                update(Call)
                .where(Call.id == call_id)
                .values(
                    status="failed",
                    hangup_reason=reason,
                    ended_at=datetime.now().astimezone(),
                )
            )
            await s.commit()
    
    async def mark_ended(
            self,
            call_id: uuid.UUID,
            ended_at: Optional[datetime] = None,
            hangup_cause: Optional[int] = None,
            hangup_reason: Optional[str] =None,
    ) -> None:
        async with self._SessionLocal() as s:
            await s.execute(
                update(Call)
                .where(Call.id == call_id)
                .values(
                    ended_at=ended_at or datetime.now().astimezone(),
                    hangup_cause=hangup_cause,
                    hangup_reason=hangup_reason,
                    status="ended",
                )
            )
            await s.commit()

    async def mark_bridged(
            self,
            call_id: uuid.UUID,
            bridge_id: str,
            caller_channel_id: str,
            callee_channel_id: str,
    ) -> None:
        async with self._SessionLocal() as s:
            await s.execute(
                update(Call)
                .where(Call.id == call_id)
                .values(
                    bridge_id=bridge_id,
                    caller_channel_id=caller_channel_id,
                    callee_channel_id=callee_channel_id,
                    status="up",
                    answered_at=datetime.now().astimezone(),
                )
            )
            await s.commit()