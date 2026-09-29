from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.db.models import Notification, User

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("")
def list_notifications(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    rows = db.query(Notification).filter(Notification.user_id == current_user.user_id).order_by(Notification.created_on.desc()).all()
    return [{
        "notification_id": item.notification_id,
        "message": item.message,
        "type": item.type,
        "read": item.is_read,
        "created_at": item.created_on.isoformat() if item.created_on else None,
    } for item in rows]


@router.put("/{notification_id}/read")
def mark_notification_read(notification_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    notification = db.query(Notification).filter(Notification.notification_id == notification_id, Notification.user_id == current_user.user_id).first()
    if not notification:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    notification.is_read = True
    db.commit()
    return {"success": True, "message": "Notification marked as read"}


@router.put("/mark-all-read")
def mark_all_notifications_read(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    rows = db.query(Notification).filter(Notification.user_id == current_user.user_id, Notification.is_read == False).all()
    for row in rows:
        row.is_read = True
    db.commit()
    return {"success": True, "message": f"Marked {len(rows)} notifications as read"}
