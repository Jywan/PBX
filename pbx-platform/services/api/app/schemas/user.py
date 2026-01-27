from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional
from pbx_common.models import UserRole

# 생성시 필요한 데이터
class UserCreate(BaseModel):
    account: str
    account_pw: str
    exten: Optional[str] = None
    name: str
    role: UserRole = UserRole.A #기본값은 상담원
    company_id: Optional[int] = None

# 조회 시 응답 데이터
class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    account: str
    company_id: Optional[int]
    exten: Optional[str]
    name: str
    role: UserRole
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime]
    deactivated_at: Optional[datetime]

class LoginRequest(BaseModel):
    account: str
    account_pw: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"