from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from datetime import datetime, timezone
from jose import jwt

from pbx_common.utils.security import SECRET_KEY, ALGORITHM
from pbx_common.models import Permission, User, Company, UserPermission, UserStatus, UserStatusLog, LoginStatus, UserActivity
from pbx_common.utils.security import hash_password, verify_password, create_access_token
from app.db.session import get_db
from app.schemas.user import UserCreate, UserResponse, LoginRequest, Token

router = APIRouter(prefix="/api/v1", tags=["Users"], responses={404: {"description": "Not found"}})

# 1. 사용자 생성 API
@router.post("/users", response_model=UserResponse)
async def create_user(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    # 이미 존재하는 계정인지 확인
    query = select(User).where(User.account == user_in.account)
    result = await db.execute(query)
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="이미 존재하는 계정입니다.")

    if user_in.company_id is not None:
        company_query = select(Company).where(Company.id == user_in.company_id)
        company_result = await db.execute(company_query)
        if not company_result.scalars().first():
            raise HTTPException(status_code=404, detail="존재하지 않는 업체 ID입니다.")

    new_user = User(
        account=user_in.account,
        account_pw=hash_password(user_in.account_pw),
        exten=user_in.exten,
        name=user_in.name,
        role=user_in.role,
        company_id=user_in.company_id 
    )
    db.add(new_user)

    await db.flush()

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
    return new_user

# 2. 사용자 목록 조회(일단 테스트)
@router.get("/users", response_model=List[UserResponse])
async def read_users(db: AsyncSession = Depends(get_db)):
    query = select(User).order_by(User.id.asc())
    result = await db.execute(query)

    return result.scalars().all()

# 3. 로그인 (+ jwt 토큰 발급)
@router.post("/login", response_model=Token)
async def login(login_data: LoginRequest, db: AsyncSession = Depends(get_db)):
    # 1. 계정 체크
    result = await db.execute(select(User).where(User.account == login_data.account))
    user = result.scalars().first()

    # 2. 유저 존재 여부
    if not user or not verify_password(login_data.account_pw, user.account_pw):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="존재하지 않는 계정입니다.",
        )
    
    # 3. UserPermission과 Permission 테이블을 조인해서 code 값만 긁어오기
    perm_result = await db.execute(
        select(Permission.code)
        .join(UserPermission, UserPermission.permission_id == Permission.id)
        .where(
            UserPermission.user_id == user.id,
            UserPermission.is_active == True
        )
    )
    user_permissions = perm_result.scalars().all()

    # 4. 기존 로그 마감 처리 (혹시 종료되지 않은 로그가 있는 경우에만..)
    # ended_at이 null인 가장 최근 로그를 찾아 마감
    now = datetime.now(timezone.utc)

    last_log_query = await db.execute(
        select(UserStatusLog)
        .where(UserStatusLog.user_id == user.id, UserStatusLog.ended_at == None)
    )
    unclosed_log = last_log_query.scalar_one_or_none()
    if unclosed_log:
        unclosed_log.ended_at = now
        diff = now - unclosed_log.started_at
        unclosed_log.duration = int(diff.total_seconds())

    # 5. UserStatus 업데이트 
    # 로그인 시점에는 LOGIN / READY 상태를 기본으로 설정
    # 추후 자동 후처리 옵션을 User 테이블에 추가한다면 로직 수정 필요
    await db.execute(
        update(UserStatus)
        .where(UserStatus.user_id == user.id)
        .values(
            login_status=LoginStatus.LOGIN,
            activity=UserActivity.READY,
            last_login_at=now
        )
    )

    # 6. 새로운 로그인 활동 로그 생성
    new_log = UserStatusLog(
        user_id=user.id,
        login_status=LoginStatus.LOGIN,
        activity=UserActivity.READY,
        started_at=now
    )
    db.add(new_log)

    # 7. 토큰 발급
    access_token = create_access_token(
        data={
            "sub": user.account,
            "name": user.name,
            "role": user.role.value if hasattr(user.role, 'value') else str(user.role),
            "id": user.id
        }
    )

    await db.commit()

    return {
        "access_token": access_token,
        "token_type": "bearer", 
        "permissions": user_permissions,    
    }


@router.post("/logout")
async def logout(request: Request, db: AsyncSession = Depends(get_db)):
    # 1. 토큰에서 user_id 추출 (보안 및 식별)
    auth_header = request.headers.get("Authorization")
    token = auth_header.split(" ")[1]
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    user_id = payload.get("id")

    now = datetime.now(timezone.utc)

    # 2. 직전 활동(READY, BUSY 등) 마감
    # ended_at이 NULL인 이전 상태를 찾아 종료 시각과 지속 시간을 기록합니다.
    result = await db.execute(
        select(UserStatusLog)
        .where(UserStatusLog.user_id == user_id, UserStatusLog.ended_at == None)
    )
    unclosed_log = result.scalar_one_or_none()
    
    if unclosed_log:
        unclosed_log.ended_at = now
        diff = now - unclosed_log.started_at
        unclosed_log.duration = int(diff.total_seconds())

    # 3. 실시간 상태 테이블(UserStatus) 업데이트
    await db.execute(
        update(UserStatus)
        .where(UserStatus.user_id == user_id)
        .values(
            login_status=LoginStatus.LOGOUT, 
            activity=UserActivity.DISABLED
        )
    )

    # 4. '로그아웃' 상태 시작 이력 생성
    logout_start_log = UserStatusLog(
        user_id=user_id,
        login_status=LoginStatus.LOGOUT,
        activity=UserActivity.DISABLED,
        started_at=now
        # ended_at은 다음 로그인 시점까지 NULL
    )
    db.add(logout_start_log)
    
    await db.commit()
    return {"message": "success"}