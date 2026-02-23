from fastapi import APIRouter
from models.portal import PortalSettings # type: ignore
from services.portal_settings import PortalSettingsService

router = APIRouter(
    prefix="/portal",
    tags=["Captive Portal"]
)

@router.get("/settings")
def get_portal_settings():
    """ 
    Publicly accessible endpoint so the unauthenticated 
    Next.js portal can fetch its branding 
    """
    return PortalSettingsService.get_settings()

@router.post("/settings")
def update_portal_settings(settings: PortalSettings):
    """ Requires authentication in a real scenario """
    return PortalSettingsService.save_settings(settings)
