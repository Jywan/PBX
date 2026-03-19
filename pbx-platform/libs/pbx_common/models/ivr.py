from datetime import datetime
from typing import Any, Optional, TYPE_CHECKING
from sqlalchemy import Integer, Text, Boolean, ForeignKey, TIMESTAMP, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base

if TYPE_CHECKING:
    from .queue import Queue

class IvrFlow(Base):
    __tablename__ = "ivr_flows"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    company_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("company.id", ondelete="SET NULL"), nullable=True
    )
    is_preset: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    nodes: Mapped[list["IvrNode"]] = relationship(
        "IvrNode", back_populates="flow", cascade="all, delete-orphan"
    )


class IvrNode(Base):
    __tablename__ = "ivr_nodes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    flow_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("ivr_flows.id", ondelete="CASCADE"), nullable=False
    )
    parent_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("ivr_nodes.id", ondelete="CASCADE"), nullable=True
    )
    queue_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("queues.id", ondelete="SET NULL"), nullable=True
    )
    dtmf_key: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    node_type: Mapped[str] = mapped_column(Text, nullable=False)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    config: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False, default=dict)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    flow: Mapped["IvrFlow"] = relationship("IvrFlow", back_populates="nodes")
    children: Mapped[list["IvrNode"]] = relationship(
        "IvrNode", cascade="all, delete-orphan", foreign_keys=[parent_id]
    )
    sound: Mapped[Optional["IvrSound"]] = relationship(
        "IvrSound", back_populates="node", uselist=False, cascade="all, delete-orphan"
    )
    queue: Mapped[Optional["Queue"]] = relationship("Queue", back_populates="ivr_nodes")


class IvrSound(Base):
    __tablename__ = "ivr_sounds"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    node_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("ivr_nodes.id", ondelete="CASCADE"), nullable=False, unique=True
    )
    name: Mapped[str] = mapped_column(Text, nullable=False)
    filename: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    original_filename: Mapped[str] = mapped_column(Text, nullable=False, default="")
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), nullable=False, server_default=func.now()
    )

    node: Mapped["IvrNode"] = relationship("IvrNode", back_populates="sound")