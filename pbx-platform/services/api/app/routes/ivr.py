import uuid, os, shutil

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.schemas.ivr import (
    IvrFlowCreate, IvrFlowUpdate, IvrFlowResponse,
    IvrNodeCreate, IvrNodeUpdate, IvrNodeResponse,
    IvrSoundResponse,
)
from app.core.config import get_settings
from pbx_common.models.ivr import IvrFlow, IvrNode, IvrSound
from app.deps import get_current_user, require_permission

router = APIRouter(prefix="/api/v1/ivr", tags=["IVR"], dependencies=[Depends(get_current_user)],)


@router.get("/flows", response_model=List[IvrFlowResponse])
async def list_flows(
    company_id: Optional[int] = Query(None),
    include_presets: bool = Query(True),
    db: AsyncSession = Depends(get_db),
    _: object = Depends(require_permission("ivr-detail")),
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
    flows = result.scalars().all()
    for flow in flows:
        flow.nodes.sort(key=lambda n: n.sort_order)
    return flows


@router.post("/flows", response_model=IvrFlowResponse)
async def created_flow(
    data: IvrFlowCreate, 
    db: AsyncSession = Depends(get_db), 
    _: object = Depends(require_permission("ivr-create")),
):
    flow = IvrFlow(**data.model_dump())
    db.add(flow)
    await db.commit()
    stmt = select(IvrFlow).where(IvrFlow.id == flow.id).options(selectinload(IvrFlow.nodes))
    result = await db.execute(stmt)
    return result.scalar_one()


@router.get("/flows/{flow_id}", response_model=IvrFlowResponse)
async def get_flow(
    flow_id: int, 
    db: AsyncSession = Depends(get_db),
    _: object = Depends(require_permission("ivr-detail")),
):
    stmt = (
        select(IvrFlow)
        .where(IvrFlow.id == flow_id)
        .options(selectinload(IvrFlow.nodes))
    )
    result = await db.execute(stmt)
    flow = result.scalar_one_or_none()
    if not flow:
        raise HTTPException(status_code=404, detail="IVR 플로우를 찾을 수 없습니다.")
    flow.nodes.sort(key=lambda n: n.sort_order)
    return flow


@router.patch("/flows/{flow_id}", response_model=IvrFlowResponse)
async def update_flow(
    flow_id: int, 
    data: IvrFlowUpdate, 
    db: AsyncSession = Depends(get_db),
    _: object = Depends(require_permission("ivr-update")),
):
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
async def delete_flow(
    flow_id: int,
    db: AsyncSession = Depends(get_db),
    _: object = Depends(require_permission("ivr-delete")),
):
    result = await db.execute(select(IvrFlow).where(IvrFlow.id == flow_id))
    flow = result.scalar_one_or_none()
    if not flow:
        raise HTTPException(status_code=404, detail="IVR 플로우를 찾을 수 없습니다.")
    await db.delete(flow)
    await db.commit()
    return {"message": f"'{flow.name}' 삭제 완료"}


@router.post("/flows/{flow_id}/clone", response_model=IvrFlowResponse)
async def clone_flow(
    flow_id: int, 
    new_name: str = Query(...),
    company_id: Optional[int] = Query(None),
    db: AsyncSession = Depends(get_db),
    _: object = Depends(require_permission("ivr-create")),
):
    stmt = (
        select(IvrFlow)
        .where(IvrFlow.id == flow_id)
        .options(selectinload(IvrFlow.nodes))
    )
    result = await db.execute(stmt)
    original = result.scalar_one_or_none()
    if not original:
        raise HTTPException(status_code=404, detail="원본 플로우를 찾을 수 없습니다.")
    
    new_flow = IvrFlow(name=new_name, company_id=company_id, is_preset=False, is_active=True)
    db.add(new_flow)
    await db.flush()

    # 노드 재귀 복제
    all_nodes = list(original.nodes)

    async def clone_node(orig: IvrNode, new_parent_id: Optional[int]) -> None:
        new_node = IvrNode(
            flow_id=new_flow.id,
            parent_id=new_parent_id,
            dtmf_key=orig.dtmf_key,
            node_type=orig.node_type,
            name=orig.name,
            config=dict(orig.config),
            sort_order=orig.sort_order,
        )
        db.add(new_node)
        await db.flush()
        for child in [n for n in all_nodes if n.parent_id == orig.id]:
            await clone_node(child, new_node.id)

    for root in [n for n in all_nodes if n.parent_id is None]:
        await clone_node(root, None)
    
    await db.commit()

    stmt2 = (
        select(IvrFlow)
        .where(IvrFlow.id == new_flow.id)
        .options(selectinload(IvrFlow.nodes))
    )
    result2 = await db.execute(stmt2)
    return result2.scalar_one()


@router.post("/flows/{flow_id}/nodes", response_model=IvrNodeResponse)
async def create_node(
    flow_id: int, 
    data: IvrNodeCreate, 
    db: AsyncSession = Depends(get_db),
    _: object = Depends(require_permission("ivr-update")),
):
    check = await db.execute(select(IvrFlow).where(IvrFlow.id == flow_id))
    if not check.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="IVR 플로우를 찾을 수 없습니다.")
    node = IvrNode(flow_id=flow_id, **data.model_dump())
    db.add(node)
    await db.commit()
    await db.refresh(node)
    return node


@router.patch("/nodes/{node_id}", response_model=IvrNodeResponse)
async def update_node(
    node_id: int, 
    data: IvrNodeUpdate, 
    db: AsyncSession = Depends(get_db),
    _: object = Depends(require_permission("ivr-update")),
):
    result = await db.execute(select(IvrNode).where(IvrNode.id == node_id))
    node = result.scalar_one_or_none()
    if not node:
        raise HTTPException(status_code=404, detail="노드를 찾을 수 없습니다.")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(node, key, value)
    await db.commit()
    await db.refresh(node)
    return node


@router.delete("/nodes/{node_id}")
async def delete_node(
    node_id: int, 
    db: AsyncSession = Depends(get_db),
    _: object = Depends(require_permission("ivr-update"))
):
    result = await db.execute(select(IvrNode).where(IvrNode.id == node_id))
    node = result.scalar_one_or_none()
    if not node:
        raise HTTPException(status_code=404, detail="노드를 찾을 수 없습니다.")
    await db.delete(node)
    await db.commit()
    return {"message": "노드 삭제 완료"}


@router.get("/sounds", response_model=list[IvrSoundResponse])
async def list_sounds(
    company_id: Optional[int] = Query(None),
    db: AsyncSession = Depends(get_db),
    _: object = Depends(require_permission("ivr-detail")),
):
    conditions = []
    if company_id is not None:
        conditions.append(IvrSound.company_id == company_id)
    stmt = select(IvrSound).where(*conditions).order_by(IvrSound.created_at.desc())
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("/sounds", response_model=IvrSoundResponse)
async def upload_sound(
    name: str = Form(...),
    company_id: Optional[int] = Form(None),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    _: object = Depends(require_permission("ivr-create")),
):
    settings = get_settings()
    ext = os.path.splitext(file.filename or "")[1].lower() or ".wav"
    unique_filename = f"{uuid.uuid4().hex}{ext}"
    subdir = str(company_id) if company_id else "global"
    dir_path = os.path.join(settings.sounds_dir, subdir)
    os.makedirs(dir_path, exist_ok=True)
    file_path = os.path.join(dir_path, unique_filename)

    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    sound = IvrSound(
        company_id=company_id,
        name=name,
        filename=f"{subdir}/{unique_filename}",
        original_filename=file.filename or unique_filename,
    )
    db.add(sound)
    await db.commit()
    await db.refresh(sound)
    return sound


@router.delete("/sounds/{sound_id}", status_code=204)
async def delete_sound(
    sound_id: int,
    db: AsyncSession = Depends(get_db),
    _: object = Depends(require_permission("ivr-delete")),
):
    settings = get_settings()
    result = await db.execute(select(IvrSound).where(IvrSound.id == sound_id))
    sound = result.scalar_one_or_none()
    if not sound:
        raise HTTPException(status_code=404, detail="음성 파일을 찾을 수 없습니다.")
    file_path = os.path.join(settings.sounds_dir, sound.filename)
    if os.path.exists(file_path):
        os.remove(file_path)
    await db.delete(sound)
    await db.commit()
