from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.db.models import Announcement, User
from app.schemas import AnnouncementCreate

router = APIRouter(prefix="/announcements", tags=["Announcements"])


@router.get("")
def list_announcements(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    rows = db.query(Announcement).order_by(Announcement.created_on.desc()).all()
    return [{
        "announcement_id": item.announcement_id,
        "title": item.title,
        "content": item.content,
        "created_on": item.created_on.isoformat() if item.created_on else None,
        "status": item.status,
    } for item in rows]


@router.get("/recent")
def recent_announcements(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    rows = db.query(Announcement).order_by(Announcement.created_on.desc()).limit(5).all()
    return [{
        "announcement_id": item.announcement_id,
        "title": item.title,
        "content": item.content,
        "published_at": item.created_on.isoformat() if item.created_on else None,
    } for item in rows]


@router.post("", status_code=status.HTTP_201_CREATED)
def create_announcement(payload: AnnouncementCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role not in {"ADMIN", "FACULTY"}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only faculty/admin can create announcements")
    announcement = Announcement(user_id=current_user.user_id, title=payload.title.strip(), content=payload.content.strip(), status="PUBLISHED")
    db.add(announcement)
    db.commit()
    db.refresh(announcement)
    return {"announcement_id": announcement.announcement_id, "title": announcement.title, "status": announcement.status}
