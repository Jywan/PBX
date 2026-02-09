import uuid
from datetime import datetime
from typing import Any, Optional

from sqlalchemy import Integer, Text, BigInteger, Index, TIMESTAMP, func
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base

class Call(Base):
    __tablename__ = "calls"

    id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), nullable=False, server_default=func.now())

    caller_exten: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    callee_exten: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    caller_channel_id: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    callee_channel_id: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    bridge_id: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    started_at: Mapped[Optional[datetime]] = mapped_column(TIMESTAMP(timezone=True), nullable=True)
    answered_at: Mapped[Optional[datetime]] = mapped_column(TIMESTAMP(timezone=True), nullable=True)
    ended_at: Mapped[Optional[datetime]] = mapped_column(TIMESTAMP(timezone=True), nullable=True)
    hangup_cause: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    hangup_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    direction: Mapped[str] = mapped_column(Text, nullable=False, server_default="internal")
    status: Mapped[str] = mapped_column(Text, nullable=False, server_default="new")

Index("idx_calls_created_at", Call.created_at)
Index("idx_calls_extens", Call.caller_exten, Call.callee_exten)

class CallEvent(Base):
    __tablename__ = "call_events"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)

    call_id: Mapped[Optional[uuid.UUID]] = mapped_column(PG_UUID(as_uuid=True), nullable=True)
    ts: Mapped[Optional[datetime]] = mapped_column(TIMESTAMP(timezone=True), nullable=True)
    type: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    channel_id: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    bridge_id: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    raw: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True),nullable=False,server_default=func.now())

Index("idx_call_events_call_id", CallEvent.call_id)
Index("idx_call_events_ts", CallEvent.ts)
Index("idx_call_events_type", CallEvent.type)
Index("idx_call_events_channel_id", CallEvent.channel_id)

