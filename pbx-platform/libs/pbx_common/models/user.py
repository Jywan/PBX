from __future__ import annotations
from typing import TYPE_CHECKING, Optional, List
from datetime import datetime
import enum

from sqlalchemy import Integer, Text, Boolean, TIMESTAMP, func, Enum, ForeignKey, BigInteger, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base

if TYPE_CHECKING:
    from .company import Company
    from .permission import Permission

# --- Enums ---
class UserRole(enum.Enum):
    S = "SYSTEM_ADMIN"
    A = "AGENT"
    M = "MANAGER"

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
    updated_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), nullable=True, server_default=func.now(), onupdate=func.now())
    deactivated_at: Mapped[Optional[datetime]] = mapped_column(TIMESTAMP(timezone=True), nullable=True)

    company: Mapped["Company"] = relationship("Company", back_populates="users")
    permissions: Mapped[List["Permission"]] = relationship("Permission", secondary="user_permissions", back_populates="users", lazy="selectin")

Index("idx_user_account", User.account)
Index("idx_user_exten", User.exten)
Index("idx_user_is_active", User.is_active)
Index("idx_user_role", User.role)


class UserStatus(Base):
    __tablename__ = "user_status"

    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("user.id"), primary_key=True)
    login_status: Mapped[LoginStatus] = mapped_column(Enum(LoginStatus, native_enum=False), nullable=False, server_default="LOGOUT")
    activity: Mapped[UserActivity] = mapped_column(Enum(UserActivity, native_enum=False), nullable=False, server_default="DISABLED")
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