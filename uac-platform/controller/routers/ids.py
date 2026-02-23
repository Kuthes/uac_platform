from fastapi import APIRouter
from models.security import IdsConfig # type: ignore
from services.ids import IDSService

router = APIRouter(
    prefix="/system/ids",
    tags=["Intrusion Detection System"]
)

@router.get("/config")
def get_ids_config():
    return IDSService.get_config()

@router.post("/config")
def update_ids_config(config: IdsConfig):
    return IDSService.save_config(config)

@router.get("/alerts")
def get_ids_alerts():
    return IDSService.get_recent_alerts(limit=100)
