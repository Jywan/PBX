from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from typing import Optional, List
from pbx_common.models import UserRole

class UserCreate(BaseModel):
    username: str = Field(..., min_length=4, max_length=50, description="로그인 ID")
    password: str = Field(..., min_length=8, description="비밀번호")
    name: str = Field(..., min_length=2, max_length=100, description="이름")
    extension: Optional[str] = Field(None, max_length=20, description="내선번호")
    role: UserRole = Field(UserRole.A, description="권한")
    company_id: int = Field(description="소속업체 ID")


class UserUpdate(BaseModel):
    password: Optional[str] = Field(None, min_length=8)
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    extension: Optional[str] = Field(None, max_length=20)
    role: Optional[UserRole] = Field(None, description="권한")
    company_id: Optional[int] = Field(None, description="소속업체 ID")

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: int
    username: str = Field(alias="account")  # DB: account -> API: username
    name: str
    extension: Optional[str] = Field(None, alias="exten")  # DB: exten -> API: extension
    role: str
    company_id: Optional[int] = None
    is_active: bool = True
    created_at: datetime


class UserDetailResponse(UserResponse):
    """관리자용 상세 정보"""
    updated_at: Optional[datetime]
    last_login: Optional[datetime]


class UserInternal(BaseModel):
    """내부 로직용"""
    model_config = ConfigDict(from_attributes=True)
    
    account: str
    account_pw: str
    exten: Optional[str]
    name: str
    role: UserRole
    company_id: Optional[int]

class LoginRequest(BaseModel):
    username: str  # API 표준 필드명 (내부적으로 account 매핑)
    password: str  # API 표준 필드명 (내부적으로 account_pw 매핑)

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    permissions: List[str] = []