import os
import json
from models.portal import PortalSettings # type: ignore

CONFIG_STORE = "/opt/uac-controller/portal_settings.json"

class PortalSettingsService:
    @staticmethod
    def get_settings() -> dict:
        if not os.path.exists(CONFIG_STORE):
            # Return defaults matching the Pydantic model
            return PortalSettings().model_dump()
        
        try:
            with open(CONFIG_STORE, "r") as f:
                return json.load(f)
        except Exception:
            return PortalSettings().model_dump()

    @staticmethod
    def save_settings(settings: PortalSettings) -> dict:
        os.makedirs(os.path.dirname(CONFIG_STORE), exist_ok=True)
        data = settings.model_dump()
        with open(CONFIG_STORE, "w") as f:
            json.dump(data, f, indent=4)
        return data
