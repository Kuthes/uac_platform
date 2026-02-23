from sqlalchemy import Column, Integer, String, Text, DateTime, BigInteger
from database import Base

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

class RadAcct(Base):
    __tablename__ = "radacct"

    radacctid = Column(BigInteger, primary_key=True, autoincrement=True)
    acctsessionid = Column(String(64), nullable=False, index=True)
    username = Column(String(64), index=True)
    acctstarttime = Column(DateTime)
    acctupdatetime = Column(DateTime)
    acctstoptime = Column(DateTime, index=True)
    acctsessiontime = Column(Integer)
    acctinputoctets = Column(BigInteger)
    acctoutputoctets = Column(BigInteger)
    callingstationid = Column(String(50))
    framedipaddress = Column(String(15))
