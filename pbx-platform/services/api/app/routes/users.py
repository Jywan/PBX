from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime

from pbx_common.utils.security import SECRET_KEY, ALGORITHM
from pbx_common.models import User, Company, UserStatus, UserStatusLog, LoginStatus, UserActivity, UserRole, UserPermission, PsEndpoint, PsAuth, PsAor
from pbx_common.utils.security import hash_password
from app.db.session import get_db
from app.schemas.user import UserCreate, UserResponse, UserUpdate
from app.deps import get_current_user, require_role, require_permission

router = APIRouter(prefix="/api/v1/users", tags=["Users"])

# 1. 사용자 생성 API
# 권한: 시스템관리자(SYSTEM_ADMIN)
# 필요시 운영관리자(MANAGER)도 추가 예정
@router.post("", response_model=UserResponse)
async def create_user(
    user_in: UserCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.S))
):
    # API 필드(username) -> DB 필드(account) 매핑
    q_account = select(User).where(User.account == user_in.username)
    if (await db.execute(q_account)).scalars().first():
        raise HTTPException(status_code=400, detail="존재하는 계정ID입니다. 다른 계정ID를 사용해주세요.")

    company = await db.get(Company, user_in.company_id)
    if not company:
        raise HTTPException(status_code=404, detail="존재하지 않는 업체 ID입니다.")

    if user_in.extension:
        q_exten = select(User).where(User.exten == user_in.extension)
        if (await db.execute(q_exten)).scalars().first():
            raise HTTPException(status_code=400, detail="이미 사용 중인 내선번호입니다.")

    # API 필드명 -> DB 필드명 매핑
    new_user = User(
        account=user_in.username,  # username -> account
        account_pw=hash_password(user_in.password),  # password -> account_pw
        exten=user_in.extension,  # extension -> exten
        name=user_in.name,
        role=user_in.role,
        company_id=user_in.company_id
    )
    db.add(new_user)
    await db.flush()

    if user_in.extension:
        await _sync_pjsip(db, user_in.extension, user_in.password)

    now = datetime.now()
    db.add(UserStatus(user_id=new_user.id))
    db.add(UserStatusLog(
        user_id=new_user.id,
        login_status=LoginStatus.LOGOUT,
        activity=UserActivity.DISABLED,
        started_at=now,
        ended_at=now,
        duration=0
    ))

    await db.commit()
    await db.refresh(new_user)

    return UserResponse(
        id=new_user.id,
        username=new_user.account,
        name=new_user.name,
        extension=new_user.exten,
        role=new_user.role.value,
        company_id=new_user.company_id,
        is_active=new_user.is_active,
        created_at=new_user.created_at
    )

# 2. 사용자 목록 조회
# 권한: 액션권한이 있다면 접근 가능
@router.get("", response_model=List[UserResponse])
async def read_users(
    company_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("agent-detail"))
):
    # 역할에 따른 필터링
    if current_user.role == UserRole.S:
        if company_id is not None:
            query = select(User).where(User.company_id == company_id).order_by(User.id.asc())
        else:
            query = select(User).order_by(User.id.asc())
    else:
        # 시스템관리자가 아닌경우는 본인의 업체만 조회가능
        query = select(User).where(User.company_id == current_user.company_id).order_by(User.id.asc())   

    result = await db.execute(query)
    users = result.scalars().all()

    # UserResponse 형식으로 변환
    return [
        UserResponse(
            id=user.id,
            username=user.account,
            name=user.name,
            extension=user.exten,
            role=user.role.value,
            company_id=user.company_id,
            is_active=user.is_active,
            created_at=user.created_at
        )
        for user in users
    ]

# 3. 사용자 정보 수정
# 권한: 시스템관리자(SYSTEM_ADMIN), 운영관리자(MANAGER)
@router.patch("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int, user_in: UserUpdate, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.S, UserRole.M))
):
    user = await db.get(User, user_id)

    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")

    # 계정ID 업데이트 (중복 체크)
    if user_in.username is not None and user_in.username != user.account:
        q_account = select(User).where(User.account == user_in.username)
        existing_user = (await db.execute(q_account)).scalars().first()
        if existing_user:
            raise HTTPException(status_code=400, detail="존재하는 계정ID입니다. 다른 계정ID를 사용해주세요.")
        user.account = user_in.username

    # 비밀번호 업데이트 (선택 사항)
    if user_in.password and len(user_in.password.strip()) > 0:
        user.account_pw = hash_password(user_in.password)

    # 이름 업데이트
    if user_in.name is not None:
        user.name = user_in.name

    # 내선번호 업데이트
    if user_in.extension is not None:
        user.exten = user_in.extension

    # 권한 업데이트
    if user_in.role is not None:
        user.role = user_in.role

    # 소속업체 업데이트
    if user_in.company_id is not None:
        # 업체 존재 여부 확인
        company = await db.get(Company, user_in.company_id)
        if not company:
            raise HTTPException(status_code=404, detail="존재하지 않는 업체 ID입니다.")
        user.company_id = user_in.company_id

    # 내선번호 업데이트
    if user_in.extension is not None:
        if user_in.extension and user_in.extension != user.exten:
            q_exten = select(User).where(User.exten == user_in.extension, User.id != user_id)
            if (await db.execute(q_exten)).scalars().first():
                raise HTTPException(status_code=400, detail="이미 사용 중인 내선번호입니다.")
        old_exten = user.exten
        user.exten = user_in.extension
        if old_exten and old_exten != user_in.extension:
            await _delete_pjsip(db, old_exten)
        if user_in.extension:
            sip_pass = user_in.password if user_in.password else None
            if sip_pass:
                await _sync_pjsip(db, user_in.extension, sip_pass)

    await db.commit()
    await db.refresh(user)

    return UserResponse(
        id=user.id,
        username=user.account,
        name=user.name,
        extension=user.exten,
        role=user.role.value,
        company_id=user.company_id,
        is_active=user.is_active,
        created_at=user.created_at
    )

# 4. 사용자 비활성화
# 권한: 시스템관리자(SYSTEM_ADMIN), 운영관리자(MANAGER)
@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.S, UserRole.M))
):
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을수 없습니다.")

    user.is_active = False
    await db.commit()

# 5. 사용자 재활성화
# 권한: 시스템관리자(SYSTEM_ADMIN), 운영관리자(MANAGER)
@router.patch("/{user_id}/restore", response_model=UserResponse)
async def restore_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.S, UserRole.M))
):
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")

    user.is_active = True
    await db.commit()
    await db.refresh(user)

    return UserResponse(
        id=user.id,
        username=user.account,
        name=user.name,
        extension=user.exten,
        role=user.role.value,
        company_id=user.company_id,
        is_active=user.is_active,
        created_at=user.created_at
    )

# 6. 사용자별 권한 조회
# 권한: 시스템관리자(SYSTEM_ADMIN), 운영관리자(MANAGER)
@router.get("/{user_id}/permissions")
async def get_user_permissions(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.S, UserRole.M))
):
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")

    result = await db.execute(
        select(UserPermission.permission_id)
        .where(
            UserPermission.user_id == user_id,
            UserPermission.is_active == True
        )
    )
    permission_ids = [row[0] for row in result.all()]

    return {"permission_ids": permission_ids}


async def _sync_pjsip(db: AsyncSession, exten: str, password: str):
    from sqlalchemy.dialects.postgresql import insert as pg_insert

    await db.execute(
        pg_insert(PsAor).values(
            id=exten, max_contacts=1, remove_existing="yes"
        ).on_conflict_do_nothing()
    )
    await db.execute(
        pg_insert(PsAuth).values(
            id=f"{exten}-auth", auth_type="userpass", username=exten, password=password
        ).on_conflict_do_update(index_elements=["id"], set_={"password": password})
    )
    await db.execute(
        pg_insert(PsEndpoint).values(
            id=exten,
            transport="transport-udp",
            aors=exten,
            auth=f"{exten}-auth",
            context="internal",
            disallow="all",
            allow="ulaw",
            direct_media="no",
            rtp_symmetric="yes"
        ).on_conflict_do_nothing()
    )

async def _delete_pjsip(db: AsyncSession, exten: str):
    from sqlalchemy import delete
    await db.execute(delete(PsEndpoint).where(PsEndpoint.id == exten))
    await db.execute(delete(PsAuth).where(PsAuth.id == f"{exten}-auth"))
    await db.execute(delete(PsAor).where(PsAor.id == exten))