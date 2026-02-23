from fastapi import APIRouter, HTTPException
from typing import List
from models.firewall import FirewallPolicy
from services.firewall import FirewallService

router = APIRouter(
    prefix="/security",
    tags=["security"]
)

@router.get("/apps")
def list_apps():
    return FirewallService.get_supported_apps()

@router.get("/policy")
def get_policy():
    return FirewallService.get_policy()

@router.post("/policy")
def update_policy(policy: FirewallPolicy):
    try:
        return FirewallService.update_policy(policy)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
