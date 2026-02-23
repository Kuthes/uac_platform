from sqlalchemy import Column, Integer, String, Text
from ..database import Base

class RadCheck(Base):
    __tablename__ = "radcheck"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(64), index=True, nullable=False, default="")
    attribute = Column(String(64), nullable=False, default="")
    op = Column(String(2), nullable=False, default="==")
    value = Column(String(253), nullable=False, default="")

class RadReply(Base):
    __tablename__ = "radreply"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(64), index=True, nullable=False, default="")
    attribute = Column(String(64), nullable=False, default="")
    op = Column(String(2), nullable=False, default="=")
    value = Column(String(253), nullable=False, default="")

class RadUserGroup(Base):
    __tablename__ = "radusergroup"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(64), index=True, nullable=False, default="")
    groupname = Column(String(64), index=True, nullable=False, default="")
    priority = Column(Integer, nullable=False, default=1)
