from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

class CompanyCreate(BaseModel):
    company_name: str
    ceo_name: Optional[str] = None
    ceo_phone: Optional[str] = None # 암호화된 문자열이 들어갈 예정

class CompanyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    company_name: str
    ceo_name: Optional[str]
    ceo_phone: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime]