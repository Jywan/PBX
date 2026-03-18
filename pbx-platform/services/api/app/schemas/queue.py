from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class UserSummary(BaseModel):
    id: int
    name: str
    exten: Optional[str]

    class Config:
        from_attributes = True

class QueueMemberCreate(BaseModel):
    user_id: Optional[int] = None
    interface: str
    membername: Optional[str] = None
    penalty: int = 0

class QueueMemberUpdate(BaseModel):
    penalty: Optional[int] = None
    paused: Optional[bool] = None

class QueueMemberResponse(BaseModel):
    id: int
    queue_id: int
    user_id: Optional[int]
    interface: str
    membername: Optional[str]
    penalty: int
    paused: bool
    created_at: datetime
    user: Optional[UserSummary] = None

    class Config:
        from_attributes = True

class QueueCreate(BaseModel):
    name: str
    company_id: Optional[int] = None
    strategy: str = "rrmemory"
    timeout: int = 30
    wrapuptime: int = 0
    maxlen: int =0
    music_on_hold: Optional[str] = None

class QueueUpdate(BaseModel):
    name: Optional[str] = None
    strategy: Optional[str] = None
    timeout: Optional[int] = None
    wrapuptime: Optional[int] = None
    maxlen: Optional[int] = None
    music_on_hold: Optional[str] = None
    is_active: Optional[bool] = None

class QueueResponse(BaseModel):
    id: int
    company_id: Optional[int]
    name: str
    strategy: str
    timeout: int
    wrapuptime: int
    maxlen: int
    music_on_hold: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime
    members: list[QueueMemberResponse] = []

    class Config:
        from_attributes = True