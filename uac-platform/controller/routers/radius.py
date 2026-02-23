from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.db import RadCheck, RadReply # type: ignore
from models.radius import RadiusUserCreate, RadiusUser

router = APIRouter(
    prefix="/radius",
    tags=["radius"]
)

@router.post("/users", response_model=dict)
def create_radius_user(user: RadiusUserCreate, db: Session = Depends(get_db)):
    # 1. Check if user already exists
    existing_user = db.query(RadCheck).filter(RadCheck.username == user.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already exists")

    # 2. Add Cleartext-Password to radcheck
    radcheck_entry = RadCheck(
        username=user.username,
        attribute="Cleartext-Password",
        op=":=",
        value=user.password
    )
    db.add(radcheck_entry)

    # 3. Add Session-Timeout if provided
    if user.session_timeout:
        radreply_entry = RadReply(
            username=user.username,
            attribute="Session-Timeout",
            op="=",
            value=str(user.session_timeout)
        )
        db.add(radreply_entry)

    # 4. Add VLAN ID if provided (WISPr-Location-ID or Tunnel-Private-Group-Id depending on setup)
    # For CoovaChilli standard, we might mostly use Coova-VLAN-Id or similar.
    # For now, let's just log it or add standard Tunnel attributes.
    if user.vlan_id:
       # Standard VLAN assignment
       db.add(RadReply(username=user.username, attribute="Tunnel-Type", op="=", value="13")) # VLAN
       db.add(RadReply(username=user.username, attribute="Tunnel-Medium-Type", op="=", value="6")) # IEEE-802
       db.add(RadReply(username=user.username, attribute="Tunnel-Private-Group-Id", op="=", value=user.vlan_id))

    db.commit()
    return {"message": f"User {user.username} created successfully"}

@router.get("/users/{username}")
def get_radius_user(username: str, db: Session = Depends(get_db)):
    checks = db.query(RadCheck).filter(RadCheck.username == username).all()
    replies = db.query(RadReply).filter(RadReply.username == username).all()
    
    if not checks and not replies:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "username": username,
        "checks": [c.attribute for c in checks],
        "replies": [r.attribute for r in replies]
    }
