from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from sqlalchemy import Boolean, ForeignKey, Index, Integer, Text, TIMESTAMP, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base


class ConsultCategory(Base):
    __tablename__ = "consult_categories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    company_id: Mapped[int] = mapped_column(ForeignKey("company.id", ondelete="CASCADE"), nullable=False)
    parent_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("consult_categories.id", ondelete="RESTRICT"), nullable=True
    )
    name: Mapped[str] = mapped_column(Text, nullable=False)
    depth: Mapped[int] = mapped_column(Integer, nullable=False)     # 0: 대분류 / 1: 중분류 / 2: 소분류
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="true")
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), nullable=False, server_default=func.now()
    )

    children: Mapped[List["ConsultCategory"]] = relationship(
        "ConsultCategory",
        foreign_keys=[parent_id],
        lazy="selectin",
        order_by="ConsultCategory.sort_order",
    )

Index("idx_consult_categories_company_id", ConsultCategory.company_id)
Index("idx_consult_categories_parent_id", ConsultCategory.parent_id)
Index("idx_consult_categories_depth", ConsultCategory.depth)