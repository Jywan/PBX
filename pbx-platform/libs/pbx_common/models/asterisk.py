from sqlalchemy import Integer, Text, VARCHAR
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base

class PsEndpoint(Base):
    __tablename__ = "ps_endpoints"

    id: Mapped[str] = mapped_column(VARCHAR(40), primary_key=True)
    transport: Mapped[str] = mapped_column(VARCHAR(40), nullable=True)
    aors: Mapped[str] = mapped_column(VARCHAR(200), nullable=True)
    auth: Mapped[str] = mapped_column(VARCHAR(100), nullable=True)
    context: Mapped[str] = mapped_column(VARCHAR(40), nullable=True, default="internal")
    disallow: Mapped[str] = mapped_column(VARCHAR(200), nullable=True, default="all")
    allow: Mapped[str] = mapped_column(VARCHAR(200), nullable=True, default="ulaw")
    direct_media: Mapped[str] = mapped_column(VARCHAR(3), nullable=True, default="no")
    rtp_symmetric: Mapped[str] = mapped_column(VARCHAR(3), nullable=True, default="yes")


class PsAuth(Base):
    __tablename__ = "ps_auths"
    
    id: Mapped[str] = mapped_column(VARCHAR(40), primary_key=True)
    auth_type: Mapped[str] = mapped_column(VARCHAR(10), nullable=True, default="userpass")
    username: Mapped[str] = mapped_column(VARCHAR(40), nullable=True)
    password: Mapped[str] = mapped_column(VARCHAR(80), nullable=True)


class PsAor(Base):
    __tablename__ = "ps_aors"

    id: Mapped[str] = mapped_column(VARCHAR(40), primary_key=True)
    max_contacts: Mapped[int] = mapped_column(Integer, nullable=True, default=1)
    remove_existing: Mapped[str] = mapped_column(VARCHAR(3), nullable=True, default="yes")


class PsContact(Base):
    __tablename__ = "ps_contacts"

    id: Mapped[str] = mapped_column(VARCHAR(255), primary_key=True)
    uri: Mapped[str] = mapped_column(VARCHAR(511), nullable=True)
    expiration_time: Mapped[str] = mapped_column(VARCHAR(40), nullable=True)
    qualify_frequency: Mapped[int] = mapped_column(Integer, nullable=True, default=0)
    endpoint: Mapped[str] = mapped_column(VARCHAR(40), nullable=True)