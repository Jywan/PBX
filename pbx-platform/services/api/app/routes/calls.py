from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from pbx_common.models import Call
from app.db.session import get_db
from app.schemas.call import CallResponse
from app.deps import get_current_user

router = APIRouter(prefix="/api/v1", tags=["Calls"], dependencies=[Depends(get_current_user)])

@router.get("/calls", response_model=List[CallResponse])
async def read_calls(
    skip: int = 0, 
    limit: int = 100, 
    db: AsyncSession = Depends(get_db)
):
    try:
        query = (
            select(Call)
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