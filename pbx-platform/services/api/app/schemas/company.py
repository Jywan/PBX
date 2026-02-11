from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from typing import Optional

class CompanyCreate(BaseModel):
    company_name: str = Field(validation_alias="name")
    manager_name: Optional[str] = Field(None, validation_alias="representative")
    manager_phone: Optional[str] = Field(None, validation_alias="contact")
    use_callback: bool = Field(False, validation_alias="callback")
    is_active: bool = Field(True, validation_alias="active")

class CompanyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str = Field(validation_alias="company_name")
    representative: Optional[str] = Field(None, validation_alias="manager_name")
    contact: Optional[str] = Field(None, validation_alias="manager_phone")
    active: bool = Field(validation_alias="is_active")
    callback: bool = Field(validation_alias="use_callback")
    registered_at: datetime = Field(validation_alias="created_at")

class CompanyUpdate(BaseModel):
    company_name: Optional[str] = Field(None, validation_alias="name")
    manager_name: Optional[str] = Field(None, validation_alias="representative")
    manager_phone: Optional[str] = Field(None, validation_alias="contact")
    use_callback: Optional[bool] = Field(None, validation_alias="callback")
    is_active: Optional[bool] = Field(None, validation_alias="active")
