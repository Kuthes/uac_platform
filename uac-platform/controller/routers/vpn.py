from fastapi import APIRouter, HTTPException
from typing import List
from models.network import VpnPeer
from services.vpn import VpnConfigService

router = APIRouter(
    prefix="/system/vpn",
    tags=["VPN Configuration"]
)

@router.get("/peers", response_model=List[dict])
def get_vpn_peers():
    return VpnConfigService.get_all_peers()

@router.post("/peers", response_model=dict)
def add_vpn_peer(peer: VpnPeer):
    # Ensure name uniqueness
    existing_peers = VpnConfigService.get_all_peers()
    if any(p["name"] == peer.name for p in existing_peers):
        raise HTTPException(status_code=400, detail="Peer name already exists")
    
    return VpnConfigService.add_peer(peer)

@router.delete("/peers/{peer_name}")
def remove_vpn_peer(peer_name: str):
    VpnConfigService.delete_peer(peer_name)
    return {"message": f"Peer {peer_name} removed"}
