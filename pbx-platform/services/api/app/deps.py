from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, List

from pbx_common.utils.security import decode_access_token 
from pbx_common.models import User, UserRole, Permission, UserPermission
from app.db.session import get_db

# 로그인 경로 설정
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    
    # 1. 토큰 해석
    payload = decode_access_token(token)
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="유효하지 않은 인증 정보입니다.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id: Optional[int] = payload.get("id")
    
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="인증 정보를 찾을 수 없습니다.",
        )

    # 3. DB에서 사용자 조회
    user = await db.get(User, user_id)
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="사용자를 찾을 수 없습니다.",
        )
    
    # 4. 비활성화된 계정 체크
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="비활성화된 계정입니다."
        )
        
    return user

# 권한 체크 Functions
def require_role(*allowed_roles: UserRole):
    """
    특정 권한을 요구하는 dependency
    
    사용 예시 :
        @router.post("/admin-only")
        async def admin_route(user: User = Depends(require_role(UserRole.S))):
            ...

    여러 역할 허용:
        @router.get("/managers-and-admins")
        async def route(user: User = Depends(require_role(UserRole.S, UserRole.M))):
            ...
    """

    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"권한이 부족합니다."
            )
        return current_user
    
    return role_checker

def require_permission(*permission_codes: str):
    """
    특정 권한 코드를 요구하는 dependency 

    사용 예시:
        @router.post("/create-user")
        async def create(user: User = Depends(require_permission("USER_CREATE"))):
            ...
    
    여러 권한 요구 (모두 필요):
        @router.delete("/delete-user")
        async def delete(user: User = Depends(require_permission("USER_DELETE", "USER_MANAGE"))):
            ...
    """
    async def permission_checker(
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
    ) -> User:
        # SYSTEM_ADMIN은 모든 권한을 보유한것으로 간주함
        if current_user.role == UserRole.S:
            return current_user
        
        # 사용자 권한 조회
        result = await db.execute(
            select(Permission.code)
            .join(UserPermission, UserPermission.permission_id == Permission.id)
            .where(
                UserPermission.user_id == current_user.id,
                UserPermission.is_active == True
            )
        )
        user_permissions = set(result.scalars().all())
        
        # 필요한 권한을 모두 가지고 있는지 확인
        required_permissions = set(permission_codes)
        if not required_permissions.issubset(user_permissions):
            missing = required_permissions - user_permissions
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"해당 계정에 권한코드가 존재하지 않습니다."
            )
        return current_user
    
    return permission_checker


def require_any_permission(*permission_codes: str):
    """
    여러 권한 중 하나라고 있으면 통과

    사용 예시:
        @router.get("/stats")
        async def stats(user: User = Depends(require_any_permission("STATS_VIEW", "ADMIN"))):
            ...
    """
    async def permission_checker(
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
    ) -> User:
        # SYSTEM_ADMIN은 모든 권한을 보유한것으로 간주함
        if current_user.role == UserRole.S:
            return current_user
        
        # 사용자의 권한 조회
        result = await db.execute(
            select(Permission.code)
            .join(UserPermission, UserPermission.permission_id == Permission.id)
            .where(
                UserPermission.user_id == current_user.id,
                UserPermission.is_active == True,
                Permission.code.in_(permission_codes)
            )
        )
        user_permissions = set(result.scalars().all())

        # 권한중 하나라고 있으면 통과
        if any(perm in user_permissions for perm in permission_codes):
            return current_user
        
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"권한이 부족합니다."
        )
    return permission_checker