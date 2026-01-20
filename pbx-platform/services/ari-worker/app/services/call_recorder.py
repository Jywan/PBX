# pbx-platform/services/ari-worker/app/services/call_recorder.py
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from pbx_common.models import Call, CallEvent


class CallRecorder:
    def __init__(self, session: AsyncSession):
        self.s = session

    async def ensure_call_row(
        self,
        call_id: uuid.UUID,
        caller_exten: Optional[str],
        callee_exten: Optional[str],
        caller_channel_id: Optional[str],
    ) -> None:
        """
        calls 테이블에 call_id row가 없으면 생성합니다.
        (콜이 시작되었음을 의미하는 최소 정보만 적재)
        """
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
        """
        call_events 테이블에 원문 이벤트를 적재합니다.
        call_id는 아직 매핑이 안된 이벤트가 있을 수 있으므로 nullable 허용.
        """
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

    async def mark_bridged(
        self,
        call_id: uuid.UUID,
        bridge_id: str,
        caller_channel_id: str,
        callee_channel_id: str,
    ) -> None:
        await self.s.execute(
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

    async def mark_failed(self, call_id: uuid.UUID, reason: str) -> None:
        """
        처리 실패(브릿지 실패 등) 시 calls 업데이트.
        """
        await self.s.execute(
            update(Call)
            .where(Call.id == call_id)
            .values(
                status="failed",
                hangup_reason=reason,
                ended_at=datetime.now().astimezone(),
            )
        )

    async def mark_ended(
        self,
        call_id: uuid.UUID,
        ended_at: Optional[datetime] = None,
        hangup_cause: Optional[int] = None,
        hangup_reason: Optional[str] = None,
    ) -> None:
        await self.s.execute(
            update(Call)
            .where(Call.id == call_id)
            .values(
                ended_at=ended_at or datetime.now().astimezone(),
                hangup_cause=hangup_cause,
                hangup_reason=hangup_reason,
                status="ended",
            )
        )