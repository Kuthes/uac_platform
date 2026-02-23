from fastapi import APIRouter, HTTPException
from typing import List
from models.network import InterfaceConfig, VlanCreate
from services.netplan import NetplanService

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
