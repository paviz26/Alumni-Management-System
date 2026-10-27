from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.dependencies import require_admin
from app.db.database import get_db
from app.db.models import Alumni, Department, Event, Notification, User
from app.schemas import ReasonPayload
from app.core.compat import CompatibleAPIRoute

router = APIRouter(prefix="/admin", tags=["Administration"], route_class=CompatibleAPIRoute)


@router.get("/statistics")
def admin_statistics(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    total_users = db.query(User).count()
    total_alumni = db.query(User).filter(User.role == "ALUMNI").count()
    total_students = db.query(User).filter(User.role == "STUDENT").count()
    total_faculty = db.query(User).filter(User.role == "FACULTY").count()
    total_events = db.query(Event).count()
    total_mentorships = db.query(func.count()).select_from(__import__('app.db.models', fromlist=['Mentorship']).Mentorship).scalar() or 0
    return {
        "totalUsers": total_users,
        "totalAlumni": total_alumni,
        "totalStudents": total_students,
        "totalFaculty": total_faculty,
        "totalEvents": total_events,
        "totalMentorships": total_mentorships,
    }


@router.get("/pending-verifications")
def pending_verifications(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    rows = db.query(Alumni).filter(Alumni.verification_status.in_(["PENDING", "REJECTED"]) | (Alumni.verified == False)).order_by(Alumni.alumni_id.desc()).all()
    return [{
        "alumni_id": row.alumni_id,
        "first_name": row.first_name,
        "last_name": row.last_name,
        "department_code": (db.query(Department).filter(Department.department_id == row.department_id).first().department_code if row.department_id else None),
        "graduation_year": row.graduation_year,
        "company_name": row.current_company,
        "designation": row.designation,
        "location": row.location,
        "verified": bool(row.verified or row.verification_status == "VERIFIED"),
        "verification_status": row.verification_status or "PENDING",
    } for row in rows]


@router.get("/alumni-verification")
def alumni_verification(status: str | None = None, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    query = db.query(Alumni)
    if status:
        status = status.upper()
        query = query.filter(Alumni.verification_status == status)
    rows = query.order_by(Alumni.alumni_id.desc()).all()
    return [{
        "alumni_id": row.alumni_id,
        "first_name": row.first_name,
        "last_name": row.last_name,
        "department_code": (db.query(Department).filter(Department.department_id == row.department_id).first().department_code if row.department_id else None),
        "graduation_year": row.graduation_year,
        "company_name": row.current_company,
        "designation": row.designation,
        "location": row.location,
        "verified": bool(row.verified or row.verification_status == "VERIFIED"),
        "verification_status": row.verification_status or "PENDING",
    } for row in rows]


@router.get("/pending-events")
def pending_events(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    rows = db.query(Event).filter(Event.status == "PENDING").order_by(Event.created_at.desc()).all()
    return [{
        "event_id": row.event_id,
        "title": row.title,
        "event_date": row.event_date.isoformat() if row.event_date else None,
        "venue": row.venue,
        "creator_name": (db.query(User).filter(User.user_id == row.created_by).first().first_name or "") + " " + (db.query(User).filter(User.user_id == row.created_by).first().last_name or "") if db.query(User).filter(User.user_id == row.created_by).first() else "User",
    } for row in rows]


@router.get("/recent-activity")
def recent_activity(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    rows = db.query(Notification).order_by(Notification.created_on.desc()).limit(10).all()
    return [{
        "notification_id": row.notification_id,
        "description": row.message,
        "created_at": row.created_on.isoformat() if row.created_on else None,
    } for row in rows]


@router.put("/verify-alumni/{alumni_id}")
def verify_alumni(alumni_id: int, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    alumni = db.query(Alumni).filter(Alumni.alumni_id == alumni_id).first()
    if not alumni:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alumni not found")
    alumni.verification_status = "VERIFIED"
    alumni.verified = True
    db.commit()
    return {"success": True, "message": "Alumni verified", "verification_status": alumni.verification_status, "verified": alumni.verified}


@router.put("/reject-alumni/{alumni_id}")
def reject_alumni(alumni_id: int, payload: ReasonPayload | None = None, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    alumni = db.query(Alumni).filter(Alumni.alumni_id == alumni_id).first()
    if not alumni:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alumni not found")
    alumni.verification_status = "REJECTED"
    alumni.verified = False
    db.commit()
    return {"success": True, "message": "Alumni verification rejected", "verification_status": alumni.verification_status}


@router.put("/approve-event/{event_id}")
def approve_event(event_id: int, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    event = db.query(Event).filter(Event.event_id == event_id).first()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    event.status = "APPROVED"
    db.commit()
    return {"success": True, "message": "Event approved", "event_id": event.event_id, "status": event.status}
