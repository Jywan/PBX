from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from datetime import datetime

from pbx_common.models import User, Company, UserStatus, UserStatusLog, LoginStatus, UserActivity
from pbx_common.utils.security import hash_password, verify_password, create_access_token
from app.db.session import get_db
from app.schemas.user import UserCreate, UserResponse, LoginRequest, Token

router = APIRouter()

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

# 3. 로그인 (jwt 토큰 발급)
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

    # 3. 기존 로그 마감 처리 (혹시 종료되지 않은 로그가 있는 경우에만..)
    # ended_at이 null인 가장 최근 로그를 찾아 마감
    now = datetime.now()

    last_log_query = await db.execute(
        select(UserStatusLog)
        .where(UserStatusLog.user_id == user.id, UserStatusLog.ended_at == None)
    )
    unclosed_log = last_log_query.scalar_one_or_none()
    if unclosed_log:
        unclosed_log.ended_at = now
        diff = now - unclosed_log.started_at
        unclosed_log.duration = int(diff.total_seconds)

    # 4. UserStatus 업데이트 
    # 로그인 시점에는 LOGIN / READY 상태를 기본으로 설정
    # 추후 자동 후처리 옵션을 User 테이블에 추가한다면 로직 수정 필요
    await db.execute(
        update(UserStatus)
        .where(UserStatus.user_id == user.id)
        .values(
            login_status=LoginStatus.LOGIN,
            activity=UserActivity.READY
        )
    )

    # 5. 새로운 로그인 활동 로그 생성
    new_log = UserStatusLog(
        user_id=user.id,
        login_status=LoginStatus.LOGIN,
        activity=UserActivity.READY,
        started_at=now
    )
    db.add(new_log)

    # 6. 토큰 발급
    access_token = create_access_token(
        data={
            "sub": user.account,
            "name": user.name,
            "role": user.role.value if hasattr(user.role, 'value') else str(user.role),
            "id": user.id
        }
    )

    await db.commit()

    return {"access_token": access_token, "token_type": "bearer"}