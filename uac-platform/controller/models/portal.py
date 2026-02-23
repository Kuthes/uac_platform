from pydantic import BaseModel, Field

class PortalSettings(BaseModel):
    brand_name: str = Field("Universal Access", description="Main Title on the splash page")
    primary_color: str = Field("#4F46E5", description="Hex color code for primary buttons")
    welcome_text: str = Field("Welcome to our network. Please click agree to connect.", description="Sub-header welcome text")
    terms_text: str = Field("By connecting to this network, you agree to our Acceptable Use Policy.", description="Terms of Service text")
    background_image_url: str = Field("", description="Optional URL to splash background image")
    require_terms_acceptance: bool = Field(True, description="Require clicking an Agree checkbox before authenticating")
