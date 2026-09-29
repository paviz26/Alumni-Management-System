from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.database import Base, engine, ensure_schema_compatibility
from app.db import models  # noqa: F401
from app.routers.admin import router as admin_router
from app.routers.announcements import router as announcements_router
from app.routers.auth import router as auth_router
from app.routers.alumni import router as alumni_router
from app.routers.connections import router as connections_router
from app.routers.events import router as events_router
from app.routers.faculty import router as faculty_router
from app.routers.health import router as health_router
from app.routers.jobs import router as jobs_router
from app.routers.mentorship import router as mentorship_router
from app.routers.notifications import router as notifications_router

ensure_schema_compatibility()
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Alumni Management API",
    description="FastAPI backend for the Alumni Connect system",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router, prefix="/api")
app.include_router(auth_router, prefix="/api")
app.include_router(alumni_router, prefix="/api")
app.include_router(connections_router, prefix="/api")
app.include_router(mentorship_router, prefix="/api")
app.include_router(events_router, prefix="/api")
app.include_router(jobs_router, prefix="/api")
app.include_router(announcements_router, prefix="/api")
app.include_router(notifications_router, prefix="/api")
app.include_router(admin_router, prefix="/api")
app.include_router(faculty_router, prefix="/api")


@app.get("/")
def root() -> dict:
    return {"message": "Alumni Management API"}
