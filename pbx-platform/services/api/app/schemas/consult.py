from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

from pbx_common.models.consultation import ConsultationStatus

class AgentBrief(BaseModel):
    id: int
    name: str
    class Config:
        from_attrbutes = True

class CompanyBrief(BaseModel):
    id: int
    company_name: str
    class Config:
        from_attributes = True

class CategoryBrief(BaseModel):
    id: int
    name: str
    depth: int
    class Config:
        from_attributes = True

class ConsultationCreate(BaseModel):
    agent_id: int
    company_id: int
    call_id: Optional[str] = None
    category_id: Optional[int] = None
    category: Optional[str] = None
    memo: Optional[str] = None
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None

class ConsultationUpdate(BaseModel):
    memo: Optional[str] = None
    category: Optional[str] = None
    category_id: Optional[int] = None
    ended_at: Optional[datetime] = None

class ConsultationLinkCall(BaseModel):
    call_id: str

class ConsultationResponse(BaseModel):
    id: int
    call_id: Optional[str] = None
    agent_id: int
    company_id: int
    original_id: Optional[int] = None
    category_id: Optional[int] = None
    category: Optional[str] = None
    memo: Optional[str] = None
    status: ConsultationStatus
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    agent: Optional[AgentBrief] = None
    company: Optional[CompanyBrief] = None
    category_obj: Optional[CategoryBrief] = None

    class Config:
        from_attributes = True

class ConsultCategoryCreate(BaseModel):
    company_id: int
    parent_id: Optional[int] = None
    name: str
    depth: int
    sort_order: int = 0

class ConsultCategoryUpdate(BaseModel):
    name: Optional[str] = None
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None

class ConsultCategoryResponse(BaseModel):
    id: int
    company_id: int
    parent_id: Optional[int] = None
    name: str
    depth: int
    sort_order: int
    is_active: bool
    created_at: datetime
    children: List["ConsultCategoryResponse"] = []

    class Config:
        from_attributes = True

ConsultCategoryResponse.model_rebuild()