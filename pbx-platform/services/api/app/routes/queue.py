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
    company_id: Optional[int] = Queue(None),
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
    _: object = Depends(require_permission("queue_update")),
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