from fastapi import APIRouter, HTTPException
from typing import List
from models.network import InterfaceConfig, VlanCreate, NetworkProfile
from services.netplan import NetplanService
from services.hardware import HardwareService

router = APIRouter(
    prefix="/system/network",
    tags=["network"]
)

@router.get("/interfaces")
def list_interfaces():
    return NetplanService.list_interfaces()

@router.post("/vlan")
def create_vlan(vlan: VlanCreate):
    try:
        result = NetplanService.create_vlan(vlan)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/interface")
def modify_interface(config: InterfaceConfig):
    try:
        return NetplanService.modify_interface(config)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/apply")
def apply_network_changes():
    return NetplanService.apply_config()

# --- Hardware Discovery & Port Orchestration ---

@router.get("/ports")
def get_physical_ports():
    return HardwareService.get_physical_ports()

@router.post("/ports/{port_name}/assign/{profile_id}")
def assign_profile_to_port(port_name: str, profile_id: str):
    # Pass 'none' to unassign
    if profile_id.lower() == "none":
        profile_id = None
    
    ports = HardwareService.assign_profile_to_port(port_name, profile_id)
    # Regenerate config for all ports
    NetplanService.generate_from_profiles()
    return ports

@router.get("/profiles")
def get_network_profiles():
    return HardwareService.get_network_profiles()

@router.post("/profiles")
def save_network_profile(profile: NetworkProfile):
    res = HardwareService.save_network_profile(profile.model_dump())
    NetplanService.generate_from_profiles()
    return res

@router.delete("/profiles/{profile_id}")
def remove_network_profile(profile_id: str):
    res = HardwareService.delete_network_profile(profile_id)
    NetplanService.generate_from_profiles()
    return res

# --- Hardware Discovery & Port Orchestration ---

@router.get("/ports")
def get_physical_ports():
    return HardwareService.get_physical_ports()

@router.post("/ports/{port_name}/assign/{profile_id}")
def assign_profile_to_port(port_name: str, profile_id: str):
    # Pass 'none' to unassign
    if profile_id.lower() == "none":
        profile_id = None
    return HardwareService.assign_profile_to_port(port_name, profile_id)

@router.get("/profiles")
def get_network_profiles():
    return HardwareService.get_network_profiles()

@router.post("/profiles")
def save_network_profile(profile: NetworkProfile):
    return HardwareService.save_network_profile(profile.model_dump())

@router.delete("/profiles/{profile_id}")
def remove_network_profile(profile_id: str):
    return HardwareService.delete_network_profile(profile_id)
