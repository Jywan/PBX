from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, and_
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.orm import selectinload
from sqlalchemy import func

from app.db.session import get_db
from app.schemas.permissions import MenuTemplateCreate, PermissionUpdate, UserPermissionAssign
from pbx_common.models import Permission, PermissionType, UserPermission
from app.deps import get_current_user

router = APIRouter(prefix="/api/v1/permissions", tags=["Permissions"], dependencies=[Depends(get_current_user)])

@router.post("/template")
async def create_permission_template(data: MenuTemplateCreate, db: AsyncSession = Depends(get_db)):
    # 1. 부모 메뉴(MENU) 처리 (기존 로직 유지)
    stmt = select(Permission).where(Permission.code == data.menu_code, Permission.parent_id == None)
    result = await db.execute(stmt)
    menu = result.scalar_one_or_none()

    if menu:
        menu.name = data.menu_name
        menu.is_active = True 
    else:
        menu = Permission(code=data.menu_code, name=data.menu_name, type=PermissionType.MENU, parent_id=None, is_active=True)
        db.add(menu)

    await db.flush()

    # 2. 하위 액션(ACTION) 동기화 처리
    existing_actions_stmt = select(Permission).where(Permission.parent_id == menu.id)
    existing_actions_result = await db.execute(existing_actions_stmt)
    db_actions = {a.code: a for a in existing_actions_result.scalars().all()}

    incoming_action_codes = []
    if data.actions:
        for act_data in data.actions:
            incoming_action_codes.append(act_data.code)
            if act_data.code in db_actions:
                # 💡 수정: 프론트에서 보낸 활성/비활성 상태(act_data.is_active)를 반영
                db_actions[act_data.code].name = act_data.name
                db_actions[act_data.code].is_active = act_data.is_active 
            else:
                # 💡 수정: 신규 생성 시에도 프론트에서 설정한 상태를 반영
                new_action = Permission(
                    code=act_data.code,
                    name=act_data.name,
                    type=PermissionType.ACTION,
                    parent_id=menu.id,
                    is_active=act_data.is_active 
                )
                db.add(new_action)

    # 3. 리스트에서 사라진 액션은 기존처럼 비활성화(Soft Delete)
    for code, action_obj in db_actions.items():
        if code not in incoming_action_codes:
            action_obj.is_active = False

    try:
        await db.commit()
        return {"status": "success", "menu_id": menu.id}
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=f"저장 실패: {str(e)}")

@router.get("/templates")
async def get_permission_templates(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Permission)
        .where(Permission.parent_id == None)
        .options(selectinload(Permission.children))
    )
    return result.scalars().all()

@router.patch("/template/{permission_id}")
async def patch_permission_template(permission_id: int, data: PermissionUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Permission)
        .where(Permission.id == permission_id)
    )
    permission = result.scalar_one_or_none()

    if not permission:
        raise HTTPException(status_code=404, detail="해당 권한을 찾을수 없습니다.")
    
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(permission, key, value)

    try:
        await db.commit()
        return {"status": "success", "update_fields": list(update_data.keys())}
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=f"수정 실패: {str(e)}")
    
@router.delete("/template/{permission_id}")
async def delete_permission_template(permission_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Permission)
        .where(Permission.id == permission_id)
    )
    permission = result.scalar_one_or_none()

    if not permission:
        raise HTTPException(status_code=404, detail="삭제할 권한이 없습니다.")

    permission.is_active = False

    # 부모(MENU) 삭제 시 하위 액션들도 모두 비활성화 처리
    if permission.parent_id is None:
        await db.execute(
            update(Permission)
            .where(Permission.parent_id == permission.id)
            .values(is_active=False)
        )

    await db.commit()
    return {"message": f"'{permission.name}' 및 하위권한 비활성화 완료"}


@router.post("/assign")
async def assign_user_permissions(data: UserPermissionAssign, db: AsyncSession = Depends(get_db)):
    # ... 유저 권한 할당 로직은 기존 소스 유지 ...
    await db.execute(
        update(UserPermission)
        .where(UserPermission.user_id == data.user_id, 
                UserPermission.permission_id.in_(
                    select(Permission.id).where(Permission.parent_id == data.menu_id))
                )
        .values(is_active=False, updated_at=func.now())
    )

    target_ids = set(data.permission_ids)
    if target_ids:
        target_ids.add(data.menu_id)

    for p_id in target_ids:
        stmt = pg_insert(UserPermission).values(
            user_id=data.user_id,
            permission_id=p_id,
            is_active=True
        ).on_conflict_do_update(
            index_elements=['user_id', 'permission_id'],
            set_=dict(is_active=True, updated_at=func.now())
        )
        await db.execute(stmt)

    try:
        await db.commit()
        return {"message": "해당 메뉴 권한 동기화 완료"}
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))