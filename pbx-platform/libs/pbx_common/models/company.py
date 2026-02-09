from __future__ import annotations
from typing import TYPE_CHECKING, Optional, List
from datetime import datetime

from sqlalchemy import Integer, Text, Boolean, TIMESTAMP, func, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base

if TYPE_CHECKING:
    from .user import User

class Company(Base):
    __tablename__ = "company"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    company_name: Mapped[str] = mapped_column(Text, nullable=False)
    manager_name: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    manager_phone: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    use_callback: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="false")
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="true")
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), nullable=True, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), nullable=True, server_default=func.now(), 
                                                onupdate=func.now())

    users: Mapped[list["User"]] = relationship("User", back_populates="company")
    
Index("idx_company_name", Company.company_name)
Index("idx_company_is_active", Company.is_active)