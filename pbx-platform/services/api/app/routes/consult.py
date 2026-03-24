import uuid
from datetime import date, datetime, timezone, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from pbx_common.models.consultation import Consultation, ConsultationStatus
from pbx_common.models.consult_category import ConsultCategory
from app.db.session import get_db
from app.schemas.consult import (
    ConsultationCreate, ConsultationUpdate, ConsultationLinkCall, ConsultationResponse,
    ConsultCategoryCreate, ConsultCategoryUpdate, ConsultCategoryResponse,
)
from app.deps import get_current_user, require_permission

router = APIRouter(
    prefix="/api/v1/consults",
    tags=["Consultations"],
    dependencies=[Depends(get_current_user)],
)

@router.get("", response_model=List[ConsultationResponse])
async def list_consultation(
    skip: int = 0,
    limit: int = 100,
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    agent_id: Optional[int] = Query(None),
    company_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    _: object = Depends(require_permission("consult-list"))
): 
    conditions = []

    if status:
        try:
            conditions.append(Consultation.status == ConsultationStatus(status))
        except:
            raise HTTPException(status_code=400, detail=f"유효하지 않은 status: {status}")
    else:
        # 기본 조회: INACTIVE 제외 출력
        conditions.append(Consultation.status != ConsultationStatus.INACTIVE)
    
    if date_from:
        conditions.append(
            Consultation.created_at >= datetime.combine(date_from, datetime.min.time()).replace(tzinfo=timezone.utc)
        )
    if date_to:
        conditions.append(
            Consultation.created_at < datetime.combine(date_to + timedelta(days=1), datetime.min.time()).replace(tzinfo=timezone.utc)
        )
    if agent_id:
        conditions.append(Consultation.agent_id == agent_id)
    if company_id:
        conditions.append(Consultation.company_id == company_id)
    
    stmt = (
        select(Consultation)
        .where(and_(*conditions))
        .order_by(Consultation.created_at.desc())
        .offset(skip).limit(limit)
    )
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("", response_model=ConsultationResponse)
async def create_consultation(
    data: ConsultationCreate,
    db: AsyncSession = Depends(get_db),
    _: object = Depends(require_permission("consult-create")),
):
    payload = data.model_dump()
    if payload.get("call_id"):
        try:
            payload["call_id"] = uuid.UUID(payload["call_id"])
        except:
            raise HTTPException(status_code=400, detail="유효하지 않은 call_id 형식입니다.")
    
    consult = Consultation(**payload)
    db.add(consult)
    await db.commit()
    await db.refresh(consult)
    return consult


@router.get("/categories", response_model=List[ConsultCategoryResponse])
async def list_categories(
    company_id: int = Query(...),
    depth: Optional[int] = Query(None),
    db: AsyncSession = Depends(get_db),
    _: object = Depends(require_permission("consult-list")),
):
    conditions = [
        ConsultCategory.company_id == company_id,
        ConsultCategory.is_active == True,
    ]
    if depth is not None:
        conditions.append(ConsultCategory.depth == depth)
    else:
        # depth=0 (대분류)만 ㄴ루트로 반환 -> children으로 하위 자동 로드
        conditions.append(ConsultCategory.parent_id == None)
    
    stmt = select(ConsultCategory).where(and_(*conditions)).order_by(ConsultCategory.sort_order)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("/categories", response_model=ConsultCategoryResponse)
async def create_category(
    data: ConsultCategoryCreate,
    db: AsyncSession = Depends(get_db),
    _: object = Depends(require_permission("consult-category-manage")),
):
    if data.parent_id:
        parent = await db.get(ConsultCategory, data.parent_id)
        if not parent:
            raise HTTPException(status_code=404, detail="상위 카테고리를 찾을 수 없습니다.")
        if parent.depth != data.depth -1:
            raise HTTPException(status_code=400, detail="depth가 상위카테고리와 맞지 않습니다.")
        
    cat = ConsultCategory(**data.model_dump())
    db.add(cat)
    await db.commit()
    await db.refresh(cat)
    return cat

@router.patch("/categories/{category_id}", response_model=ConsultCategoryResponse)
async def update_category(
    category_id: int,
    data: ConsultCategoryUpdate,
    db: AsyncSession = Depends(get_db),
    _: object = Depends(require_permission("consult-category-manage"))
):
    cat = await db.get(ConsultCategory, category_id)
    if not cat:
        raise HTTPException(status_code=404, detail="카테고리를 찾을 수 없습니다.")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(cat, key, value)
    await db.commit()
    await db.refresh(cat)
    return cat


@router.delete("/categories/{category_id}", status_code=204)
async def delete_category(
    category_id: int,
    db: AsyncSession = Depends(get_db),
    _: object = Depends(require_permission("consult-category-manage")),
):
    """소프트 삭제: is_active -> False"""
    cat = await db.get(ConsultCategory, category_id)
    if not cat:
        raise HTTPException(status_code=404, detail="카테고리를 찾을 수 없습니다.")
    cat.is_active = False
    await db.commit()


@router.get("/{consult_id}", response_model=ConsultationResponse)
async def get_consultation(
    consult_id: int,
    db: AsyncSession = Depends(get_db),
    _: object = Depends(require_permission("consult-list")),
):
    consult = await db.get(Consultation, consult_id)
    if not consult:
        raise HTTPException(status_code=404, detail="상담이력을 찾을 수 없습니다.")
    return consult


@router.patch("/{consult_id}", response_model=ConsultationResponse)
async def update_consultation(
    consult_id: int,
    data: ConsultationUpdate,
    db: AsyncSession = Depends(get_db),
    _: object = Depends(require_permission("consult-update")),
): 
    """원본 -> SUPERSEDED, 복제본(수정적용) => ACTIVE"""
    original = await db.get(Consultation, consult_id)
    if not original:
        raise HTTPException(status_code=404, detail="상담이력을 찾을 수 없습니다.")
    if original.status == ConsultationStatus.INACTIVE:
        raise HTTPException(status_code=400, detail="삭제(비활성화)된 상담이력은 수정할 수 없습니다.")
    
    original.status = ConsultationStatus.SUPERSEDED

    upd = data.model_dump(exclude_unset=True)
    new_consult = Consultation(
        call_id=original.call_id,
        agent_id=original.agent_id,
        company_id=original.company_id,
        original_id=original.id,
        category_id=upd.get("category_id", original.category_id),
        category=upd.get("category", original.category),
        memo=upd.get("memo", original.memo),
        started_at=original.started_at,
        ended_at=upd.get("ended_at", original.ended_at),
        status=ConsultationStatus.ACTIVE,
    )
    db.add(new_consult)
    await db.commit()
    await db.refresh(new_consult)
    return new_consult


@router.patch("/{consult_id}/link-call", response_model=ConsultationResponse)
async def link_call_to_consultation(
    consult_id: int,
    data: ConsultationLinkCall,
    db: AsyncSession = Depends(get_db),
    _: object = Depends(require_permission("consult-update")),
):
    """콜 이력 없이 생성된 상담에 나중에 콜을 연결 (버전 복제 없이 단순 업데이트)"""
    consult = await db.get(Consultation, consult_id)
    if not consult:
        raise HTTPException(status_code=404, detail="상담이력을 찾을 수 없습니다.")
    if consult.status == ConsultationStatus.INACTIVE:
        raise HTTPException(status_code=400, detail="삭제된 상담이력에는 콜을 연결할 수 없습니다.")
    
    try:
        call_uuid = uuid.UUID(data.call_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="유효하지 않은 call_id 형식입니다.")

    from pbx_common.models.call import Call
    call = await db.get(Call, call_uuid)
    if not call:
        raise HTTPException(status_code=404, detail="해당 콜이력을 찾을 수 없습니다.")
    
    consult.call_id = call_uuid
    await db.commit()
    await db.refresh(consult)
    return consult


@router.delete("/{consult_id}", status_code=204)
async def delete_consultation(
    consult_id: int,
    db: AsyncSession = Depends(get_db),
    _: object = Depends(require_permission("consult-delete")),
):
    """소프트 삭제: status -> INACTIVE"""
    consult = await db.get(Consultation, consult_id)
    if not consult:
        raise HTTPException(status_code=404, detail="상담이력을 찾을 수 없습니다.")
    if consult.status == ConsultationStatus.INACTIVE:
        raise HTTPException(status_code=400, detail="이미 삭제된 상담이력입니다.")
    consult.status = ConsultationStatus.INACTIVE
    await db.commit()