from __future__ import annotations
from typing import TYPE_CHECKING, Optional, List
from datetime import datetime
import enum

from sqlalchemy import Integer, Text, Boolean, TIMESTAMP, func, Enum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base

if TYPE_CHECKING:
    from .user import User

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
    
    parent: Mapped[Optional["Permission"]] = relationship("Permission", remote_side=[id], back_populates="children")
    children: Mapped[List["Permission"]] = relationship("Permission", back_populates="parent", cascade="all, delete-orphan")

    users: Mapped[List["User"]] = relationship("User", secondary="user_permissions", back_populates="permissions")

class UserPermission(Base):
    __tablename__ = "user_permissions"

    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("user.id", onupdate="CASCADE", ondelete="CASCADE"), primary_key=True)
    permission_id: Mapped[int] = mapped_column(Integer, ForeignKey("permissions.id", onupdate="CASCADE", ondelete="CASCADE"), primary_key=True)

    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="true")
    create_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())