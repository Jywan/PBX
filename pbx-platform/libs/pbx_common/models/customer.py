from __future__ import annotations
from typing import TYPE_CHECKING, Optional
from datetime import datetime
import enum

from sqlalchemy import Integer, Text, Boolean, TIMESTAMP, func, Enum, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base

if TYPE_CHECKING:
    from .company import Company

class CustomerGroup(enum.Enum):
    VIP       = "vip"
    NORMAL    = "normal"
    BLACKLIST = "blacklist"

class Customer(Base):
    __tablename__ = "customer"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    Company_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("company.id"), nullable=False)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    phone: Mapped[str] = mapped_column(Text, nullable=False)
    email: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    group: Mapped[CustomerGroup] = mapped_column(
        Enum(CustomerGroup, native_enum=False),
        nullable=False,
        server_default="normal"
    )
    memo: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="true")

    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), nullable=False, server_default=func.now())
    last_call_at: Mapped[Optional[datetime]] = mapped_column(TIMESTAMP(timezone=True), nullable=True)
    deactivated_at: Mapped[Optional[datetime]] = mapped_column(TIMESTAMP(timezone=True), nullable=True)

    company: Mapped[Optional["Company"]] = relationship("Company", lazy= "selectin")

    @property
    def company_name(self) -> Optional[str]:
        return self.company.company_name if self.company else None

Index("idx_customer_name", Customer.name)
Index("idx_customer_phone", Customer.phone)
Index("idx_customer_group", Customer.group)
Index("idx_customer_is_active", Customer.is_active)
