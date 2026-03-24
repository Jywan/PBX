from __future__ import annotations

import enum
import uuid
from datetime import datetime
from typing import Optional, TYPE_CHECKING

from sqlalchemy import BigInteger, Enum, ForeignKey, Index, Integer, Text, TIMESTAMP, func
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base

if TYPE_CHECKING:
    from .user import User
    from .company import Company
    from .consult_category import ConsultCategory
    

class ConsultationStatus(enum.Enum):
    ACTIVE      = "ACTIVE"      # 현재 유효 상담이력
    INACTIVE    = "INACTIVE"    # 소프트 삭제
    SUPERSEDED  = "SUPERSEDED"  # 수정으로 대체된 원본

class Consultation(Base):
    __tablename__ = "consultations"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    call_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("calls.id", ondelete="SET NULL"), nullable=True
    )
    agent_id: Mapped[int] = mapped_column(
        ForeignKey("user.id", ondelete="RESTRICT"), nullable=False
    )
    company_id: Mapped[int] = mapped_column(
        ForeignKey("company.id", ondelete="RESTRICT"), nullable=False
    )
    original_id: Mapped[Optional[int]] = mapped_column(
        BigInteger, ForeignKey("consultations.id", ondelete="SET NULL"), nullable=True
    )
    category_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("consult_categories.id", ondelete="SET NULL"), nullable=True
    )
    memo:     Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    category: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[ConsultationStatus] = mapped_column(
        Enum(ConsultationStatus, native_enum=False),
        nullable=False,
        server_default="ACTIVE",
    )
    started_at: Mapped[Optional[datetime]] = mapped_column(TIMESTAMP(timezone=True), nullable=True)
    ended_at:   Mapped[Optional[datetime]] = mapped_column(TIMESTAMP(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    agent:        Mapped[Optional["User"]]             = relationship("User",            foreign_keys=[agent_id],    lazy="selectin")
    company:      Mapped[Optional["Company"]]          = relationship("Company",         foreign_keys=[company_id],  lazy="selectin")
    category_obj: Mapped[Optional["ConsultCategory"]]  = relationship("ConsultCategory", foreign_keys=[category_id], lazy="selectin")


Index("idx_consultations_call_id",     Consultation.call_id)
Index("idx_consultations_agent_id",    Consultation.agent_id)
Index("idx_consultations_company_id",  Consultation.company_id)
Index("idx_consultations_status",      Consultation.status)
Index("idx_consultations_created_at",  Consultation.created_at)
Index("idx_consultations_original_id", Consultation.original_id)
Index("idx_consultations_category_id", Consultation.category_id)