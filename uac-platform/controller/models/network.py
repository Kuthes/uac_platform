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

class VpnPeer(BaseModel):
    name: str = Field(..., description="Peer Name / Site Name")
    mode: Literal["L2", "L3"] = Field("L3", description="L2 (Bridged) or L3 (Routed)")
    endpoint: str = Field(..., description="Remote Public IP:Port")
    public_key: str = Field(..., description="WireGuard Public Key or SoftEther Cert")
    allowed_ips: Optional[str] = Field(None, description="Routed subnets (L3 only)")
    target_vlan: Optional[str] = Field(None, description="Local VLAN to bridge (L2 only)")
    is_active: bool = Field(True, description="Tunnel status administrative toggle")

class NetworkProfile(BaseModel):
    id: str = Field(..., description="Unique Profile ID")
    name: str = Field(..., description="Profile Name (e.g., Guest Wi-Fi)")
    vlan_id: Optional[int] = Field(None, ge=1, le=4094, description="VLAN ID to tag")
    ip_cidr: Optional[str] = Field(None, description="IP Address with CIDR (e.g., 192.168.10.1/24)")
    dhcp_server_enabled: bool = Field(False, description="Enable DHCP Server via CoovaChilli")

class PhysicalPort(BaseModel):
    name: str = Field(..., description="Hardware Interface name (e.g., eth0)")
    mac_address: str = Field(..., description="Hardware MAC Address")
    operstate: str = Field("unknown", description="Link status (up/down)")
    speed: int = Field(-1, description="Link speed in Mbps")
    assigned_profile_id: Optional[str] = Field(None, description="ID of the assigned NetworkProfile")
