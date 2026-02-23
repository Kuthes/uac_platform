from pydantic import BaseModel, Field
from typing import List, Literal

class ApplicationProtocol(BaseModel):
    id: str = Field(..., description="nDPI protocol name (e.g., youtube)")
    name: str = Field(..., description="Display name (e.g., YouTube)")
    category: str = Field("General", description="Category (Video, Social, P2P)")

class FirewallRule(BaseModel):
    app_id: str
    action: Literal["ACCEPT", "DROP", "REJECT"] = "DROP"
    enabled: bool = True

class FirewallPolicy(BaseModel):
    rules: List[FirewallRule]
