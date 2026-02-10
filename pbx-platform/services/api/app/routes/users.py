from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from datetime import datetime

from pbx_common.utils.security import SECRET_KEY, ALGORITHM
from pbx_common.models import User, Company, UserStatus, UserStatusLog, LoginStatus, UserActivity
from pbx_common.utils.security import hash_password
from app.db.session import get_db
from app.schemas.user import UserCreate, UserResponse

router = APIRouter(prefix="/api/v1/users", tags=["Users"], responses={404: {"description": "Not found"}})

# 1. 사용자 생성 API
@router.post("", response_model=UserResponse)
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
@router.get("", response_model=List[UserResponse])
async def read_users(db: AsyncSession = Depends(get_db)):
    query = select(User).order_by(User.id.asc())
    result = await db.execute(query)

    return result.scalars().all()