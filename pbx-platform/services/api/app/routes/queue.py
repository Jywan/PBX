from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.schemas.queue import QueueCreate, QueueUpdate, QueueResponse, QueueMemberCreate, QueueMemberUpdate, QueueMemberResponse
from pbx_common.models.queue import Queue, QueueMember
from pbx_common.models.user import User
from app.deps import get_current_user, require_permission

router = APIRouter(prefix="/api/v1/queues", tags=["Queue"], dependencies=[Depends(get_current_user)])

def _queue_stmt(condition):
    return (
        select(Queue)
        .where(condition)
        .options(selectinload(Queue.members).selectinload(QueueMember.user))
    )


@router.get("", response_model=List[QueueResponse])
async def list_queues(
    company_id: Optional[int] = Query(None),
    db: AsyncSession = Depends(get_db),
    _: object = Depends(require_permission("queue-detail")),
): 
    conditions = []
    if company_id is not None:
        conditions.append(Queue.company_id == company_id)
    
    stmt = (
        select(Queue)
        .where(*conditions)
        .options(selectinload(Queue.members).selectinload(QueueMember.user))
        .order_by(Queue.name)
    )
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("", response_model=QueueResponse)
async def create_queue(
    data: QueueCreate,
    db: AsyncSession = Depends(get_db),
    _: object = Depends(require_permission("queue-create")),
):
    queue = Queue(**data.model_dump())
    db.add(queue)
    await db.commit()
    result = await db.execute(_queue_stmt(Queue.id == queue.id))
    return result.scalar_one()


@router.get("/{queue_id}", response_model=QueueResponse)
async def get_queue(
    queue_id: int,
    db: AsyncSession = Depends(get_db),
    _: object = Depends(require_permission("queue-detail")),
):
    result = await db.execute(_queue_stmt(Queue.id == queue_id))
    queue = result.scalar_one_or_none()
    if not queue:
        raise HTTPException(status_code=404, detail="큐를 찾을수 없습니다.")
    return queue


@router.patch("/{queue_id}", response_model=QueueResponse)
async def update_queue(
    queue_id: int,
    data: QueueUpdate,
    db: AsyncSession = Depends(get_db),
    _: object = Depends(require_permission("queue-update")),
):
    result = await db.execute(_queue_stmt(Queue.id == queue_id))
    queue = result.scalar_one_or_none()
    if not queue:
        raise HTTPException(status_code=404, detail="큐를 찾을 수 없습니다.")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(queue, key, value)
    await db.commit()
    result2 = await db.execute(_queue_stmt(Queue.id == queue_id))
    return result2.scalar_one()


@router.delete("/{queue_id}")
async def delete_queue(
    queue_id: int,
    db: AsyncSession = Depends(get_db),
    _: object = Depends(require_permission("queue-delete")),
):
    result = await db.execute(select(Queue).where(Queue.id == queue_id))
    queue = result.scalar_one_or_none()
    if not queue:
        raise HTTPException(status_code=404, detail="큐를 찾을 수 없습니다.")
    await db.delete(queue)
    await db.commit()
    return { "message": f"'{queue.name}' 삭제 완료" }


@router.post("/{queue_id}/members", response_model=QueueMemberResponse)
async def add_member(
    queue_id: int,
    data: QueueMemberCreate,
    db: AsyncSession = Depends(get_db),
    _: object = Depends(require_permission("queue-update")),
):
    check = await db.execute(select(Queue).where(Queue.id == queue_id))
    if not check.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="큐를 찾을 수 없습니다.")
    
    # user_id 있으면 interface/membername 자동 설정
    interface = data.interface
    membername = data.membername
    if data.user_id:
        user = await db.get(User, data.user_id)
        if not user:
            raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다")
        if user.exten:
            interface = f"SIP/{user.exten}"
        membername = membername or user.name
    
    member = QueueMember(
        queue_id=queue_id,
        user_id=data.user_id,
        interface=interface,
        membername=membername,
        penalty=data.penalty,
    )
    db.add(member)
    await db.commit()
    result = await db.execute(
        select(QueueMember).where(QueueMember.id == member.id).options(selectinload(QueueMember.user))
    )
    return result.scalar_one()


@router.patch("/members/{member_id}", response_model=QueueMemberResponse)
async def update_member(
    member_id: int,
    data: QueueMemberUpdate,
    db: AsyncSession = Depends(get_db),
    _: object = Depends(require_permission("queue-update"))
):
    result = await db.execute(
        select(QueueMember).where(QueueMember.id == member_id).options(selectinload(QueueMember.user))
    )
    member = result.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=404, detail="멤버를 찾을 수 업습니다.")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(member, key, value)
    await db.commit()
    result2 = await db.execute(
        select(QueueMember).where(QueueMember.id == member_id).options(selectinload(QueueMember.user))
    )
    return result2.scalar_one()


@router.delete("/members/{member_id}")
async def remove_member(
    member_id: int,
    db: AsyncSession = Depends(get_db),
    _: object = Depends(require_permission("queue-update")),
):
    result = await db.execute(select(QueueMember).where(QueueMember.id == member_id))
    member = result.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=404, detail="멤버를 찾을 수 없습니다.")
    await db.delete(member)
    await db.commit()
    return { "message": "멤버 삭제 완료" }