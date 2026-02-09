from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from typing import Optional

class CompanyCreate(BaseModel):
    name: str = Field(validation_alias="company_name")
    representative: Optional[str] = Field(validation_alias="manager_name")
    contact: Optional[str] = Field(validation_alias="manager_phone") # 암호화된 문자열이 들어갈 예정
    callback: bool = Field(validation_alias="use_callback")

class CompanyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str = Field(validation_alias="company_name")
    representative: Optional[str] = Field(validation_alias="manager_name")
    contact: Optional[str] = Field(validation_alias="manager_phone")
    active: bool = Field(validation_alias="is_active")
    callback: bool = Field(validation_alias="use_callback")
    registered_at: datetime = Field(validation_alias="created_at")