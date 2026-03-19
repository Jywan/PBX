import httpx

from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from pbx_common.models import Call
from app.db.session import get_db
from app.schemas.call import CallResponse
from app.deps import get_current_user
from app.core.config import get_settings

router = APIRouter(prefix="/api/v1", tags=["Calls"], dependencies=[Depends(get_current_user)])

@router.get("/calls", response_model=List[CallResponse])
async def read_calls(
    skip: int = 0, 
    limit: int = 100, 
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    direction: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    try:
        conditions = []

        if date_from:
            from datetime import datetime, timezone
            conditions.append(
                (Call.started_at != None) &
                (Call.started_at >= datetime.combine(date_from, datetime.min.time()).replace(tzinfo=timezone.utc))
            )
        if date_to:
            from datetime import datetime, timezone, timedelta
            conditions.append(
                (Call.started_at != None) &
                (Call.started_at < datetime.combine(date_to, timedelta(days=1), datetime.min.time()).replace(tzinfo=timezone.utc))
            )
        if direction:
            conditions.append(Call.direction == direction)
        if status:
            conditions.append(Call.status == status)
        if search:
            conditions.append(
                Call.caller_exten.ilike(f"%{search}") |
                Call.callee_exten.ilike(f"%{search}")
            )

        query = (
            select(Call)
            .where(and_(*conditions))
            .order_by(Call.started_at.desc())
            .offset(skip)
            .limit(limit)
        )

        result = await db.execute(query)
        calls = result.scalars().all()

        return calls
    
    except Exception as e:
        print(f"Error fetching calls: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/calls/originate")
async def originate_call(extension: str):
    settings = get_settings()

    digits_only = "".join(c for c in extension if c.isdigit())
    is_external = len(digits_only) > 5

    if is_external:
        if not settings.outbound_trunk:
            raise HTTPException(status_code=400, detail="외부 번호 발신을 위한 트렁크가 설정되지 않았습니다. (OUTBOUND_TRUNK)")
        endpoint = f"PJSIP/{extension}@{settings.outbound_trunk}"
    else:
        endpoint = f"PJSIP/{extension}"

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"http://{settings.ari_host}:{settings.ari_port}/ari/channels",
            auth=(settings.ari_user, settings.ari_pass),
            params={
                "endpoint": endpoint,
                "app": settings.ari_app,
                "appArgs": f"direct,{extension}",
                "callerId": "WebCall",
                "timeout": 30,
            }
        )
    if resp.status_code not in (200, 204):
        raise HTTPException(status_code=resp.status_code, detail=resp.text)
    return { "status": "ringing", "extension": extension, "external": is_external }