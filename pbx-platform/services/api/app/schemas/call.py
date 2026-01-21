from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel

class CallResponse(BaseModel):
    # --- 기본 식별자 ---
    id: UUID
    
    # --- 시간 정보 ---
    created_at: datetime
    started_at: Optional[datetime] = None
    answered_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    
    # --- 전화번호 정보 ---
    caller_exten: Optional[str] = None
    callee_exten: Optional[str] = None
    
    # --- 통화 상태 및 방향 ---
    direction: str       # internal, inbound 등
    status: str          # ended, up, new 등
    hangup_reason: Optional[str] = None
    hangup_cause: Optional[int] = None # 숫자 코드도 필요하다면 추가
    
    # --- 내부 시스템 정보 (필요한 경우에만 노출) ---
    # bridge_id: Optional[str] = None
    # caller_channel_id: Optional[str] = None
    # callee_channel_id: Optional[str] = None

    class Config:
        # DB 객체(ORM)를 읽어서 JSON으로 변환
        from_attributes = True