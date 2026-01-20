from __future__ import annotations

import uuid
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.deps.common import get_db
from pbx_common.models import Call, CallEvent

router = APIRouter(tags=["calls"])

@router.get("/calls")
async def list_calls(db: AsyncSession = Depends(get_db)):
    rows = (await db.execute(select(Call).order_by(Call.created_at.desc()).limit(50))).scalars().all()
    return [
        {
            "id": str(x.id),
            "caller_exten": x.caller_exten,
            "callee_exten": x.callee_exten,
            "status": x.status,
            "started_at": x.started_at,
            "answered_at": x.answered_at,
            "ended_at": x.ended_at,
        }
        for x in rows
    ]

@router.get("/calls/{call_id}")
async def get_call(call_id: uuid.UUID, db:AsyncSession = Depends(get_db)):
    call = (await db.execute(select(Call).where(Call.id == call_id))).scalar_one_or_none()
    if not call:
        return {"error": "not_found"}
    
    events = (await db.execute(
        select(CallEvent).where(CallEvent.call_id == call_id).order_by(CallEvent.ts.asc())
    )).scalars().all()

    return {
        "calls": {
            "id": str(call.id),
            "caller_exten": call.caller_exten,
            "callee_exten": call.callee_exten,
            "status": call.status,
            "answered_at": call.answered_at,
            "ended_at": call.ended_at,
            "hangup_cause": call.hangup_cause,
            "hangup_reason": call.hangup_reason,
        },
        "events": [
            {
                "ts": e.ts,
                "type": e.type,
                "channel_id": e.channel_id,
                "bridge_id": e.bridge_id,
            }
            for e in events
        ],
    }