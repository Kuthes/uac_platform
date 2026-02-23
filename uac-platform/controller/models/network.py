from pydantic import BaseModel, Field, IPvAnyAddress
from typing import Optional, List, Literal

class InterfaceConfig(BaseModel):
    name: str = Field(..., description="Interface name (e.g., eth0)")
    dhcp4: bool = Field(False, description="Enable DHCP Client")
    addresses: Optional[List[str]] = Field(None, description="Static IP addresses (CIDR format)")
    gateway4: Optional[str] = Field(None, description="Gateway IP")
    nameservers: Optional[List[str]] = Field(None, description="DNS Servers")

class VlanCreate(BaseModel):
    vlan_id: int = Field(..., ge=1, le=4094, description="VLAN ID (1-4094)")
    parent_interface: str = Field(..., description="Parent interface (e.g., eth1)")
    ip_cidr: str = Field(..., description="IP Address with CIDR (e.g., 192.168.10.1/24)")
    dhcp_server_enabled: bool = Field(True, description="Enable DHCP Server (via CoovaChilli)")
    description: Optional[str] = Field(None, description="Description of this network")
