from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class CustomerCreate(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    company_id: Optional[int] = None
    group: str = "normal"
    memo: Optional[str] = None

class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    company_id: Optional[int] = None
    group: Optional[str] = None
    memo: Optional[str] = None

class CustomerResponse(BaseModel):
    id: int
    name: str
    phone: str
    email: Optional[str]
    company_id: Optional[int]
    company_name: Optional[str] = None
    group: str
    memo: str
    created_at: datetime
    last_call_at: Optional[datetime]
    deactivated_at: Optional[datetime]

    model_config = {"from_attributes": True}
