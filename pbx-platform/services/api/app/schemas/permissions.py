from pydantic import BaseModel
from typing import List, Optional
from pbx_common.models import PermissionType

class PermissionAction(BaseModel):
    id: Optional[int] = None
    code: str
    name: str
    is_active: bool = True

class PermissionUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    is_active: Optional[bool] = None

class MenuTemplateCreate(BaseModel):
    menu_code: str
    menu_name: str
    actions: List[PermissionAction] = []

class UserPermissionAssign(BaseModel):
    user_id: int
    menu_id: int
    permission_ids: List[int] = []
