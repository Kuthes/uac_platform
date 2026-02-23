from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from routers import radius, network, firewall, analytics, vpn, ids, portal
from database import engine
from models.db import Base

# Create DB Tables if they don't exist (Quick init for dev)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Universal Access Controller API",
    description="Backend API for the UAC Platform",
    version="1.0.0"
)

app.include_router(radius.router)
app.include_router(network.router)
app.include_router(firewall.router)
app.include_router(analytics.router)
app.include_router(vpn.router)
app.include_router(ids.router)
app.include_router(portal.router)

# CORS Configuration
origins = [
    "http://localhost:3000",  # Next.js Frontend
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Universal Access Controller API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "uac-controller"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
