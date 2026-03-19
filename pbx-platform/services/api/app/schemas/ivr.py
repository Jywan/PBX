from datetime import datetime
from typing import Any, Optional
from pydantic import BaseModel


class IvrSoundResponse(BaseModel):
    id: int
    node_id: int
    name: str
    filename: str
    original_filename: str
    created_at: datetime

    class Config:
        from_attribute = True

class IvrNodeCreate(BaseModel):
    parent_id: Optional[int] = None
    dtmf_key: Optional[str] = None
    node_type: str
    name: str
    config: dict[str, Any]
    sort_order: int = 0
    queue_id: Optional[int] = None

class IvrNodeUpdate(BaseModel):
    parent_id: Optional[int] = None
    dtmf_key: Optional[str] = None
    node_type: Optional[str] = None
    name: Optional[str] = None
    config: Optional[dict[str, Any]] = None
    sort_order: Optional[int] = None
    queue_id: Optional[int] = None

class IvrNodeResponse(BaseModel):
    id: int
    flow_id: int
    parent_id: Optional[int]
    dtmf_key: Optional[str]
    node_type: str
    name: str
    config: dict[str, Any]
    sort_order: int
    queue_id: Optional[int] = None
    sound: Optional[IvrSoundResponse] = None
    class Config:
        from_attributes = True

class IvrFlowCreate(BaseModel):
    name: str
    company_id: Optional[int] = None
    is_preset: bool = False

class IvrFlowUpdate(BaseModel):
    name: Optional[str] = None
    is_active: Optional[bool] = None

class IvrFlowResponse(BaseModel):
    id: int
    name: str
    company_id: Optional[int]
    is_preset: bool
    is_active: bool
    created_at: datetime
    updated_at: datetime
    nodes: list[IvrNodeResponse] = []

    class Config:
        from_attributes = True