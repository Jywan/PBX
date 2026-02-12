from pydantic import BaseModel, ConfigDict, Field, field_validator
from datetime import datetime
from typing import Optional, List
import re

from pbx_common.models import UserRole

class UserCreate(BaseModel):
    username: str = Field(..., min_length=4, max_length=50, description="로그인 ID")
    password: str = Field(..., min_length=8, max_length=128, description="비밀번호")
    name: str = Field(..., min_length=2, max_length=100, description="이름")
    extension: Optional[str] = Field(None, max_length=20, description="내선번호")
    role: UserRole = Field(UserRole.A, description="권한")
    company_id: int = Field(description="소속업체 ID")

    @field_validator('password')
    def validate_password_strength(cls, v):
        """비밀번호 복잡도 검증"""
        errors = []

        # 길이 검증
        if len(v) < 8:
            errors.append("최소 8자 이상")
        
        # 영문자 포함 확인 (대소문자 구분 없음)
        if not re.search(r'[a-zA-Z]', v):
            errors.append("영문자 1개 이상")
        
        # 숫자 포함 확인
        if not re.search(r'[0-9]', v):
            errors.append("숫자 1개 이상")
        
        if errors:
            raise ValueError(f"비밀번호 요구사항 미충족: {', '.join(errors)}")
        
        return v
    
    @field_validator('username')
    def validate_username(cls, v):
        """사용자계정 검증 - SQL Injection 방지"""
        if not re.match(r'^[a-zA-Z0-9_]+$', v):
            raise ValueError('사용자계정은 영문, 숫자, 언더스코어(_)만 사용 가능합니다.')
        return v
    
    @field_validator('name')
    def validate_name(cls, v):
        """이름 검증 - XSS 방지"""
        # 위험한 문자 제거 (HTML 태그, 스크립트 등)
        dangerous_chars = ['<', '>', '"', "'", '&', '/', '\\']
        if any(char in v for char in dangerous_chars):
            raise ValueError('이름에 특수문자(<, >, ", \', &, /, \\)는 사용할 수 없습니다.')
        return v.strip()
    
    @field_validator('extension')
    def validate_extension(cls, v):
        """내선번호 검증 - 숫자와 하이픈만 사용가능"""
        if v is None or (isinstance(v, str) and v.strip() == ""):
            return None
        if not re.match(r'^[0-9\-]+$', v):
            raise ValueError('내선번호는 숫자와 하이픈(-)만 사용 가능합니다.')
        return v.strip()

class UserUpdate(BaseModel):
    username: Optional[str] = Field(None, min_length=4, max_length=50, description="로그인 ID")
    password: Optional[str] = Field(None, max_length=128)  # min_length 제거하고 validator에서 처리
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    extension: Optional[str] = Field(None, max_length=20)
    role: Optional[UserRole] = Field(None, description="권한")
    company_id: Optional[int] = Field(None, description="소속업체 ID")

    @field_validator('username')
    def validate_username(cls, v):
        """사용자계정 검증 - SQL Injection 방지"""
        if v is None:
            return v
        if len(v) < 4:
            raise ValueError('사용자계정은 최소 4자 이상이어야 합니다.')
        if not re.match(r'^[a-zA-Z0-9_]+$', v):
            raise ValueError('사용자계정은 영문, 숫자, 언더스코어(_)만 사용 가능합니다.')
        return v

    @field_validator('password')
    def validate_password_strength(cls, v):
        """비밀번호 복잡도 검증 - UserCreate와 동일"""
        if v is None or (isinstance(v, str) and v.strip() == ""):
            return None  # 빈 문자열은 None으로 처리 (변경 안 함)

        errors = []

        if len(v) < 8:
            errors.append("최소 8자 이상")

        if not re.search(r'[a-zA-Z]', v):
            errors.append("영문자 1개 이상")

        if not re.search(r'[0-9]', v):
            errors.append("숫자 1개 이상")

        if errors:
            raise ValueError(f"비밀번호 요구사항 미충족: {', '.join(errors)}")

        return v

    @field_validator('name')
    def validate_name(cls, v):
        """이름 검증 - XSS 방지"""
        if v is None:
            return v
        dangerous_chars = ['<', '>', '"', "'", '&', '/', '\\']
        if any(char in v for char in dangerous_chars):
            raise ValueError('이름에 특수문자(<, >, ", \', &, /, \\)는 사용할 수 없습니다.')
        return v.strip()
    
    @field_validator('extension')
    def validate_extension(cls, v):
        """내선번호 검증 - 숫자와 하이픈만 허용"""
        if v is None or (isinstance(v, str) and v.strip() == ""):
            return None
        if not re.match(r'^[0-9\-]+$', v):
            raise ValueError('내선번호는 숫자와 하이픈(-)만 사용 가능합니다.')
        return v.strip()

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: int
    username: str  # API 표준 필드명 (DB의 account를 매핑)
    name: str
    extension: Optional[str] = None  # API 표준 필드명 (DB의 exten을 매핑)
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