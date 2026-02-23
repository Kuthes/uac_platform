from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models.db import RadAcct # type: ignore
from sqlalchemy import func

router = APIRouter(
    prefix="/analytics",
    tags=["Analytics"]
)

@router.get("/summary")
def get_analytics_summary(db: Session = Depends(get_db)):
    # Calculate total active sessions (acctstoptime is null for active sessions)
    active_sessions = db.query(RadAcct).filter(RadAcct.acctstoptime == None).count()
    
    # Calculate total bandwidth consumed across all history
    total_input = db.query(func.sum(RadAcct.acctinputoctets)).scalar() or 0
    total_output = db.query(func.sum(RadAcct.acctoutputoctets)).scalar() or 0
    
    total_bytes = total_input + total_output
    total_mb = round(total_bytes / (1024 * 1024), 2)
    
    # Get recent completed sessions
    recent_sessions = db.query(RadAcct).filter(RadAcct.acctstoptime != None).order_by(RadAcct.acctstoptime.desc()).limit(10).all()
    
    return {
        "active_users": active_sessions,
        "total_bandwidth_mb": total_mb,
        "recent_sessions": [
            {
                "username": s.username,
                "mac": s.callingstationid,
                "ip": s.framedipaddress,
                "duration_sec": s.acctsessiontime,
                "download_mb": round((s.acctoutputoctets or 0) / (1024 * 1024), 2),
                "upload_mb": round((s.acctinputoctets or 0) / (1024 * 1024), 2)
            } for s in recent_sessions
        ]
    }
