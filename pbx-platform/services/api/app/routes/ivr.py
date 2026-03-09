from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.schemas.ivr import (
    IvrFlowCreate, IvrFlowUpdate, IvrFlowResponse,
    IvrNodeCreate, IvrNodeUpdate, IvrNodeResponse,
)
from pbx_common.models import IvrFlow, IvrNode
from app.deps import get_current_user

router = APIRouter(prefix="/api/v1/ivr", tags=["IVR"], dependencies=[Depends(get_current_user)],)


@router.get("/flows", response_model=List[IvrFlowResponse])
async def list_flows(
    company_id: Optional[int] = Query(None),
    include_presets: bool = Query(True),
    db: AsyncSession = Depends(get_db),
): 
    from sqlalchemy import or_
    conditions = []
    if company_id is not None:
        if include_presets:
            conditions.append(
                or_(IvrFlow.company_id == company_id, IvrFlow.is_preset == True)
            )
        else:
            conditions.append(IvrFlow.company_id == company_id)
    
    stmt = (
        select(IvrFlow)
        .where(*conditions)
        .options(selectinload(IvrFlow.nodes))
        .order_by(IvrFlow.is_preset.desc(), IvrFlow.name)
    )
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("/flows", response_model=IvrFlowResponse)
async def created_flow(data: IvrFlowCreate, db: AsyncSession = Depends(get_db)):
    flow = IvrFlow(**data.model_dump())
    db.add(flow)
    await db.commit()
    stmt = select(IvrFlow).where(IvrFlow.id == flow.id).options(selectinload(IvrFlow.nodes))
    result = await db.execute(stmt)
    return result.scalar_one()


@router.get("/flows/{flow_id}", response_model=IvrFlowResponse)
async def get_flow(flow_id: int, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(IvrFlow)
        .where(IvrFlow.id == flow_id)
        .options(selectinload(IvrFlow.nodes))
    )
    result = await db.execute(stmt)
    flow = result.scalar_one_or_none()
    if not flow:
        raise HTTPException(status_code=404, detail="IVR 플로우를 찾을 수 없습니다.")
    return flow


@router.patch("/flows/{flow_id}", response_model=IvrFlowResponse)
async def update_flow(flow_id: int, data: IvrFlowUpdate, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(IvrFlow)
        .where(IvrFlow.id == flow_id)
        .options(selectinload(IvrFlow.nodes))
    )
    result = await db.execute(stmt)
    flow = result.scalar_one_or_none()
    if not flow:
        raise HTTPException(status_code=404, detail="IVR 플로우를 찾을 수 없습니다.")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(flow, key, value)
    await db.commit()
    await db.refresh(flow)
    return flow


@router.delete("/flows/{flow_id}")
async def delete_flow(flow_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(IvrFlow).where(IvrFlow.id == flow_id))
    flow = result.scalar_one_or_none()
    if not flow:
        raise HTTPException(status_code=404, detail="IVR 플로우를 찾을 수 없습니다.")
    await db.delete(flow)
    await db.commit()
    return {"message": f"'{flow.name}' 삭제 완료"}