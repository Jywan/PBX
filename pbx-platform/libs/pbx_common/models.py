from __future__ import annotations

import enum
import uuid
from datetime import datetime
from typing import Any, Optional

from sqlalchemy import BigInteger, Integer, Text, Index, Boolean, func, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSONB, TIMESTAMP
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass

# 통화 테이블
class Call(Base):
    __tablename__ = "calls"

    id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), nullable=False, server_default=func.now())

    # 도메인 키 (현재는 내부콜)
    caller_exten: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    callee_exten: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # ARI 채널/브릿지
    caller_channel_id: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    callee_channel_id: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    bridge_id: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # 상태 타임라인
    started_at: Mapped[Optional[datetime]] = mapped_column(TIMESTAMP(timezone=True), nullable=True)
    answered_at: Mapped[Optional[datetime]] = mapped_column(TIMESTAMP(timezone=True), nullable=True)
    ended_at: Mapped[Optional[datetime]] = mapped_column(TIMESTAMP(timezone=True), nullable=True)
    hangup_cause: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    hangup_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # 조회 편의
    direction: Mapped[str] = mapped_column(Text, nullable=False, server_default="internal")
    status: Mapped[str] = mapped_column(Text, nullable=False, server_default="new")

Index("idx_calls_created_at", Call.created_at)
Index("idx_calls_extens", Call.caller_exten, Call.callee_exten)

# 통화 이벤트 테이블
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


class UserRole(enum.Enum):
    S = "SYSTEM_ADMIN"
    A = "AGENT"

# 사용자 테이블
class User(Base):
    __tablename__ = "user"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    company_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("company.id"), nullable=True)
    account: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    account_pw: Mapped[str] = mapped_column(Text, nullable=False)
    exten: Mapped[str] = mapped_column(Text, nullable=True)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole, native_enum=False), nullable=False, server_default="A")
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="true")
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), nullable=True, server_default=func.now(),
                                                onupdate=func.now(),)
    deactivated_at: Mapped[Optional[datetime]] = mapped_column(TIMESTAMP(timezone=True), nullable=True)

    company: Mapped["Company"] = relationship("Company", back_populates="users")

Index("idx_user_account", User.account)
Index("idx_user_exten", User.exten)
Index("idx_user_is_active", User.is_active)
Index("idx_user_role", User.role)


class Company(Base):
    __tablename__ = "company"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    company_name: Mapped[str] = mapped_column(Text, nullable=False)
    ceo_name: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    ceo_phone: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="true")
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), nullable=True, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), nullable=True, server_default=func.now(), 
                                                onupdate=func.now())

    users: Mapped[list["User"]] = relationship("User", back_populates="company")

Index("idx_company_name", Company.company_name)
Index("idx_company_is_active", Company.is_active)