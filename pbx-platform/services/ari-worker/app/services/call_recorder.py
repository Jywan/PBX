from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from pbx_common.models import Call, CallEvent

# call DB 적재

class CallRecorder:
    def __init__(self, session: AsyncSession):
        self.s =session

    async def ensure_call_row(
        self,
        call_id: uuid.UUID,
        caller_exten: Optional[str],
        callee_exten: Optional[str],
        caller_channel_id: Optional[str]
    ) -> None:
        exists = await self.s.execute(select(Call.id).where(Call.id == call_id))
        if exists.scalar_one_or_none():
            return
        
        self.s.add(
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

    async def add_event(
        self,
        call_id: Optional[uuid.UUID],
        ts: Optional[datetime],
        etype: Optional[str],
        channel_id: Optional[str],
        bridge_id: Optional[str],
        raw: dict,
    ) -> None:
        self.s.add(
            CallEvent(
                call_id=call_id,
                ts=ts,
                type=etype,
                channel_id=channel_id,
                bridge_id=bridge_id,
                raw=raw,
            )
        )
    
    async def mark_ended(
        self,
        call_id: uuid.UUID,
        ended_at: datetime,
        hangup_cause: Optional[int],
        hangup_reason: Optional[str],
    ) -> None:
        await self.s.execute(
            update(Call)
            .where(Call.id == call_id)
            .values(
                ended_at=ended_at,
                hangup_cause=hangup_cause,
                hangup_reason=hangup_reason,
                status="ended",
            )
        )
    
    async def mark_bridged(
        self,
        call_id: uuid.UUID,
        bridge_id: str,
        caller_channel_id: Optional[str] = None,
        callee_channel_id: Optional[str] = None,
    ) -> None:
        values = {
            "bridge_id": bridge_id,
            "status": "up",
            "answered_at": datetime.now().astimezone(),
        }
        if caller_channel_id:
            values["caller_channel_id"] = caller_channel_id
        if callee_channel_id:
            values["callee_channel_id"] = callee_channel_id

        await self.s.execute(
            update(Call)
            .where(Call.id == call_id)
            .values(**values)
        )
    
    async def mark_failed(
        self,
        call_id: uuid.UUID,
        reason: str,
    ) -> None:
        await self.s.execute(
            update(Call)
            .where(Call.id == call_id)
            .values(
                status="failed",
                hangup_reason=reason,
                ended_at=datetime.now().astimezone(),
            )
        )