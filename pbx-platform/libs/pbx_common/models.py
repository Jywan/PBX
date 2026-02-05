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
    M = "MANAGER"

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
    permissions: Mapped[list["Permission"]] = relationship("Permission", secondary="user_permissions", back_populates="users", lazy="selectin")

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

class LoginStatus(enum.Enum):
    LOGIN = "LOGIN"
    LOGOUT = "LOGOUT"

class UserActivity(enum.Enum):
    READY = "READY"
    POST_PROCESSING = "POST_PROCESSING"
    CALLING = "CALLING"
    ON_CALL = "ON_CALL"
    AWAY = "AWAY"
    TRAINING = "TRAINING"
    DISABLED = "DISABLED"

class UserStatus(Base):
    __tablename__ = "user_status"

    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("user.id"), primary_key=True)
    login_status: Mapped[LoginStatus] = mapped_column(
        Enum(LoginStatus, native_enum=False),
        nullable=False,
        server_default="LOGOUT"
    )
    activity: Mapped[UserActivity] = mapped_column(
        Enum(UserActivity, native_enum=False),
        nullable=False,
        server_default="DISABLED"   # 초기상태 혹은 로그아웃시 기본값으로 비활성화 설정
    )
    current_room_id: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), nullable=False, server_default=func.now())
    last_login_at: Mapped[Optional[datetime]] = mapped_column(TIMESTAMP(timezone=True), nullable=True)
    user: Mapped["User"] = relationship("User")

class UserStatusLog(Base):
    __tablename__ = "user_status_log"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("user.id"), nullable=False)
    login_status: Mapped[LoginStatus] = mapped_column(Enum(LoginStatus, native_enum=False), nullable=False)
    activity: Mapped[UserActivity] = mapped_column(Enum(UserActivity, native_enum=False), nullable=False)

    started_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), nullable=False, server_default=func.now())
    ended_at: Mapped[Optional[datetime]] = mapped_column(TIMESTAMP(timezone=True), nullable=True)
    duration: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

class PermissionType(enum.Enum):
    MENU = "MENU"
    ACTION = "ACTION"

class Permission(Base):
    __tablename__ = "permissions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    parent_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("permissions.id", ondelete="CASCADE"), nullable=True)

    code: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    type: Mapped[PermissionType] = mapped_column(Enum(PermissionType, native_enum=False), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="true")
    # 계층 관계 설정
    parent: Mapped[Optional["Permission"]] = relationship("Permission", remote_side=[id], back_populates="children")
    children: Mapped[list["Permission"]] = relationship("Permission", back_populates="parent", cascade="all, delete-orphan")

    # 유저 관계
    users: Mapped[list["User"]] = relationship("User", secondary="user_permissions", back_populates="permissions")

class UserPermission(Base):
    __tablename__ = "user_permissions"

    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("user.id", onupdate="CASCADE", ondelete="CASCADE"), primary_key=True)
    permission_id: Mapped[int] = mapped_column(Integer, ForeignKey("permissions.id", onupdate="CASCADE", ondelete="CASCADE"), primary_key=True)

    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="true")
    create_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())