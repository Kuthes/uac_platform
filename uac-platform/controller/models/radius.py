from pydantic import BaseModel, Field
from typing import Optional

class RadiusUserCreate(BaseModel):
    username: str
    password: str
    vlan_id: Optional[str] = None
    session_timeout: Optional[int] = Field(None, description="Session timeout in seconds")

class RadiusUser(BaseModel):
    id: int
    username: str
    attribute: str
    op: str
    value: str

    class Config:
        from_attributes = True
