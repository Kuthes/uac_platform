from pydantic import BaseModel, Field
from typing import Literal

class IdsConfig(BaseModel):
    enabled: bool = Field(False, description="Enable Intrusion Detection/Prevention")
    engine: Literal["suricata", "snort"] = Field("suricata", description="The underlying IDS engine to use")
    mode: Literal["detection", "prevention"] = Field("detection", description="IDS (Alerting) vs IPS (Active Blocking)")
    interfaces: list[str] = Field(["eth0"], description="The physical interfaces to monitor")
