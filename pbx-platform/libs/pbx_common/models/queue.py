from __future__ import annotations
from typing import TYPE_CHECKING, Optional, List
from datetime import datetime

from sqlalchemy import Integer, Text, Boolean, TIMESTAMP, ForeignKey, func, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base

if TYPE_CHECKING:
    from .company import Company
    from .user import User

class Queue(Base):
    __tablename__ = "queues"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    company_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("company.id", ondelete="SET NULL"), nullable=True
    )
    name: Mapped[str] = mapped_column(Text, nullable=False)
    strategy: Mapped[str] = mapped_column(Text, nullable=False, server_default="rrmemory")
    timeout: Mapped[int] = mapped_column(Integer, nullable=False, server_default="30")
    wrapuptime: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")
    maxlen: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")
    music_on_hold: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="true")

    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    company: Mapped[Optional["Company"]] = relationship("Company", back_populates="queues")
    members: Mapped[List["QueueMember"]] = relationship("QueueMember", back_populates="queue", cascade="all, delete-orphan")

class QueueMember(Base):
    __tablename__ = "queue_members"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    queue_id: Mapped[int] = mapped_column(Integer, ForeignKey("queues.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("user.id", ondelete="SET NULL"), nullable=True)
    interface: Mapped[str] = mapped_column(Text, nullable=False)
    membername: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    penalty: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")
    paused: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="false")
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), nullable=False, server_default=func.now()
    )
    queue: Mapped["Queue"] = relationship("Queue", back_populates="members")
    user: Mapped[Optional["User"]] = relationship("User", back_populates="queue_members")

Index("idx_queue_company_id", Queue.company_id)
Index("idx_queue_member_queue_id", QueueMember.queue_id)
Index("idx_queue_member_user_id", QueueMember.user_id)